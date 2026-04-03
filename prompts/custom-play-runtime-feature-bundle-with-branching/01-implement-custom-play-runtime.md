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

Then create an ExecPlan for this slice and implement a true runnable `custom play` flow.

Scope:

1. Make `custom play` runnable as a prerecorded-session experience rather than only metadata plus linked media.
2. Support the core user journey end to end:
   - start a `custom play`
   - play the prerecorded media
   - apply optional start and end sounds where appropriate
   - support clear runtime controls and end behavior
   - write a trustworthy `session log`
   - reflect the result cleanly in history and related UI
3. Keep the experience calm and responsive on phone, tablet, and desktop.
4. Preserve local-first and backend-backed behavior where the current app already has those boundaries.

Rules:

1. Keep scope bounded to this slice.
2. Avoid unrelated refactors.
3. Preserve the existing `custom play`, `session log`, and media terminology from repo docs.
4. Strengthen validation, persistence, and runtime correctness where the new flow depends on them.
5. Add or update focused tests for the load-bearing logic and behavior touched by this slice.

Explicit exclusions unless directly required for correctness:

- playlist runtime expansion
- broader media upload or import tooling
- major navigation redesign

Verification:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- relevant backend verification commands if backend contracts, persistence, or media behavior change

After implementation:

1. Update `README.md` if user-facing behavior or operations changed materially.
2. Update `requirements/decisions.md`.
3. Update `requirements/session-handoff.md` with:
   - what was completed
   - remaining limitations
   - exact recommended next prompt
4. Commit with a clear message such as:
   - `feat(custom-play): add runnable prerecorded-session flow`

