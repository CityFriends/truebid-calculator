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
