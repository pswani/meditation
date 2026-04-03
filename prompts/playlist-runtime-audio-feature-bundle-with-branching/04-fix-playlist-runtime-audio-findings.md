Read:

- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `requirements/intent.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/review-playlist-runtime-audio-feature.md`
- `docs/test-playlist-runtime-audio-feature.md`

Then create a small ExecPlan if needed and implement the important findings from review and test.

Rules:

1. Fix blocker and important findings first.
2. Include medium findings only when they are tightly related and low risk.
3. Add focused regression tests for each meaningful fix.
4. Avoid unrelated refactors.

Verification:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- relevant backend verification if backend or persistence code changed

After implementation:

1. Update `requirements/decisions.md`.
2. Update `requirements/session-handoff.md` with:
   - completion notes
   - remaining risks
   - exact recommended next prompt
3. Commit with a clear message such as:
   - `fix(playlists): address runtime audio review and test findings`

