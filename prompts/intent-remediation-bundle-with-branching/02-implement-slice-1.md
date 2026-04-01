Read AGENTS.md, PLANS.md, README.md, requirements/intent.md, docs/product-requirements.md, docs/architecture.md, docs/ux-spec.md, docs/screen-inventory.md, requirements/roadmap.md, requirements/decisions.md, requirements/session-handoff.md, the audit and inventory documents produced by prompts 1 and 2, and `requirements/execplan-intent-remediation-bundle.md`.

If the audit and inventory documents were created at different paths, use the paths recorded in requirements/session-handoff.md.

Then implement the highest-priority remediation slice from `requirements/execplan-intent-remediation-bundle.md`.

Rules:
1. keep scope bounded to that one slice
2. fix real requirement gaps end to end across UI, state, validation, persistence, API integration, and backend where needed
3. preserve the established product terminology from AGENTS.md and requirements/intent.md
4. avoid unrelated refactors
5. add or update focused tests for the load-bearing logic and behavior touched by the slice

Verification:
- run `npm run typecheck`
- run `npm run lint`
- run `npm run test`
- run `npm run build`
- run relevant backend verification commands if backend contracts or persistence are changed

After implementation:
1. update README.md if behavior changed materially
2. update requirements/decisions.md
3. update requirements/session-handoff.md with:
   - what was completed
   - remaining limitations
   - the exact recommended next prompt
4. commit with a clear message matching the slice, for example `feat(timer): close intent gap for interval validation and runtime correctness`

