Read AGENTS.md, PLANS.md, README.md, requirements/intent.md, docs/product-requirements.md, docs/architecture.md, docs/ux-spec.md, docs/screen-inventory.md, requirements/decisions.md, requirements/session-handoff.md, `requirements/execplan-intent-remediation-bundle.md`, and `docs/review-intent-remediation-slice-1.md`.

Then create a small ExecPlan if needed and implement the important findings from `docs/review-intent-remediation-slice-1.md`, keeping scope bounded to the reviewed issues and regression-proofing for this slice.

Rules:
1. fix blocker and important findings
2. include nice-to-have findings only if they are tightly related and low risk
3. add focused regression tests for each meaningful fix
4. avoid unrelated refactors

Verification:
- run `npm run typecheck`
- run `npm run lint`
- run `npm run test`
- run `npm run build`
- run relevant backend verification if backend or persistence code changed

After implementation:
1. update requirements/decisions.md
2. update requirements/session-handoff.md with:
   - completion notes
   - remaining risks
   - the exact recommended next prompt
3. commit with a clear message such as `fix(core): address slice 1 review findings`

