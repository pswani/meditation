# ExecPlan: Custom Plays Review Remediation (Pass 3)

## 1. Objective
Fix the important issues identified in `docs/review-custom-plays.md` while keeping scope bounded to custom plays and minimum supporting flows.

## 2. Why
Custom plays are a repeat-use feature. Weak persistence validation and unclear media-model presentation can reduce trust and make the flow feel technical rather than calm.

## 3. Scope
Included:
- enforce domain validity during custom-play load normalization
- improve media-model clarity in custom-play UI copy and metadata presentation
- add explicit create/update success feedback in custom-play manager
- add focused tests for persistence filtering and UX behavior changes

Excluded:
- custom-play search/filter controls
- favorite-first sorting
- dense mobile action redesign
- backend API/file/database implementation

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
- docs/review-custom-plays.md

## 5. Affected files and modules
- `src/utils/storage.ts`
- `src/features/customPlays/CustomPlayManager.tsx`
- `src/utils/storage.test.ts`
- `src/features/customPlays/CustomPlayManager.test.tsx`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Users see clear save confirmation after create/update custom play actions.
- Media session details prioritize human-readable metadata and explain that file paths are managed metadata, not editable inputs.
- Invalid persisted custom plays with malformed core domain values are filtered out on load.

## 7. Data and state model
- Custom-play load normalization validates:
  - meditation type enum
  - duration > 0
- Entries failing core validation are dropped.
- Existing backward-compatible defaults for optional extended fields are preserved.

## 8. Risks
- Stricter load validation may hide previously stored malformed custom plays.
- Additional feedback UI can conflict with existing status regions if not carefully scoped.

## 9. Milestones
1. Add plan and confirm remediation scope.
2. Implement storage validation tightening.
3. Implement media-model clarity copy updates and save-success feedback.
4. Update focused tests.
5. Run verification commands.
6. Update decisions and handoff.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual checks:
  - create and update custom play shows explicit success
  - media metadata guidance is clear and non-technical
  - malformed custom plays are filtered from persisted load

## 11. Decision log
- Favor dropping malformed custom-play entries over accepting invalid domain values.
- Keep media file-path data visible as secondary managed metadata, not a primary editable concept.

## 12. Progress log
- Completed: reviewed prompt and required source documents.
- Completed: tightened custom-play load normalization domain validation rules.
- Completed: improved media-model clarity copy and metadata hierarchy in custom-play UI.
- Completed: added explicit create/update save success feedback.
- Completed: updated focused tests for storage validation and custom-play manager UX.
- Completed: verification commands:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
- Completed: updated decisions and session handoff docs.
