# ExecPlan: Managed Local App-Stack Scripting

## 1. Objective
Add a coherent local scripting layer that can:
- build the frontend and backend
- start the frontend and backend together for local access
- stop the managed local stack cleanly
- restart the stack, with a documented `--no-db` option that keeps the current backend-owned H2 state running
- expose status and log helpers as operator-safe best practices

## 2. Why
The repository already has useful foreground development commands, but it still lacks a clean managed workflow for operators who want one command to start, stop, inspect, and restart the local application stack. This slice reduces friction without pretending the embedded H2 database is a standalone daemon when it is not.

## 3. Scope
Included:
- update the existing helper script foundation to support:
  - managed runtime directories
  - PID files
  - log files
  - health checks
  - configurable frontend host and port settings
- add package entrypoints for:
  - managed start
  - managed stop
  - managed restart
  - managed status
  - managed log tailing
- keep the existing build, media-setup, H2 reset, and preview helpers aligned with the new configuration layer
- document the embedded-H2 lifecycle truthfully in `README.md`
- update decisions and session handoff

Excluded:
- adding Docker or container orchestration
- introducing a standalone H2 TCP server or any separate DB daemon
- changing app UI behavior
- unrelated frontend or backend refactors

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `requirements/prompts.md`

## 5. Affected files and modules
- `package.json`
- `.env.example`
- `README.md`
- `requirements/execplan-devops-local-scripting.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `scripts/common.sh`
- `scripts/dev-frontend.sh`
- `scripts/preview-local.sh`
- `scripts/app-start.sh`
- `scripts/app-stop.sh`
- `scripts/app-restart.sh`
- `scripts/app-status.sh`
- `scripts/app-logs.sh`

## 6. UX behavior
- No product UI changes are expected.
- Command behavior should feel calm and explicit:
  - managed start waits for backend health before reporting success
  - managed stop only targets processes launched by the managed helpers
  - restart explains what `--no-db` means in this repo's embedded-H2 model
  - status shows where logs and PID files live
- Local operators should be able to recover from common issues without guessing:
  - port already in use
  - stale PID files
  - backend failing health checks

## 7. Data and state model
- The backend still owns the real H2 lifecycle.
- H2 remains file-backed at `local-data/h2` by default; it is not a separate service process.
- Managed runtime metadata is stored under `local-data/runtime/`:
  - `pids/`
  - `logs/`
- Frontend and backend media roots continue to be prepared through the existing media helper flow.

## 8. Risks
- A misleading DB abstraction would confuse operators, so the scripts and docs must state that H2 is embedded in the backend process.
- Managed stop should not kill unrelated processes that merely happen to use the same ports.
- Startup verification can fail in sandboxed environments that cannot bind local ports, so live startup verification may require escalation.

## 9. Milestones
1. Extend the shared shell helpers with runtime, PID, logging, and health-check support.
2. Add managed start, stop, restart, status, and logs scripts plus package entrypoints.
3. Update README and environment examples with the new workflow and DB semantics.
4. Verify build, status, and managed lifecycle commands.
5. Record decisions and handoff details for the next slice.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run build:app`
- `npm run media:setup`
- `npm run db:h2:reset`
- `npm run status:app`
- start `npm run start:app`, confirm:
  - frontend responds on the configured dev URL
  - backend health responds on `/api/health`
  - logs and PID files are written under `local-data/runtime`
- run `npm run restart:app -- --no-db` and confirm the frontend cycles while the backend remains reachable
- run `npm run stop:app` and confirm the managed processes are no longer running

## 11. Decision log
- Keep the existing foreground `dev:*` scripts for direct local development, and add separate managed helpers instead of replacing them.
- Use the Vite dev server for the managed local stack because it preserves the existing `/api` proxy behavior without needing a build-time `VITE_API_BASE_URL`.
- Treat `--no-db` as a frontend-only restart because the current H2 database is embedded in the backend process rather than running as a separate daemon.
- Store PID files and logs under ignored local-data paths so the managed workflow stays local-only and easy to clean up.

## 12. Progress log
- 2026-03-27: reviewed the required docs plus the existing helper scripts, backend runtime configuration, and current README guidance.
- 2026-03-27: updated the shared script foundation with runtime-directory, PID, log, port-check, and health-check helpers.
- 2026-03-27: added managed local stack commands for start, stop, restart, status, and logs.
- 2026-03-27: updated environment examples and README documentation to describe the new workflow and the embedded-H2 lifecycle truthfully.
- 2026-03-27: passed `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `npm run build:app`, `npm run media:setup`, and `npm run db:h2:reset`.
- 2026-03-27: verified `start:app`, `status:app`, backend/frontend localhost reachability, `restart:app -- --no-db`, and `stop:app` in one unsandboxed interactive shell session because isolated command runs in this tool harness do not preserve background children between invocations.
