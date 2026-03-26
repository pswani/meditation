# ExecPlan: App-Level Run, Build, and Deployment Scripting

## 1. Objective
Add a clean, practical scripting layer for local development and production-like preview that works truthfully for the current front-end-only workspace while supporting pairing with an external backend and H2 database when available.

## 2. Why
The app already has working `npm` commands, but there is no coherent app-level scripting story for frontend dev, optional external backend dev, combined startup, media-root setup, or H2 reset flows. A small, honest helper layer will reduce setup friction without pretending the backend exists in this repository.

## 3. Scope
Included:
- add an ExecPlan for this slice
- add root/package helper scripts for:
  - frontend local dev
  - optional external backend local dev
  - combined local startup
  - production build
  - local production-like preview
  - H2 init/reset helper
  - media root directory setup
- add environment examples for the helper scripts
- document all commands in `README.md`
- verify relevant commands

Excluded:
- implementing a backend in this repo
- adding live API transport
- adding Docker-based infrastructure unless it becomes clearly necessary
- changing product behavior
- unrelated cleanup or architecture refactors

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

## 5. Affected files and modules
- `package.json`
- `.env.example`
- `README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `requirements/execplan-devops-local-scripting.md`
- `scripts/common.sh`
- `scripts/dev-frontend.sh`
- `scripts/dev-backend.sh`
- `scripts/dev-stack.sh`
- `scripts/build-local.sh`
- `scripts/preview-local.sh`
- `scripts/h2-reset.sh`
- `scripts/setup-media-root.sh`
- `public/media/custom-plays/.gitkeep`

## 6. UX behavior
- No app UI changes are expected.
- The main user-facing outcome is simpler developer/operator workflow documentation.
- Helper commands should be explicit and calm:
  - succeed for the front-end-only repo
  - explain clearly when backend pairing is optional but not configured

## 7. Data and state model
- Keep the app local-first.
- Treat backend scripting as an external integration hook rather than an in-repo service.
- Use ignored local filesystem directories for H2 reset defaults and media-root bootstrap defaults.

## 8. Risks
- It would be easy to imply a backend exists in this repo when it does not.
- Helper scripts that silently no-op could create confusion; missing backend configuration should be explained clearly.
- Long-running verification commands (`dev`, `preview`) need bounded manual checks rather than waiting indefinitely.

## 9. Milestones
1. Add helper shell scripts and package-script entrypoints.
2. Add media-root bootstrap directory and environment examples.
3. Update README with truthful app-level command documentation.
4. Verify build/run/reset/setup commands.
5. Update decisions and handoff, then commit.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run media:setup`
- `npm run db:h2:reset`
- `npm run build:app`
- start `npm run dev:frontend` and confirm Vite startup output
- start `npm run dev:all` and confirm frontend starts and backend handling is explicit
- start `npm run preview:app` and confirm preview startup output
- verify backend helper command wiring with a configured sample backend command

## 11. Decision log
- Keep the current repo front-end only; do not scaffold a fake backend service.
- Implement backend/H2 commands as adapters for an external backend configured through environment variables.
- Prioritize local development and production-like preview over containerization in this slice.

## 12. Progress log
- 2026-03-25: reviewed required docs and current repo run/build state.
- 2026-03-25: confirmed no backend build entrypoint exists in this workspace.
- 2026-03-25: implemented the local-first helper script layer, environment examples, and README command documentation.
- 2026-03-25: verified media setup, H2 reset, backend command wiring, app build, and the required quality commands.
- 2026-03-25: verified `dev:frontend`, `dev:all`, and `preview:app` startup outside the sandbox because the sandbox could not bind local ports.
