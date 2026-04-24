# ExecPlan: UX Review Follow-Up

## Objective
Fix the UX review's high and medium priority issues across the web app and the native iPhone app without broad refactors.

## Why
The app already covers the intended journeys, but the review found release-affecting polish and trust issues: mobile shell overlap, inconsistent navigation labels, stale validation, technical copy in user-facing flows, dense Goals layout on phone, and iPhone banner clutter. Fixing these issues should make the product feel calmer and more trustworthy on the core supported devices.

## Scope
Included:
- web shell spacing, skip-link behavior, and mobile bottom-nav reservation
- web primary nav label change from `Sankalpa` to `Goals`
- web playlist validation-clearing behavior
- web copy cleanup for sync, media, and backend-heavy wording in normal user flows
- web Goals mobile density improvements with clearer phone-first sectioning
- web Home action hierarchy cleanup and active-timer CTA cleanup
- web state-message and visual-polish improvements where they intersect the reviewed issues
- native iPhone sync banner presentation cleanup
- native iPhone custom play and playlist library copy cleanup
- native iPhone safe-area/layout polish that supports the reviewed issues
- focused tests for changed behavior

Excluded:
- new product features beyond the review scope
- backend contract or persistence changes unless required by copy-only surface cleanup
- broad redesigns of existing flows outside the reviewed high/medium findings

## Source Documents
- `README.md`
- `requirements/intent.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `PLANS.md`
- `review-artifacts/ux-review.md`
- `review-artifacts/execution-report.md`
- `review-artifacts/screenshot-index.md`

## Affected Files And Modules
- `src/app/`
- `src/index.css`
- `src/pages/HomePage.tsx`
- `src/pages/ActiveTimerPage.tsx`
- `src/pages/SankalpaPage.tsx`
- `src/features/home/`
- `src/features/playlists/`
- `src/features/customPlays/`
- `src/features/sankalpa/`
- `src/App.test.tsx`
- `src/pages/*.test.tsx`
- `ios-native/MeditationNative/App/`
- `ios-native/MeditationNative/Features/Practice/`
- `ios-native/MeditationNativeTests/`

## UX Behavior
- Mobile web content must reserve enough space for the sticky header and bottom nav so controls and cards do not end up under persistent layers.
- The web nav must use `Goals` as the primary destination label while keeping `Sankalpa` as the screen title.
- Stale playlist field errors should clear as soon as the field becomes valid again.
- User-facing copy should prefer calm product language over implementation terms such as backend library, managed path, or awkward sync phrasing.
- Goals on phone should foreground the active goal journey and keep summary detail or less-frequent sections more collapsible.
- Home should present one primary next-step action and lighter secondary shortcuts.
- The active timer screen should not offer a redundant resume action when already open.
- iPhone sync status should stay concise, separate from nav controls, and avoid crowding toolbar actions.
- iPhone library cards should remove technical identifiers from normal reading order.

## Data And State Model
- No new persisted domain model is planned.
- Web form state will keep existing draft shapes but may add derived error-clearing behavior.
- Goals page may add UI-only disclosure state for mobile density control.
- Native iPhone banner changes are presentation-only.

## Risks
- Shell spacing changes can accidentally regress desktop spacing or keyboard focus behavior.
- Goals restructuring can break existing tests that assume always-visible summary content.
- Copy cleanup must stay aligned with the existing offline-first truth model.
- Native iPhone banner changes must not hide meaningful sync state.

## Milestones
1. Land shell/navigation/copy fixes shared across the web app.
2. Fix web forms and page-density issues in playlists, Goals, and Home.
3. Fix native iPhone banner and library presentation issues.
4. Add regression tests and run verification.
5. Update durable docs and handoff notes.

## Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `swift test --package-path ios-native`
- focused manual/visual checks where practical

## Decision Log
- 2026-04-23: Keep this follow-up scoped to the review's high and medium issues instead of mixing in unrelated feature work.
- 2026-04-23: Treat the web `Goals` nav rename as a user-facing terminology fix only; keep `/sankalpa` as a compatibility route.

## Progress Log
- 2026-04-23: Read required product docs, review artifacts, and the `ux-designer` skill.
- 2026-04-23: Mapped the review issues to the current web shell, Goals, Home, playlist, custom play, and native iPhone presentation code.
- 2026-04-23: Implemented the high and medium review fixes across web and native iPhone surfaces, including shell spacing, calmer copy, Home hierarchy cleanup, Goals disclosure sections, playlist error pruning, and native banner/library presentation cleanup.
- 2026-04-23: Updated focused regression tests to match the calmer terminology and new CTA structure, then reran repo verification and native Swift package tests.
