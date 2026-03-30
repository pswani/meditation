# ExecPlan: Mac Mini Production Runbook

## Objective
Add a production-only Mac Mini deployment workflow for the meditation app, including:
- a concrete operator runbook
- a host-preparation script for macOS
- an app-install script that deploys the packaged frontend/backend bundle
- launchd wiring for the Spring Boot backend

## Why
The repo already has production-oriented packaging helpers, but the operator still has to stitch together:
- Homebrew and package installation on macOS
- nginx setup
- TLS certificate issuance
- backend service management under `launchd`
- installed-path deployment of the packaged frontend and backend

The user wants a production-only path and does not want to run Vite dev or preview servers in deployment.

## Scope
Included:
- Mac Mini runbook documentation
- macOS host-preparation automation
- installed-path deployment automation for the packaged production bundle
- launchd plist rendering for the backend
- README, decisions, and handoff updates

Excluded:
- containerization
- CI/CD
- remote build-agent setup
- DNS-provider-specific wildcard TLS automation
- cloud infrastructure provisioning

## Source documents
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `requirements/execplan-production-deployment-scripting.md`
- `PLANS.md`

## Affected files and modules
- `README.md`
- `docs/mac-mini-production-runbook.md`
- `.env.example`
- `scripts/common.sh`
- `scripts/render-nginx-config.sh`
- `scripts/render-launchd-plist.sh`
- `scripts/prod-backend-run.sh`
- `scripts/prod-macos-setup.sh`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## UX behavior
This is an operator-facing workflow slice. The application UI should remain unchanged.

## Data and state model
- Production frontend files are installed to an operator-chosen app root on the Mac Mini.
- Production backend jar is installed under that same app root.
- Backend runtime state uses:
  - an installed env file
  - launchd-managed startup
  - filesystem-backed H2 files
  - filesystem-backed media storage
- TLS remains domain-driven and optional until the operator provides a public hostname and email.

## Risks
- macOS service management differs from Linux; the backend should not rely on `nohup` when managed by `launchd`.
- Certbot `--nginx` requires a reachable HTTP site on port `80`; some home-network setups may block that flow.
- Homebrew nginx runs under macOS service conventions, so the install script should stay explicit about sudo use and generated config paths.
- The repo is still an early full-stack production shape, so docs must stay truthful about limits.

## Milestones
1. Extend deployment helpers for installed-path nginx rendering and Java detection.
2. Add backend foreground runner and launchd plist renderer.
3. Add Mac Mini setup/deploy script with dry-run support.
4. Add Mac Mini production runbook.
5. Update README, decisions, and handoff docs.
6. Run verification commands and script checks.

## Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `sh -n scripts/render-launchd-plist.sh`
- `sh -n scripts/prod-backend-run.sh`
- `sh -n scripts/prod-macos-setup.sh`
- `./scripts/render-nginx-config.sh --output /tmp/meditation-nginx.conf --frontend-root /opt/meditation/app/frontend --server-name example.com`
- `./scripts/render-launchd-plist.sh --output /tmp/com.meditation.backend.plist --script-path /opt/meditation/bin/prod-backend-run.sh --env-file /opt/meditation/shared/meditation.env`
- `./scripts/prod-macos-setup.sh prepare-host --dry-run`
- `./scripts/prod-macos-setup.sh install-app --dry-run --skip-build --bundle-dir local-data/deploy --domain example.com --email ops@example.com`

## Decision log
- Keep the existing production bundle model and install from that bundle rather than inventing a second artifact format.
- Use `launchd` for backend service management on macOS and keep the existing `nohup`-based prod lifecycle helpers for repo-local operator workflows.
- Keep TLS automation bounded to Certbot’s nginx flow for standard domain-based installs; document DNS-validation cases instead of trying to automate every provider.
- Keep the production host runtime explicitly free of Vite dev and preview servers.

## Progress log
- 2026-03-29: reviewed the existing production packaging, nginx rendering, and backend lifecycle scripts.
- 2026-03-29: added the Mac Mini runbook, macOS setup/deploy script, launchd plist renderer, and backend foreground runner.
- 2026-03-29: extended the nginx renderer for installed-path deployments and updated production docs plus handoff materials.
- 2026-03-29: passed script syntax checks, renderer checks, script dry-runs, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, and `mvn -Dmaven.repo.local=../local-data/m2 verify`.
