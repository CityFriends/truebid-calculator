# Estimate Tab Restoration

## Status
🟡 In Progress

## Goal
Restore full WBS functionality in the redesigned two-column Estimate tab. AI generates complete WBS elements, user reviews/edits in tabbed slideout panel.

## Context
- Two-column layout (Requirements ↔ WBS) is good, keep it
- Redesign broke data connections and oversimplified WBS creation
- Requirements should load from Upload tab extraction (not mock data)
- Labor roles must come from Account Center Labor Categories
- WBS labor hours must roll up to Roles & Pricing as FTE

## Key Files
- `components/tabs/estimate-tab.tsx` - Main component
- `app/api/generate-wbs/route.ts` - AI generation endpoint
- `components/tabs/upload-tab.tsx` - Where requirements are extracted/saved
- `app/account/labor/page.tsx` - Labor Categories source
- `components/tabs/roles-and-pricing-tab.tsx` - Where hours aggregate

## Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| WBS creation methods | Two: per-card button, bulk generate | Drag-drop removed as redundant - per-card ✨ button is more discoverable |
| WBS editing UI | Tabbed slideout (not modal) | More space, organized sections, consistent with app patterns |
| AI trigger | Auto-generate on both methods | AI does heavy lifting, user reviews |
| Role source | Account Center Labor Categories | Single source of truth for company roles |

## Tasks

### Phase 1: Data Loading ✅
- [x] Load real requirements from Upload tab extraction (check localStorage, context, or Supabase)
  - Requirements stored in context: `extractedRequirements` via `useAppContext()`
  - Persisted via `requirementsApi.list(proposalId)` / `requirementsApi.create()`
  - Upload tab loads from API on mount, stores in context
- [x] Load Labor Categories from Account Center
  - Labor Categories = `companyRoles` in context via `useAppContext()`
  - Persisted via `rolesApi.list()` with localStorage fallback (`'truebid-company-roles'`)
- [x] Pass Labor Categories to `/api/generate-wbs` as `availableRoles`
  - Already implemented in estimate-tab.tsx:367-378

### Phase 2: WBS Generation ✅
- [x] Create shared `generateWbsForRequirements()` function
  - Created in estimate-tab.tsx:361-412
  - Returns generated WBS elements, handles API call and state updates
- [x] Add [✨] button to each unmapped requirement card
  - Added in requirements-view.tsx, shows "Generate" button on unmapped requirements
  - Also shows WBS count badge for mapped requirements
- [x] Wire per-card button to call shared function
  - `handleGenerateSingleWbs(reqId)` in estimate-tab.tsx:436-452
- [x] Wire Bulk Generate button to call shared function
  - `handleGenerateWbs()` in estimate-tab.tsx:419-434
- [x] Show loading state on requirement card while generating
  - Uses `generatingIds` Set to track per-requirement loading state
- [x] Handle errors gracefully with toast
  - Added toast success/error notifications via sonner
- ~~Wire drag-drop~~ - Removed as redundant (per-card button is more discoverable)

### Phase 3: WBS Slideout Panel ✅
- [x] Replace cramped modal with 600px slideout
  - Already using Sheet component with 600px width
- [x] Add tabs: Overview, Labor, Assumptions, Risks
  - Implemented with shadcn Tabs component
- [x] Overview tab: title, why, what, not included, estimate method, confidence
  - Also includes linked requirements
- [x] Labor tab: role cards with hours by period, rationale, confidence
  - Per-role confidence selector added
- [x] Labor tab: "Add Role" dropdown shows only Labor Categories
  - Uses `availableRoles` filtered from `companyRoles`
- [x] Assumptions tab: editable list with add/remove
- [x] Risks tab: risk cards with probability, impact, mitigation
  - Full CRUD for risks with probability/impact selectors
- [x] Save/Cancel footer
  - Already implemented

### Phase 4: Integration
- [x] Update requirement card to show mapped status after WBS creation
  - Fixed: API returns `linkedRequirementId` but client expected `linkedRequirementIds`. Added transform in `generateWbsForRequirements()`
- [ ] Roll up WBS labor hours to Roles & Pricing tab
- [ ] Calculate FTE per role (hours ÷ 2080)

### Phase 5: API Updates
- [ ] Update `/api/generate-wbs` prompt to also return risks
- [ ] Ensure API uses `availableRoles` for labor assignment

## Done When
- [x] Requirements load from real extraction data (not mock)
- [x] Both generation methods (per-card, bulk) trigger AI and create complete WBS
- [x] Labor Categories from Account Center appear in role dropdowns
- [x] WBS slideout has all four tabs, all editable
- [x] Saving WBS persists data (in context, persists via estimateWbsElements)
- [ ] Roles & Pricing shows aggregated FTE from WBS labor estimates

## Open Questions
- [x] Where exactly are requirements saved after Upload extraction?
  - **Answer**: Context state `extractedRequirements` + Supabase via `requirementsApi`. Upload tab calls `requirementsApi.create(proposalId, requirements)` after extraction.
- [x] Where exactly are Labor Categories stored?
  - **Answer**: Context state `companyRoles` + API via `rolesApi.list()` + localStorage fallback (`'truebid-company-roles'`). The Labor Page (`components/account/labor-page.tsx`) manages these.
- [ ] Should risks also be AI-generated or just manual?

## Session Log
| Date | What was done | What's next |
|------|---------------|-------------|
| 2025-01-19 | Created dev plan from handover doc | Start Phase 1: find where requirements and Labor Categories are stored |
| 2025-01-27 | Investigated data storage: requirements in `extractedRequirements` context + `requirementsApi`, Labor Categories in `companyRoles` context + `rolesApi`. Found Phase 1 already implemented in estimate-tab.tsx | Phase 2: Add per-card ✨ button for single requirement WBS generation |
| 2025-01-27 | Phase 2 partial: Created shared `generateWbsForRequirements()` function, added per-card ✨ Generate button, wired single/bulk generation with loading states and toast notifications | Phase 2: Wire drag-drop OR Phase 3: Improve WBS slideout panel |
| 2025-01-27 | Removed drag-drop from scope (redundant with per-card button). Phase 2 complete. | Phase 3: WBS Slideout Panel with tabs |
| 2025-01-27 | Phase 3 complete: Added tabbed layout (Overview, Labor, Assumptions, Risks), added full Risks functionality with probability/impact/mitigation | Phase 4: Integration - Roll up hours to Roles & Pricing |
| 2025-01-27 | Bug fix: WBS preview not showing generated elements. API returned `linkedRequirementId` (singular) but client expected `linkedRequirementIds` (array). Added transform. Also added view switch to Labor Matrix after generation. | Phase 4: Integration |
| 2025-01-27 | UI Redesign: Converted top tabs to 240px sidebar navigation pattern. Created `EstimateSidebar` component with nav items (Requirements, Labor Matrix, Timeline) and Source Documents section. Updated estimate-tab.tsx to use sidebar with conditional rendering. | Phase 4: Integration - Roll up hours to Roles & Pricing |
