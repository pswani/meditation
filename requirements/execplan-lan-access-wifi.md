# ExecPlan: LAN / Wi-Fi Access Enablement

## 1. Objective
Enable the current app to be accessed from other devices on the same local Wi-Fi network with the minimum necessary code and documentation changes.

## 2. Why
The app should be testable on phones, tablets, and other computers during development and local preview without assuming localhost-only access.

## 3. Scope
Included:
- Vite dev server LAN host binding
- Vite preview server LAN host binding
- a shared configurable API base URL utility for REST-friendly future backend use
- documentation for LAN access, ports, LAN IP usage, and current backend limitations
- decisions and session handoff updates

Excluded:
- adding a new backend service
- deployment infrastructure
- replacing local-first persistence with live HTTP calls
- unrelated UI or architecture refactors

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

## 5. Affected files and modules
- `vite.config.ts`
- `src/utils/playlistApi.ts`
- `src/utils/sankalpaApi.ts`
- `src/utils/mediaAssetApi.ts`
- `src/utils/*test.ts`
- `README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- The app should remain reachable from the developer machine and from other devices using the developer machine's LAN IP.
- Documentation should clearly explain which URL to open on another device.
- API-base configuration should avoid hardcoded localhost assumptions that would break phone access once a real backend is used.

## 7. Data and state model
- No domain-model changes.
- Local-first persistence remains unchanged.
- API path constants remain REST-shaped.
- A shared base-URL helper will derive fully qualified API URLs from configuration when needed.

## 8. Risks
- There is no backend service in this repository, so backend host binding and CORS changes cannot be implemented here.
- The app currently uses `localStorage`, which is isolated per device and browser.
- Firewall or OS network permissions can still block LAN access even when the app binds correctly.

## 9. Milestones
1. add LAN-safe Vite host binding and API-base utility
2. wire existing API-boundary modules to the shared utility without changing persistence behavior
3. document LAN usage, limitations, and troubleshooting
4. verify scripts and commit

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- start dev server and confirm LAN binding output
- start preview server and confirm LAN binding output

## 11. Decision log
- Prefer same-origin `/api` as the default API base so future backend integration stays REST-friendly for both LAN preview and deployed environments.
- Keep backend guidance documentary only because no backend runtime exists in this workspace.

## 12. Progress log
- 2026-03-25: reviewed required docs and inspected the repo for frontend/backend setup.
- 2026-03-25: confirmed the repo is front-end only and scoped the work to LAN-safe frontend access plus configuration/documentation seams.
