Read AGENTS.md, README.md, requirements/intent.md, docs/product-requirements.md, docs/architecture.md, docs/ux-spec.md, docs/screen-inventory.md, requirements/decisions.md, requirements/session-handoff.md, `requirements/execplan-intent-remediation-bundle.md`, and the implementation state after slice 2.

Then perform a focused code and product review of the most recently completed slice 2 work.

Review for:
- requirement correctness against `requirements/intent.md`
- regressions in surrounding flows
- missing validations
- persistence, sync, or recovery issues
- backend or API contract mismatches
- UX clarity and responsive behavior
- missing or weak tests

Do not implement fixes in this step.

Output:
1. findings ordered by severity with file and line references where possible
2. open questions or assumptions
3. residual risk if no findings are present

Write the review into `docs/review-intent-remediation-slice-2.md`, update requirements/session-handoff.md with the top findings and the exact recommended next prompt, and if only review documentation changes are made commit with a clear message such as `docs(review): assess intent remediation slice 2`.

