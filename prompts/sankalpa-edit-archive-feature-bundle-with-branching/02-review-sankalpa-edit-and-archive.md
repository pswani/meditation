Read:

- `AGENTS.md`
- `README.md`
- `requirements/intent.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

Then perform a focused code and product review of the just-completed `sankalpa` edit and archive slice.

Review for:

- functional correctness
- validation and state-transition correctness
- progress and deadline trustworthiness
- persistence and sync safety
- backend/API contract mismatches
- misleading UX states or copy
- responsive behavior problems
- missing or weak tests

Do not implement fixes in this step.

Output:

1. findings ordered by severity with file and line references where possible
2. open questions or assumptions
3. a brief note on residual risk if no findings are present

Write the review into:

- `docs/review-sankalpa-edit-archive-feature.md`

Then update `requirements/session-handoff.md` with:

- top findings
- exact recommended next prompt

If only review documentation changes are made and you choose to commit them, use a clear message such as:

- `docs(review): assess sankalpa edit and archive feature`

