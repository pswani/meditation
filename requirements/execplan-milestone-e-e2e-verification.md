# ExecPlan: Milestone E End-To-End Verification

## 1. Objective
Perform a thorough local full-stack verification pass across the implemented meditation flows, strengthen focused coverage where verification exposes a meaningful gap, and document the exact run and verification steps that now work in this repository.

## 2. Why
Milestone E is the release-hardening milestone. By this point the app should be demonstrably usable as a calm local full-stack application, not just a collection of passing isolated tests. This prompt should confirm that the frontend, backend, H2 persistence, media metadata handling, and REST integration behave coherently together.

## 3. Scope
Included:
- create a prompt-specific verification ExecPlan
- run the frontend quality commands
- run backend Maven verification
- start an isolated local backend and frontend stack for manual end-to-end checks
- verify major implemented user journeys through the browser and REST endpoints
- strengthen focused test coverage only if the live verification exposes a real gap
- update `README.md` with clear run, test, build, and deployment verification instructions
- update milestone handoff docs and commit the prompt

Excluded:
- new product features
- broad UX redesign
- new CI infrastructure
- production deployment automation

## 4. Source documents
- AGENTS.md
- PLANS.md
- README.md
- docs/architecture.md
- docs/product-requirements.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md
- prompts/milestone-e-hardening-release/04-e2e-verification.md

## 5. Affected files and modules
- `README.md`
- focused tests only if needed
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. Verification targets
- frontend compile, lint, test, and production build
- backend `test` and `verify`
- backend health and implemented REST routes on an isolated local port
- local H2-backed persistence continuity across fresh page loads where practical
- seeded media metadata endpoint and frontend fallback behavior
- browser-level verification for:
  - Home
  - Practice
  - active timer
  - manual log in History
  - `custom play`
  - playlist creation and run launch
  - Sankalpa
  - Settings

## 7. Local runtime plan
- run backend on an isolated prompt-specific H2 database name and non-default port
- run the frontend against that backend with an explicit API base URL
- use `curl` for backend health and representative REST checks
- use Playwright on localhost for browser verification across the main routes
- stop temporary processes when finished

## 8. Risks
- long-running local servers can mask failures if the wrong port or database is reused
- end-to-end checks can accidentally widen scope into feature work if the findings are not bounded
- README changes can drift into aspiration instead of reflecting the exact verified commands

## 9. Milestones
1. Capture the exact local stack commands and create the verification ExecPlan.
2. Run the full automated verification suite.
3. Start an isolated local full-stack runtime and verify health plus representative REST endpoints.
4. Verify the main browser journeys and identify any load-bearing gaps.
5. Add narrowly focused tests or docs updates as needed, rerun verification, update handoff docs, and commit.

## 10. Verification commands
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 test`
- `mvn -Dmaven.repo.local=../local-data/m2 verify`
- isolated local backend run on a non-default port
- isolated local frontend preview or dev run pointing at that backend
- browser and `curl` verification against the isolated local stack

## 11. Decision log
- Use an isolated H2 database name and backend port for prompt 04 so end-to-end checks do not depend on or disturb any pre-existing local runtime.
- Keep any code changes verification-driven; if the live stack behaves correctly, prefer documentation and handoff updates over speculative edits.
- Run the connected local verification stack on frontend and preview ports that the backend CORS configuration already allows:
  - Vite dev: `5173` or `5174`
  - Vite preview: `4173` or `4174`
- Keep React StrictMode enabled in prompt-04 coverage and fix the provider lifecycle bug at the source, rather than weakening the app entrypoint or test setup.
- Keep playlist-generated `session log` ids short enough to fit the backend `session_log.id` length constraint, instead of depending on long concatenated playlist metadata inside the primary key.
- Document that Vite dev proxies `/api`, while Vite preview requires an explicit `VITE_API_BASE_URL` because preview does not proxy API traffic.

## 12. Progress log
- Completed: reviewed the prompt and current local run/build instructions in `README.md`.
- Completed: started an isolated backend with `MEDITATION_H2_DB_NAME=meditation-prompt04 MEDITATION_BACKEND_PORT=8081 npm run dev:backend`.
- Completed: started an isolated frontend with `VITE_DEV_BACKEND_ORIGIN=http://127.0.0.1:8081 npm run dev -- --host 127.0.0.1 --port 5174`.
- Completed: verified the connected local stack on:
  - frontend `http://127.0.0.1:5174`
  - backend `http://127.0.0.1:8081`
  - isolated H2 database name `meditation-prompt04`
- Completed: browser-verified major flows across Home, Settings, manual log in History, `custom play`, playlist creation and run logging, and Sankalpa.
- Completed: fixed a real StrictMode sync regression in `TimerContext` that prevented later queue flushes after the initial StrictMode mount cycle.
- Completed: fixed playlist-generated `session log` ids exceeding the backend `varchar(64)` constraint and added a focused id-length test.
- Completed: updated `README.md` with the exact verified connected dev and preview commands plus backend verification commands.
- Completed: reran the full verification suite successfully:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `mvn -Dmaven.repo.local=../local-data/m2 test`
  - `mvn -Dmaven.repo.local=../local-data/m2 verify`
