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

Then create an ExecPlan for this slice and implement playlist runtime audio behavior end to end.

Scope:

1. Add true playlist runtime audio behavior rather than only playlist sequencing metadata.
2. Support optional small gaps between playlist items.
3. Keep playlist order, total timing, item transitions, and completion behavior correct.
4. Define and implement trustworthy logging behavior for playlist runs and playlist items where the current product requires it.
5. Keep the experience calm and responsive on phone, tablet, and desktop.

Rules:

1. Keep scope bounded to playlist runtime audio and closely related correctness work.
2. Avoid unrelated media-library or navigation refactors.
3. Preserve established `playlist`, `custom play`, and `session log` terminology.
4. Strengthen validation, derived timing logic, persistence, and runtime correctness where the new flow depends on them.
5. Add or update focused tests for the load-bearing logic and user flow touched by this slice.

Explicit exclusions unless directly required for correctness:

- broader media upload tooling
- unrelated timer refactors
- major summary or sankalpa changes

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
   - `feat(playlists): add runtime audio playback and optional gaps`

