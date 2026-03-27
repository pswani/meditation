# ExecPlan: Milestone A Core Full-Stack Verification

## 1. Objective
Run a strong Milestone A verification pass across the backend-backed core practice engine, strengthen focused coverage where it is still thin, and document the milestone as ready for local merge.

## 2. Why
Milestone A now spans frontend flow, REST contracts, H2 persistence, and runnable local startup. Before merging back into the parent branch, we need confidence that the calm core practice journey remains trustworthy end to end.

## 3. Scope
Included:
- backend startup verification for the local Spring Boot service
- H2-backed persistence checks for timer settings and `session log` flows
- focused test additions or refinements for:
  - timer -> log -> History continuity
  - settings -> timer defaults continuity
  - Home launch-surface behavior
- full relevant verification for touched frontend and backend surfaces
- decisions and session-handoff updates for milestone completion readiness

Excluded:
- new user-facing features
- broad refactors
- playlist or sankalpa REST expansion
- merge execution itself

## 4. Source documents
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
- `prompts/milestone-a-core-fullstack/05-test-core-fullstack.md`

## 5. Affected files and modules
- `requirements/execplan-milestone-a-core-testing.md`
- frontend test files covering Home, Practice, Settings, active timer, and app-level integration
- backend tests covering timer settings and `session log` persistence where gaps are found
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
No new UX is intended. This pass verifies that the existing core practice flow remains calm and trustworthy across:
- Home quick start and launch guidance
- Practice timer setup hydration
- active timer completion / ended-early outcomes
- History visibility of synced `session log` entries
- Settings save and rehydration behavior

## 7. Data and state model
No new domain model is intended. Verification should confirm the current contracts:
- H2-backed timer settings remain the source of truth after hydration
- H2-backed `session log` persistence supports timer completion and ended-early history visibility
- frontend local fallback behavior remains bounded and does not contradict backend-backed state

## 8. Risks
- Live verification can become noisy if dev services are not started and stopped cleanly.
- Integration tests can become brittle if they assert incidental markup instead of user-visible outcomes.
- Coverage improvements must stay focused so this prompt remains a verification pass, not a new implementation slice.

## 9. Milestones
1. Review current coverage and identify any meaningful gaps against prompt 05 expectations.
2. Add or refine focused tests only where the milestone still lacks confidence.
3. Run backend, frontend, and live-stack verification for the core flow.
4. Update decisions and session handoff with verification outcomes and the exact next prompt.
5. Commit the verification slice.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 test`
- `mvn -Dmaven.repo.local=../local-data/m2 verify`
- live checks with:
  - `npm run dev:backend`
  - `npm run dev:frontend`
  - `curl -s http://localhost:8080/api/health`
  - `curl -s http://localhost:8080/api/session-logs`
  - `curl -s http://localhost:8080/api/settings/timer`

## 11. Decision log
- Keep this prompt verification-focused and only add coverage where a clear milestone confidence gap still exists.
- Prefer app-level and route-level tests for flow continuity, and backend tests for persistence trust, over broad UI rewrites or incidental assertions.

## 12. Progress log
- 2026-03-26: reviewed prompt 05, current milestone docs, and prior Milestone A ExecPlans to define a bounded full-stack verification pass.
- 2026-03-26: added focused coverage for:
  - Home quick start launching from backend-hydrated defaults
  - H2-backed timer settings seed/update persistence at the repository level
- 2026-03-26: passed:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `mvn -Dmaven.repo.local=../local-data/m2 test`
  - `mvn -Dmaven.repo.local=../local-data/m2 verify`
- 2026-03-26: completed live verification on an isolated runtime stack using:
  - backend on `http://127.0.0.1:8081`
  - frontend on `http://127.0.0.1:5175`
  - temporary H2 database `meditation-prompt05`
- 2026-03-26: confirmed live backend health, timer settings persistence, `session log` persistence, frontend proxy reachability, and hydrated Home / Practice launch surfaces against the isolated stack.
