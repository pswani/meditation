# ExecPlan: UX Refinement for Custom Plays + Manual Logging

## 1. Objective
Implement the critical and important UX improvements from `docs/ux-review-custom-plays.md` for:
- `custom play` flow in Practice
- `manual log` flow in History
- `history` integration and responsive readability

## 2. Why
The current slice is functionally complete but has trust and clarity gaps. This refinement improves confidence (destructive action safety), lowers ambiguity (clear labels and feedback), and improves scanability across mobile/tablet/desktop while preserving calm, minimal UX.

## 3. Scope
Included:
- Add delete confirmation for `custom play` removal
- Add explicit success feedback after saving `manual log`
- Clarify duplicate custom-play form labels
- Add `Use custom play` action to prefill timer setup
- Add helper text for `session timestamp`
- Improve responsive layout for custom play and history rows on medium/large screens
- Focused tests for changed load-bearing behavior

Excluded:
- playlist work
- summaries/sankalpa work
- backend/cloud sync
- notification/audio playback changes
- broad navigation/shell refactors

## 4. Source documents
- AGENTS.md
- PLANS.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- docs/ux-review-custom-plays.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md

## 5. Affected files and modules
- `src/features/customPlays/CustomPlayManager.tsx`
- `src/pages/HistoryPage.tsx`
- `src/utils/customPlay.ts`
- `src/utils/customPlay.test.ts`
- `src/index.css`
- focused page/component tests for new UX behavior
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Deleting a `custom play` requires explicit confirmation.
- `custom play` rows include a primary `Use Custom Play` action that prefills timer setup fields.
- After manual log save, user sees clear success confirmation.
- Manual log timestamp field includes helper guidance.
- Practice and History list rows remain calm on mobile and become more scannable on tablet/desktop.

## 7. Data and state model
- Keep local-only persistence and existing state shape.
- Introduce helper logic for applying a `custom play` to timer settings (bounded field mapping).
- No schema migration required.

## 8. Risks
- Accidental scope creep into timer flow behavior.
- Over-designing list layouts and harming calm visual tone.
- Test brittleness from repeated labels and multi-form pages.

## 9. Milestones
1. Add helper logic and tests for applying custom play to timer setup fields.
2. Implement custom play UX improvements (labels, use action, delete confirmation).
3. Implement manual log UX improvements (success feedback, timestamp helper text).
4. Refine responsive layout for custom play/history rows.
5. Add focused UI tests for key changed behavior.
6. Run full verification and update docs.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual behavior checks:
  - delete confirmation protects against accidental custom play removal
  - `Use custom play` prefills timer setup fields
  - manual log shows success confirmation
  - list readability improves on medium/large breakpoints

## 11. Decision log
- Prefer confirmation (not undo queue) for bounded complexity and predictable behavior.
- Implement `Use custom play` as direct timer-setup prefill without adding new routes.
- Keep visual changes minimal and rely on layout improvements, not ornamental UI.

## 12. Progress log
- Completed: prompt and source-doc review.
- Completed: custom play helper for timer-setup prefill.
- Completed: custom play UX updates:
  - clearer field labels
  - primary `Use Custom Play`
  - explicit delete confirmation
- Completed: manual log UX updates:
  - post-save success feedback
  - `session timestamp` helper guidance
- Completed: responsive list/readability improvements for custom plays and history on medium/large screens.
- Completed: focused tests for:
  - custom play prefill helper
  - custom play apply/delete-confirm flow
  - manual log success feedback behavior
- Completed: verification commands:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
- Completed: decisions and session handoff documentation updates.
