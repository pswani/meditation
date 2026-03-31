# ExecPlan: Mac Mini Production Control Script

## Objective
Add one reliable Mac Mini production control script that manages both the frontend web server and the backend service with:
- `start`
- `stop`
- `restart`
- `status`

## Why
The current production workflow can install the app, but routine operations still require mixing:
- `brew services`
- `launchctl`
- direct health checks

The operator needs one stable command surface for clean starts, stops, restarts, and quick status checks.

## Scope
Included:
- one Mac Mini production control script
- README and runbook updates to use that script
- decisions and session-handoff updates

Excluded:
- remote deployment automation
- log rotation
- backup/restore
- database migration away from H2

## Source documents
- `README.md`
- `docs/architecture.md`
- `docs/mac-mini-production-runbook.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `requirements/execplan-macos-production-runbook.md`
- `PLANS.md`

## Affected files and modules
- `scripts/prod-macos-control.sh`
- `scripts/prod-macos-setup.sh`
- `README.md`
- `docs/mac-mini-production-runbook.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## UX behavior
This is an operator-facing workflow slice. The application UI remains unchanged.

## Data and state model
- The control script targets the installed production layout under `/opt/meditation` by default.
- It manages:
  - Homebrew `nginx`
  - the backend `launchd` service
  - backend health checks on `127.0.0.1:8080`

## Risks
- `sudo` is required for launchd system services and privileged nginx service control.
- A restart flow should remain safe when one or both services are already stopped.
- Status output should stay readable even when the service has not been installed yet.

## Milestones
1. Add the unified Mac Mini control script.
2. Update the install script to use the unified restart flow after deployment.
3. Update README and runbook usage.
4. Run syntax checks and dry-run verification.

## Verification
- `sh -n scripts/prod-macos-control.sh`
- `./scripts/prod-macos-control.sh restart --dry-run`
- `./scripts/prod-macos-control.sh stop --dry-run`
- `./scripts/prod-macos-control.sh start --dry-run`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify`

## Decision log
- Prefer one combined control script over more backend-only wrappers for day-to-day Mac Mini operations.
- Keep `install-app` focused on installation, then hand off ongoing operations to the control script.
- Keep dry-run support so the operator can inspect commands before changing system services.

## Progress log
- 2026-03-30: reviewed the existing production lifecycle helpers and identified the need for one combined Mac Mini control surface.
