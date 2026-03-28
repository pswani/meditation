# ExecPlan: Production Deployment Scripting

## Objective
Add a concrete production deployment workflow that packages the frontend as static files for nginx, packages the backend jar, and provides repo-native scripts for backend production lifecycle management.

## Why
The repo already has strong local-development helpers, but production deployment guidance is still ambiguous. Operators need one documented answer for:
- what serves the frontend in production
- what serves the backend in production
- which scripts prepare the deployable artifacts
- how to start, stop, and inspect the backend after packaging

## Scope
Included:
- production packaging script
- nginx config rendering script
- backend production lifecycle scripts
- README, architecture, and handoff documentation updates

Excluded:
- TLS certificate automation
- containerization
- CI/CD automation
- external infrastructure provisioning

## Source documents
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `PLANS.md`

## Affected files and modules
- `scripts/common.sh`
- `scripts/render-nginx-config.sh`
- `scripts/package-deploy.sh`
- `scripts/prod-backend-start.sh`
- `scripts/prod-backend-stop.sh`
- `scripts/prod-backend-restart.sh`
- `scripts/prod-backend-status.sh`
- `scripts/prod-backend-logs.sh`
- `README.md`
- `docs/architecture.md`
- `.env.example`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## UX behavior
This is an operator-facing workflow slice. The application UI should remain unchanged.

## Data and state model
- frontend deployment artifact remains the static production build under `dist/`
- backend deployment artifact remains the packaged Spring Boot jar under `backend/target/`
- deployment bundle output will be assembled under a local deploy directory
- backend production lifecycle scripts will use a dedicated runtime directory to avoid colliding with the local dev managed stack

## Risks
- deployment docs can become misleading if they imply infrastructure that the repo does not fully automate
- prod lifecycle scripts must avoid conflicting with the existing local dev runtime helpers
- nginx config should preserve SPA routing and same-origin `/api` plus `/media` proxying

## Milestones
1. Extend shared script helpers with deployment and backend-artifact discovery utilities.
2. Add production packaging and nginx rendering scripts.
3. Add backend production lifecycle scripts.
4. Update docs and handoff materials.
5. Run verification commands and targeted script checks.

## Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- targeted script checks:
  - `./scripts/render-nginx-config.sh`
  - `./scripts/package-deploy.sh`
  - `./scripts/prod-backend-status.sh`

## Decision log
- Recommend nginx as the production static frontend server and reverse proxy, but keep the repo output generic enough to deploy elsewhere if desired.
- Treat `./scripts/package-deploy.sh` as the script-first production packaging entry point.
- Manage only the backend runtime directly from repo scripts; nginx remains operator-managed.

## Progress log
- 2026-03-28: reviewed current local dev and build helpers plus deployment docs to scope the production deployment gap.
- 2026-03-28: added production packaging, nginx rendering, and backend prod lifecycle scripts.
- 2026-03-28: updated README, architecture, env examples, and handoff docs to document nginx plus Spring Boot as the recommended production topology.
- 2026-03-28: verified typecheck, lint, test, build, deploy-bundle packaging, nginx config rendering, and prod backend start/status/health/stop in a persistent shell session.
