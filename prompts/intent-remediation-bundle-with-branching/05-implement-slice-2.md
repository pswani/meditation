Read AGENTS.md, PLANS.md, README.md, requirements/intent.md, docs/product-requirements.md, docs/architecture.md, docs/ux-spec.md, docs/screen-inventory.md, requirements/decisions.md, requirements/session-handoff.md, the audit and inventory documents produced by prompts 1 and 2, and `requirements/execplan-intent-remediation-bundle.md`.

If the audit and inventory documents were created at different paths, use the paths recorded in requirements/session-handoff.md.

Then implement the next highest-priority remediation slice from `requirements/execplan-intent-remediation-bundle.md` that is still unfinished.

Rules:
1. keep scope bounded to one vertical slice
2. complete the slice end to end
3. add focused tests
4. avoid unrelated refactors
5. preserve calm, minimal multi-device UX

Verification:
- run `npm run typecheck`
- run `npm run lint`
- run `npm run test`
- run `npm run build`
- run relevant backend verification if applicable

After implementation:
1. update README.md if needed
2. update requirements/decisions.md
3. update requirements/session-handoff.md with the exact recommended next prompt
4. commit with a clear message appropriate to the slice

