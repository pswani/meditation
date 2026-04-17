# 01 Implement History Meditation-Type Edit

Implement the History meditation-type edit flow to the intended final product behavior.

Product goal:
- Finish the meditation-type correction flow in History in a trustworthy, well-scoped way across the app.
- Make the product rule explicit and consistent across web, backend, and native.

Execution requirements:
- Keep one active ExecPlan at `docs/execplan-history-meditation-type-edit-feature.md`.
- Audit current behavior on:
  - web
  - backend
  - native iPhone
- Choose and implement one clear product rule:
  - either manual-log-only editing remains the rule and all UX/docs/tests must align
  - or a broader editable scope is intentionally introduced and fully implemented
- Protect history trustworthiness first.

Required implementation scope:
1. Audit the current behavior and identify drift between platforms or docs.
2. Make the final product rule explicit in code and UX copy.
3. If manual-log-only remains the rule:
   - keep auto-created timer, `custom play`, and playlist logs read-only
   - make that limitation obvious and calm in History
   - align backend and sync behavior with that rule
4. If broader editing is intentionally chosen:
   - define exactly which sources are editable
   - preserve auditability and avoid accidental mutation of derived logs
5. Improve the History UI so the edit action is discoverable and consistent.
6. Add focused tests for allowed and disallowed cases.

Likely files:
- `src/pages/HistoryPage.tsx`
- `src/types/sessionLog.ts`
- `src/utils/sessionLog.ts`
- `src/utils/sessionLogApi.ts`
- `ios-native/MeditationNative/Features/History/HistoryView.swift`
- `ios-native/MeditationNative/App/ShellViewModel.swift`
- `ios-native/MeditationNative/App/ShellViewModelPresentation.swift`
- `backend/src/main/java/com/meditation/backend/sessionlog/*`
- focused web, backend, and native tests

Acceptance targets:
- The final editable-vs-read-only rule is clear and consistent.
- UX copy no longer implies broader editability than the product supports.
- History trustworthiness is preserved.
- Tests cover both positive and negative edit cases.

Required follow-through:
- Update `requirements/session-handoff.md`.
- Update `requirements/decisions.md` if the rule changes or becomes explicitly durable.
- Add slice-specific execplan/review/test docs.

Do not absorb:
- broad History redesign
- unrelated manual-log mode work
- sankalpa, audio, or branding changes

When implementation is stable, continue with `02-review-history-meditation-type-edit.md`.
