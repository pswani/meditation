Read:

- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `requirements/intent.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

Then create an ExecPlan for this slice and implement `sankalpa` edit and archive flows end to end.

Scope:

1. Allow existing `sankalpa` goals to be edited safely.
2. Allow goals to be archived with clear UX and clear state transitions.
3. Preserve progress calculations and deadline behavior correctly after edit and archive actions.
4. Keep local-first and backend-backed behavior aligned with the current app architecture.
5. Keep the experience calm and responsive on phone, tablet, and desktop.

Rules:

1. Keep scope bounded to `sankalpa` edit and archive behavior plus closely related correctness work.
2. Avoid unrelated summary redesigns or new goal-model expansion.
3. Preserve established `sankalpa`, summary, and time-of-day terminology.
4. Strengthen validation, persistence, and sync safety where the new flow depends on them.
5. Add or update focused tests for the load-bearing logic and user flow touched by this slice.

Explicit exclusions unless directly required for correctness:

- new `sankalpa` types
- broad goals-screen redesign
- unrelated timer, playlist, or media refactors

Verification:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- relevant backend verification commands if backend contracts or persistence change

After implementation:

1. Update `README.md` if user-facing behavior or operations changed materially.
2. Update `requirements/decisions.md`.
3. Update `requirements/session-handoff.md` with:
   - what was completed
   - remaining limitations
   - exact recommended next prompt
4. Commit with a clear message such as:
   - `feat(sankalpa): add edit and archive flows`

