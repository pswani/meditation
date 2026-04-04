Read before implementation:
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/intent.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

Implementation objective:
- Fix the History screen so session logs render a calm, explicit session time range that makes the gap between start and end visible to the user.

Problem context:
- The session-log model already stores both `startedAt` and `endedAt`.
- The current History UI renders only one timestamp for ordinary entries, which makes the session window hard to understand.

Required behavior:
1. On the History screen, each visible session log entry should make both the start time and end time understandable.
2. The rendering should stay calm and compact on phone screens while still reading clearly on tablet and desktop.
3. Playlist run context should remain intact.
4. Existing completed/planned duration labels should remain understandable unless a very small wording adjustment is needed to avoid confusion.
5. Manual logs and auto logs should both render the improved time information.

Suggested implementation direction:
- Prefer a concise time-range presentation in each history item, rather than adding heavy layout or dense metadata.
- Reuse existing stored log fields; do not invent new persistence fields for this slice.
- Keep JSX changes focused and avoid unrelated refactors.

Required tests:
- Update or add focused History-page tests that verify the new time-range rendering.
- Cover at least:
  - a normal auto log
  - a manual log
  - playlist-linked context if the UI treatment differs there

Documentation updates:
- Update durable docs only if the visible behavior or expectations materially changed.
- At minimum, update `requirements/session-handoff.md` if this slice changes current repo behavior.
- If the History screen inventory or UX wording now needs to mention clearer start/end time visibility, update the relevant durable doc succinctly.

Verification after implementation:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Commit expectations:
- Use a focused commit message in the repo's preferred style, such as:
  - `fix(history): show session time ranges`

Deliverables before moving on:
- code changes
- updated tests
- any needed durable docs
- verification results
