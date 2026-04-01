Read AGENTS.md, README.md, requirements/intent.md, docs/product-requirements.md, docs/architecture.md, docs/ux-spec.md, docs/screen-inventory.md, requirements/decisions.md, requirements/session-handoff.md, the audit and inventory documents produced by prompts 1 and 2, and `requirements/execplan-intent-remediation-bundle.md`.

If the audit and inventory documents were created at different paths, use the paths recorded in requirements/session-handoff.md.

Then perform a focused code and product review of the most recently completed remediation slice.

Review for:
- requirement correctness against `requirements/intent.md`
- regressions in surrounding flows
- missing validations
- persistence or sync safety issues
- backend or API contract mismatches
- misleading UX states or copy
- responsive behavior problems
- missing or weak tests

Do not implement fixes in this step.

Output:
1. findings ordered by severity with file and line references where possible
2. open questions or assumptions
3. a brief note on residual risk if no findings are present

Write the review into a new markdown document under `docs/` such as `docs/review-intent-remediation-slice-1.md`, update requirements/session-handoff.md with the top findings and the exact recommended next prompt, and if only review documentation changes are made commit with a clear message such as `docs(review): assess intent remediation slice 1`.

