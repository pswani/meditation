# ExecPlan: Custom Plays Implementation (Pass 2)

## 1. Objective
Implement the remaining custom-play capabilities requested in Milestone B prompt 04, including optional sound presets and media/session metadata selection, while preserving the current local-first front-end architecture.

## 2. Why
Custom plays should reduce setup friction for repeat practice. Adding reusable sound presets and explicit media/session selection improves consistency and trust in personalized practice flows.

## 3. Scope
Included:
- custom play create/edit/delete/favorite behavior (preserved and refined)
- assign meditation type and duration
- optional custom-play start/end sound presets
- media/session selection backed by stored metadata entries
- local-first persistence for extended custom-play model
- integration with timer setup and favorite custom-play quick-use flows
- responsive UX in Practice tools
- focused tests for validation, persistence, and media API boundary logic

Excluded:
- real backend/database implementation (not present in workspace)
- actual file upload/management workflows
- server endpoint implementation outside this front-end repo
- playlist/sankalpa refactors

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
- prompts/milestone-b-practice-composition/04-implement-custom-plays.md

## 5. Affected files and modules
- `src/types/customPlay.ts`
- `src/types/mediaAsset.ts` (new)
- `src/utils/mediaAssetApi.ts` (new)
- `src/utils/customPlay.ts`
- `src/utils/storage.ts`
- `src/features/customPlays/CustomPlayManager.tsx`
- `src/pages/HomePage.tsx`
- focused tests:
  - `src/utils/customPlay.test.ts`
  - `src/utils/storage.test.ts`
  - `src/features/customPlays/CustomPlayManager.test.tsx`
  - `src/utils/mediaAssetApi.test.ts` (new)
- docs:
  - `requirements/decisions.md`
  - `requirements/session-handoff.md`

## 6. UX behavior
- Users can create and edit custom plays with:
  - name
  - meditation type
  - duration
  - optional start/end sounds
  - optional media/session selection
- `Use Custom Play` applies duration, meditation type, and sound presets into timer setup.
- Custom play list displays selected media/session context when present.
- Layout remains touch-friendly and responsive across phone/tablet/desktop.

## 7. Data and state model
- Extend custom-play model with:
  - `startSound`
  - `endSound`
  - media metadata references (`mediaAssetId`, `mediaAssetLabel`, `mediaAssetPath`)
- Add a local media metadata catalog/API-boundary utility exposing a list endpoint contract and metadata objects.
- Keep persistence local-first via localStorage; add custom-play load normalization/validation for backward compatibility.

## 8. Risks
- Existing stored custom plays may miss new fields; migration defaults must avoid data loss.
- More form controls can increase cognitive load; labels/copy must remain clear.
- API-boundary simulation must stay explicit to avoid implying backend availability.

## 9. Milestones
1. Add custom-play/media types and API-boundary utility.
2. Extend custom-play helpers and persistence normalization.
3. Update custom-play UI and timer/home integration.
4. Add focused tests.
5. Run verification commands.
6. Update decisions and session handoff.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual checks:
  - create/edit/delete/favorite custom play
  - apply custom play updates timer sounds and setup fields
  - select media/session metadata and verify it persists

## 11. Decision log
- Keep this slice local-first and represent server metadata via a front-end API boundary utility because backend services are not in this workspace.
- Favor backward-compatible custom-play loading defaults for existing local data.

## 12. Progress log
- Completed: reviewed prompt and required source docs.
- Completed: added custom-play/media types and API-boundary utility.
- Completed: extended custom-play helpers and persistence normalization for new fields.
- Completed: integrated custom-play sound/media controls into Practice tools UI and Home shortcut behavior.
- Completed: added focused tests for validation, persistence, component integration, and media API logic.
- Completed: verification commands:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
- Completed: documentation updates in decisions and session handoff.
