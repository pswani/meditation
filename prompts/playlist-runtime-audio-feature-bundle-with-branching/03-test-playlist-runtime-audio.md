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

Then create an ExecPlan for a strong verification pass on playlist runtime audio behavior.

Thoroughly test:

- playlist launch and setup
- item playback sequencing
- optional small-gap behavior
- pause, resume, skip, completion, and early-stop behavior if those controls exist
- derived timing and remaining-time correctness
- `session log` output and history display
- local-first persistence and backend/API behavior if touched
- regression behavior for timer and `custom play` flows that share runtime logic

Also:

1. Improve coverage where needed with focused maintainable tests only.
2. Write a concise test report into:
   - `docs/test-playlist-runtime-audio-feature.md`
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
   - `test(playlists): verify runtime audio and gap behavior`

