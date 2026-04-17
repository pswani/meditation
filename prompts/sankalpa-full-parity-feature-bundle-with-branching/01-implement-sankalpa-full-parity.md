# 01 Implement Full Cross-Platform Sankalpa Parity

Implement the `sankalpa` threshold/frequency enhancement fully across the whole app, including native iPhone parity.

Product goal:
- Fully support recurring meditation-derived goals such as:
  - “Do Tratak for at least 15 minutes a day, at least 5 times a week, for 4 weeks.”
  - “Do Ajapa at least 2 times a day, at least 4 days a week, for 6 weeks.”
- Keep one coherent model across web, backend, and native.
- Preserve calm UX and avoid turning Goals into a noisy habit tracker.

Current state to close:
- Web and backend already support recurring weekly cadence with qualifying daily thresholds.
- Native iPhone still appears cumulative-only and needs parity in model, persistence, sync, UI, and progress tracking.

Execution requirements:
- Keep one active ExecPlan at `docs/execplan-sankalpa-full-parity-feature.md`.
- Preserve existing cumulative goals and `observance-based` goals.
- Keep terminology aligned with current product docs.
- Maintain local-first and sync-safe behavior.

Required implementation scope:
1. Audit existing `sankalpa` behavior on web, backend, and native.
2. Extend native data model and persistence to support:
   - qualifying daily threshold
   - qualifying days per week
   - number of weeks
   - recurring week progress evidence
3. Extend native Goals and Home surfaces so recurring goals are understandable and trustworthy.
4. Update native sync/API normalization so backend recurring fields round-trip cleanly.
5. Ensure progress math matches the web/backend model:
   - duration-based recurring goals
   - session-count recurring goals
   - active/completed/expired/archived state
6. Keep filters for meditation type and time of day working consistently.

Likely files:
- `src/types/sankalpa.ts`
- `src/utils/sankalpa.ts`
- `src/features/sankalpa/*`
- `src/pages/SankalpaPage.tsx`
- `src/pages/HomePage.tsx`
- `backend/src/main/java/com/meditation/backend/sankalpa/*`
- `ios-native/Sources/MeditationNativeCore/Domain/*`
- `ios-native/Sources/MeditationNativeCore/Services/AppSyncService.swift`
- `ios-native/MeditationNative/Features/Goals/GoalsView.swift`
- `ios-native/MeditationNative/Features/Home/HomeView.swift`
- native and web tests plus backend tests

Acceptance targets:
- Recurring duration and session-count goals are supported consistently on web, backend, and native.
- Existing cumulative and observance goals remain compatible.
- Progress tracking and summary copy match the same model everywhere.
- Home and Goals remain calm and readable on iPhone-sized layouts.

Required follow-through:
- Add focused frontend, backend, and native tests.
- Update durable docs:
  - `requirements/session-handoff.md`
  - `requirements/decisions.md`
  - any slice-specific execplan/review/test docs

Do not absorb:
- reminders or notifications
- unrelated History or audio defects
- broad product redesign beyond `sankalpa` parity

When implementation is stable, continue with `02-review-sankalpa-full-parity.md`.
