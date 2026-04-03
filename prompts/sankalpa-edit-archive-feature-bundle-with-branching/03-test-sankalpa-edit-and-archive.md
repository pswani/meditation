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

Then create an ExecPlan for a strong verification pass on `sankalpa` edit and archive behavior.

Thoroughly test:

- editing each supported goal field
- validation and save behavior
- archiving active, completed, or expired goals where supported
- progress preservation and deadline behavior after edits
- goals-screen state changes and empty states
- local-first persistence and backend/API behavior if touched
- regression behavior for summaries or related goal calculations that share logic

Also:

1. Improve coverage where needed with focused maintainable tests only.
2. Write a concise test report into:
   - `docs/test-sankalpa-edit-archive-feature.md`
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
   - `test(sankalpa): verify edit and archive flows`

