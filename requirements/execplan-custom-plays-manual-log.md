# ExecPlan: Custom Plays + Manual Session Logging Vertical Slice

## 1. Objective
Implement `custom play` management and `manual log` entry as a single vertical slice, integrated into `history` with clear `manual log` vs `auto log` differentiation.

## 2. Why
This delivers the next roadmap slice after timer/history, enabling off-app practice capture and reusable practice presets while preserving calm, multi-device usability.

## 3. Scope
Included:
- Custom play CRUD:
  - create
  - edit
  - delete
  - favorite
- Manual log form:
  - duration
  - meditation type
  - session timestamp
  - validation rules from requirements
- History integration:
  - show manual and auto entries together
  - clear badges for `manual log` vs `auto log`
- Local-only persistence for custom plays and manual logs
- Responsive UX across mobile/tablet/desktop

Excluded:
- playlists
- summaries
- sankalpa logic
- backend/cloud sync
- notifications
- real audio playback changes

## 4. Source documents
- AGENTS.md
- PLANS.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md

## 5. Affected files and modules
- `src/types/*`
- `src/utils/*`
- `src/features/timer/*` (shared app state currently hosted here)
- `src/pages/PracticePage.tsx`
- `src/pages/HistoryPage.tsx`
- `src/index.css`
- focused tests for custom play + manual log logic
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Practice screen includes a calm `custom play` section with simple create/edit/delete/favorite controls.
- History includes a manual log form with clear validation messages.
- History list clearly differentiates entry sources with badges (`auto log`, `manual log`).
- Forms remain touch-friendly and readable at all breakpoints.

## 7. Data and state model
- Add `custom play` domain model with favorite flag and editable metadata.
- Extend `session log` source to include `manual log`.
- Keep timer/session state as local-first and persist:
  - timer settings
  - session logs
  - custom plays

## 8. Risks
- Overloading Practice or History screen hierarchy.
- Validation behavior becoming noisy.
- Regression risk in existing auto log/timer behavior while extending shared state.

## 9. Milestones
1. Add domain types, validators, and helper builders for custom play and manual log.
2. Extend persistence and shared context methods.
3. Implement Practice custom play management UI.
4. Implement History manual log form and source badges.
5. Add focused tests for utilities/state behavior.
6. Update docs and verify.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual checks:
  - create/edit/delete/favorite custom play
  - manual log validation errors
  - successful manual log in history
  - clear `manual log` / `auto log` distinction

## 11. Decision log
- Keep this slice local-only and avoid extra dependencies.
- Keep custom play management embedded in existing route-level screens to stay bounded.

## 12. Progress log
- Completed: prompt and docs review.
- Completed: domain types and helpers for `custom play` and `manual log`.
- Completed: local persistence wiring for custom plays and session log updates.
- Completed: Practice screen `custom play` create/edit/delete/favorite UI.
- Completed: History manual log form and unified source/status badges.
- Completed: focused tests for custom play and manual log utilities.
- Completed: verification commands:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
- Completed: decisions and session handoff documentation updates.
