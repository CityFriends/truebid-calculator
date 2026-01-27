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
| WBS creation methods | Three: drag-drop, per-card button, bulk generate | Flexibility - single vs batch, discoverable vs power-user |
| WBS editing UI | Tabbed slideout (not modal) | More space, organized sections, consistent with app patterns |
| AI trigger | Auto-generate on all three methods | AI does heavy lifting, user reviews |
| Role source | Account Center Labor Categories | Single source of truth for company roles |

## Tasks

### Phase 1: Data Loading
- [ ] Load real requirements from Upload tab extraction (check localStorage, context, or Supabase)
- [ ] Load Labor Categories from Account Center
- [ ] Pass Labor Categories to `/api/generate-wbs` as `availableRoles`

### Phase 2: WBS Generation
- [ ] Create shared `generateWbsForRequirement()` function
- [ ] Wire drag-drop to call shared function
- [ ] Add [✨] button to each unmapped requirement card
- [ ] Wire per-card button to call shared function
- [ ] Wire Bulk Generate button to call shared function in loop
- [ ] Show loading state on WBS card while generating
- [ ] Handle errors gracefully with toast

### Phase 3: WBS Slideout Panel
- [ ] Replace cramped modal with 600px slideout
- [ ] Add tabs: Overview, Labor, Assumptions, Risks
- [ ] Overview tab: title, why, what, not included, estimate method, confidence
- [ ] Labor tab: role cards with hours by period, rationale, confidence
- [ ] Labor tab: "Add Role" dropdown shows only Labor Categories
- [ ] Assumptions tab: editable list with add/remove
- [ ] Risks tab: risk cards with probability, impact, mitigation
- [ ] Save/Cancel footer

### Phase 4: Integration
- [ ] Update requirement card to show mapped status after WBS creation
- [ ] Roll up WBS labor hours to Roles & Pricing tab
- [ ] Calculate FTE per role (hours ÷ 2080)

### Phase 5: API Updates
- [ ] Update `/api/generate-wbs` prompt to also return risks
- [ ] Ensure API uses `availableRoles` for labor assignment

## Done When
- [ ] Requirements load from real extraction data (not mock)
- [ ] All three generation methods trigger AI and create complete WBS
- [ ] Labor Categories from Account Center appear in role dropdowns
- [ ] WBS slideout has all four tabs, all editable
- [ ] Saving WBS persists data
- [ ] Roles & Pricing shows aggregated FTE from WBS labor estimates

## Open Questions
- [ ] Where exactly are requirements saved after Upload extraction? (localStorage key, context, or Supabase)
- [ ] Where exactly are Labor Categories stored? (Account Center storage location)
- [ ] Should risks also be AI-generated or just manual?

## Session Log
| Date | What was done | What's next |
|------|---------------|-------------|
| 2025-01-19 | Created dev plan from handover doc | Start Phase 1: find where requirements and Labor Categories are stored |
