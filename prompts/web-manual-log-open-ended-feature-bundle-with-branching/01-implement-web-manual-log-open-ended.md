# 01 Implement Web Manual Log Open-Ended Support

Implement the web defect fix so `Add manual log` can choose `open-ended` meditation.

Execution requirements:
- Keep one active ExecPlan at `docs/execplan-web-manual-log-open-ended-feature.md`.
- Preserve the existing manual-log validation rules:
  - duration must still be greater than 0
  - meditation type is still required
  - session timestamp is still required
- Keep History calm and explicit about open-ended records, including badges and any planned-duration copy.
- If the backend contract needs to change, keep the REST boundary explicit and update focused backend tests.

Likely files:
- `src/pages/HistoryPage.tsx`
- `src/utils/manualLog.ts`
- `src/utils/sessionLog.ts`
- `src/types/sessionLog.ts`
- `src/utils/sessionLogApi.ts`
- `src/features/timer/TimerContext.tsx` or related sync helpers if manual-log persistence shape changes
- `backend/src/main/java/com/meditation/backend/sessionlog/*`
- frontend and backend tests for the changed contract

Acceptance targets:
- The manual-log form exposes a clear timer-mode choice or equivalent affordance for `open-ended`.
- Saved open-ended manual logs keep truthful duration, timer-mode, and history presentation.
- Offline and backend-backed manual-log flows continue to work.
- Existing fixed-duration manual logging does not regress.

Required follow-through:
- Add or update focused frontend tests.
- Add or update backend tests if the API contract changes.
- Update `requirements/session-handoff.md`, and update `requirements/decisions.md` only if the manual-log contract changes durably.

Do not absorb:
- native iPhone defects
- broader History redesign
- sankalpa cadence changes
- unrelated backend test-isolation work

When ready, continue with `02-review-web-manual-log-open-ended.md`.
