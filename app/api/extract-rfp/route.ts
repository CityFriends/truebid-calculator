import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { extractText } from 'unpdf'

// Types for extraction response
interface ExtractedMetadata {
  title: string
  solicitationNumber: string
  clientAgency: string
  contractType: 'ffp' | 'tm' | 'cpff' | 'idiq' | 'hybrid' | 'unknown'
  naicsCode: string
  responseDeadline: string
  periodOfPerformance: {
    base: number
    options: number
  }
  placeOfPerformance: string
  setAside: string
}

interface ExtractedRequirement {
  id: string
  title: string
  text: string
  type: 'delivery' | 'reporting' | 'staffing' | 'compliance' | 'governance' | 'transition' | 'other'
  sourceSection: string
  pageNumber: number | null
}

interface SuggestedRole {
  title: string
  quantity: number
  rationale: string
}

interface ExtractionResponse {
  success: boolean
  metadata: ExtractedMetadata
  requirements: ExtractedRequirement[]
  suggestedRoles: SuggestedRole[]
  rawTextLength: number
  error?: string
}

// System prompt for extraction
const EXTRACTION_PROMPT = `Extract data from this government RFP/SOW.

RESPOND WITH ONLY A JSON OBJECT. No preamble, no explanation.

{
  "metadata": {
    "title": "project name",
    "solicitationNumber": "number",
    "clientAgency": "Department of State",
    "contractType": "cpff",
    "naicsCode": "541512",
    "responseDeadline": "N/A",
    "periodOfPerformance": { "base": 1, "options": 2 },
    "placeOfPerformance": "Washington DC",
    "setAside": "N/A"
  },
  "requirements": [
    {"id": "REQ-001", "title": "Short Title", "text": "brief requirement", "type": "delivery", "sourceSection": "Section", "pageNumber": null}
  ],
  "suggestedRoles": []
}

Extract 15-20 requirements. Keep "text" field SHORT (under 100 chars). 
Include: user stories, security, AWS/infrastructure, compliance.

JSON ONLY - must start with { and end with }`

export async function POST(request: NextRequest) {
  try {
    // Check for API key first
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Anthropic API key not configured' },
        { status: 500 }
      )
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    // Get the form data with the PDF file
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Check file type
    if (!file.type.includes('pdf')) {
      return NextResponse.json(
        { success: false, error: 'File must be a PDF' },
        { status: 400 }
      )
    }

    // Check file size (limit to 10MB)
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = new Uint8Array(bytes)

    // Extract text using unpdf
    let pdfText: string
    try {
      const { text } = await extractText(buffer, { mergePages: true })
      pdfText = text
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError)
      return NextResponse.json(
        { success: false, error: 'Failed to parse PDF. The file may be corrupted or password-protected.' },
        { status: 400 }
      )
    }

    // Truncate text if too long (Claude can handle 150k+ chars)
    const MAX_CHARS = 150000
    const truncatedText = pdfText.length > MAX_CHARS 
      ? pdfText.substring(0, MAX_CHARS) + '\n\n[Document truncated due to length...]'
      : pdfText

    // Check if we have enough text
    if (truncatedText.length < 100) {
      return NextResponse.json(
        { success: false, error: 'Could not extract sufficient text from PDF. It may be a scanned image.' },
        { status: 400 }
      )
    }

    // Call Claude for extraction
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `${EXTRACTION_PROMPT}\n\nExtract ALL requirements from this government solicitation document. Do not limit yourself - extract every single requirement you find:\n\n${truncatedText}`
        }
      ],
    })

    // Get response text
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    
    if (!responseText) {
      return NextResponse.json(
        { success: false, error: 'No response from AI model' },
        { status: 500 }
      )
    }

    // Parse the JSON response (handle potential markdown code blocks)
    let extracted
    try {
      // Try to extract JSON from response (Claude might wrap in ```json```)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : responseText
      extracted = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText.substring(0, 500))
      return NextResponse.json(
        { success: false, error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

    // Validate and provide defaults
    const response: ExtractionResponse = {
      success: true,
      metadata: {
        title: extracted.metadata?.title || 'Untitled Solicitation',
        solicitationNumber: extracted.metadata?.solicitationNumber || 'N/A',
        clientAgency: extracted.metadata?.clientAgency || 'N/A',
        contractType: extracted.metadata?.contractType || 'unknown',
        naicsCode: extracted.metadata?.naicsCode || 'N/A',
        responseDeadline: extracted.metadata?.responseDeadline || 'N/A',
        periodOfPerformance: {
          base: extracted.metadata?.periodOfPerformance?.base || 1,
          options: extracted.metadata?.periodOfPerformance?.options || 0,
        },
        placeOfPerformance: extracted.metadata?.placeOfPerformance || 'N/A',
        setAside: extracted.metadata?.setAside || 'N/A',
      },
      requirements: (extracted.requirements || []).map((req: any, index: number) => ({
        id: req.id || `REQ-${String(index + 1).padStart(3, '0')}`,
        title: req.title || '',
        text: req.text || '',
        type: req.type || 'other',
        sourceSection: req.sourceSection || 'N/A',
        pageNumber: req.pageNumber ?? null,
      })),
      suggestedRoles: (extracted.suggestedRoles || []).map((role: any) => ({
        title: role.title || 'Unnamed Role',
        quantity: role.quantity || 1,
        rationale: role.rationale || '',
      })),
      rawTextLength: pdfText.length,
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Extraction error:', error)
    
    // Handle Anthropic-specific errors
    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          { success: false, error: 'Invalid Anthropic API key' },
          { status: 401 }
        )
      }
      if (error.status === 429) {
        return NextResponse.json(
          { success: false, error: 'Rate limit exceeded. Please try again in a moment.' },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to extract RFP data' },
      { status: 500 }
    )
  }
}