# Claude Code Instructions for TrueBid

## CRITICAL RULES
1. **ONE change at a time** - Never make multiple unrelated changes in a single session
2. **NO clever solutions** - Make the minimal change that fixes the issue
3. **NO React Portals, NO major refactors** unless explicitly asked
4. **ASK before committing** - Show me the diff first with `git diff`
5. **TEST before declaring done** - Verify the full flow works

## Project Context
- This is a government contracting proposal tool
- Main files: estimate-tab.tsx, upload-tab.tsx, extract-rfp/route.ts, generate-wbs/route.ts
- UI follows shadcn/ui patterns with Tailwind
- State managed via React Context (ProposalContext)

## When making changes
1. Show me what you plan to change BEFORE editing
2. Make the smallest possible fix
3. Run `git diff` and show me the output
4. Wait for my approval before committing

## DO NOT
- Add new dependencies without asking
- Refactor working code
- Make "improvements" I didn't ask for
- Create multiple commits for one fix

## Git Workflow

- Work on `develop` branch only unless explicitly told otherwise
- Do NOT create new branches without explicit permission
- Commit after each logical fix with clear messages (e.g., "fix: dashboard proposal title display")
- Test changes before committing

## Database Schema

The Supabase `proposals` table has these columns:
- id, company_id, title, solicitation_number
- client, agency, client_agency (use client + agency, not client_agency)
- status, contract_type, due_date
- estimated_value, total_value, period_of_performance (jsonb)
- team_size, progress, starred, archived
- created_at, updated_at

## API Routes

- All routes use service role key via `lib/supabase/server.ts`
- Auth check: `supabase.auth.getUser()` at start of each route
- Return 401 if no session
- Log errors with full details before returning 500

## Code Style

- snake_case for database columns
- camelCase for TypeScript/React
- Transform between them in API routes

## Review Council

When asked to "consult the council" or "ask the review council", convene all relevant perspectives below to evaluate the topic. Present a brief summary from each applicable role, then synthesize into a **Council Recommendation** with clear action items.

Format:
```
🎯 Product Manager: [brief take]
🎨 UI Designer: [brief take]
💻 Frontend Developer: [brief take]
...

📋 COUNCIL RECOMMENDATION:
- [Action item 1]
- [Action item 2]
```

Not every role needs to weigh in on every question - use judgment on which perspectives are relevant.

### Perspectives

### 🎯 Product Manager
- Does this meet the stated requirements?
- What edge cases are unhandled?
- Is this the MVP or are we over-engineering?
- What would make the client say "wow"?
- What would make the client complain?
- Is this shippable for a demo tomorrow?

### 💼 Business Analyst
- Does this solve the user's actual problem?
- What assumptions are we making about user behavior?
- Is there a simpler way to achieve the same outcome?
- What's the ROI of this feature vs. effort to build it?

### 🔬 UX Researcher
- What user need does this address?
- What research or evidence supports this design decision?
- What assumptions are we making that we should validate?
- Who are the edge-case users we might be forgetting?
- What would a usability test reveal?

### 🧭 UX Designer
- Can a user complete their goal in 3 clicks or less?
- Is the information architecture intuitive?
- Are there unnecessary friction points?
- Is the cognitive load reasonable?
- Are error messages helpful and actionable?
- Does the flow match user mental models?

### 🎨 UI Designer
- Is the visual hierarchy clear? (What do you see first, second, third?)
- Are spacing and alignment consistent?
- Does typography guide the eye appropriately?
- Are interactive elements obviously clickable/tappable?
- Is there appropriate use of color for meaning?
- Does this feel polished or rushed?
- Is it consistent with the rest of the app?

### ♿ Accessibility Specialist
- Does this meet WCAG 2.1 AA standards?
- Is color contrast sufficient (4.5:1 for text)?
- Can this be navigated with keyboard only?
- Are there appropriate ARIA labels?
- Do focus states exist and make sense?
- Will this work with a screen reader?
- Are touch targets at least 44x44px?

### 💻 Frontend Developer
- Is the code clean and maintainable?
- Are components appropriately sized (not too big, not too granular)?
- Is state management appropriate for the complexity?
- Are there performance concerns? (re-renders, bundle size)
- Is this following React/Next.js best practices?
- Would a new developer understand this code?

### 🏗️ Solutions Architect
- Is this the right technical approach for the problem?
- Will this scale if usage grows 10x?
- Are we creating technical debt we'll regret?
- How does this integrate with existing systems?
- Are there simpler alternatives we should consider?

### 🔧 DevOps Engineer
- Will this deploy cleanly?
- Are there cold start concerns?
- Is error logging/monitoring in place?
- Are environment variables handled correctly?
- Is this secure in production?

### 🔒 Security Reviewer
- Is authentication/authorization handled correctly?
- Is user input validated and sanitized?
- Are there any data exposure risks?
- Is sensitive data encrypted/protected?
- Would this pass a basic penetration test?

### 🧪 QA Tester
- What happens if the user does something unexpected?
- What if the API is slow or fails?
- What if the user has no data yet (empty states)?
- What if the user has tons of data (pagination, performance)?
- What happens on slow/offline connections?
- Have all the happy paths been tested?
- Have all the sad paths been tested?

### 📝 Technical Writer
- Is this feature documented?
- Could someone else maintain this code?
- Are complex functions commented?
- Is the README up to date?
- Would a handoff to another team be smooth?

### 🤝 Client Success Manager
- Will the client understand how to use this?
- What questions will they ask?
- Does this look professional enough for a client demo?
- What will impress them? What might disappoint them?
- Is there anything that needs explanation before they see it?