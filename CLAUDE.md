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