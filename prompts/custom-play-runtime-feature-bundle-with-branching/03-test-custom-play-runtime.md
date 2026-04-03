Read:

- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/architecture.md`
- `docs/product-requirements.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

Then create an ExecPlan for a strong verification pass on the `custom play` runtime feature.

Thoroughly test:

- starting a `custom play`
- runtime playback controls
- optional start and end sound behavior
- completion and early-stop behavior
- `session log` creation and history display
- local-first persistence and backend/API behavior if touched
- regression behavior for existing timer and history flows that share logic

Also:

1. Improve coverage where needed with focused maintainable tests only.
2. Write a concise test report into:
   - `docs/test-custom-play-runtime-feature.md`
3. Run:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run test`
   - `npm run build`
   - relevant backend verification commands if applicable
4. Update `requirements/session-handoff.md` with:
   - scenarios covered
   - risks or gaps still observed
   - exact recommended next prompt
5. Commit with a clear message such as:
   - `test(custom-play): verify runnable custom play flow`

