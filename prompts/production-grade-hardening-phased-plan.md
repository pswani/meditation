# Production-Grade Hardening Phased Plan

This plan sequences the requested production-grade cleanup and hardening work into bounded prompt bundles that can be executed safely one phase at a time.

Read before running any bundle:
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/intent.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## Execution Order

### Phase 1
- Bundle: `runtime-boundary-hardening-feature-bundle-with-branching`
- Goal: reduce frontend orchestration risk by splitting the densest runtime and persistence boundaries first.
- Requested items covered:
  - High Priority 1
  - High Priority 2
  - High Priority 6
  - Ongoing 1 only where directly required to support the runtime split, especially `AppShell` or route-facing helpers
- Primary outcomes:
  - `TimerContext` split into smaller, testable modules
  - `storage.ts` split into per-domain persistence boundaries
  - avoidable synchronous write amplification reduced
  - primary routes loaded lazily without breaking refresh or deep links

### Phase 2
- Bundle: `backend-scale-hardening-feature-bundle-with-branching`
- Goal: make backend history, summary, and playlist-save behavior more production-scalable while tightening frontend API-boundary behavior.
- Requested items covered:
  - High Priority 3
  - High Priority 4
  - High Priority 5
  - Ongoing 4
- Primary outcomes:
  - summary and sankalpa aggregation no longer depend on naive full-history in-memory scans where a query-level approach is appropriate
  - `session log` and summary APIs support practical filtering and pagination
  - playlist linked-recording validation is batched
  - API client timeout and cancellation policy becomes explicit and production-friendly

### Phase 3
- Bundle: `production-reference-cleanup-feature-bundle-with-branching`
- Goal: remove configuration drift, duplicated reference definitions, and generated-artifact clutter while tightening the operator verification workflow.
- Requested items covered:
  - Production cleanup 2
  - Production cleanup 3
  - Production cleanup 4
  - Production cleanup 5
  - Ongoing 3
- Primary outcomes:
  - one authoritative reference-data approach for shared product vocabularies
  - one authoritative Vite config
  - README and config behavior aligned
  - generated outputs no longer tracked accidentally
  - one repeatable verify command or script path covers frontend, backend, and smoke checks

### Phase 4
- Bundle: `media-cache-hygiene-feature-bundle-with-branching`
- Goal: clean up sound/media asset ownership and make offline cache versioning deployment-safe.
- Requested items covered:
  - Production cleanup 6
  - Production cleanup 7
- Primary outcomes:
  - one clear source-of-truth model for bundled sounds, public fallback assets, and registration scripts
  - offline cache versioning derived from build or artifact state rather than hand-edited strings

### Phase 5
- Bundle: `screen-decomposition-hardening-feature-bundle-with-branching`
- Goal: finish the remaining oversized frontend module cleanup after the runtime, API, and config layers have stabilized.
- Requested items covered:
  - Ongoing 1 for the remaining oversized modules not already handled in Phase 1
- Primary outcomes:
  - smaller screen and manager modules
  - business logic moved out of large JSX trees
  - calmer long-term maintenance surface across Home, Practice, Goals, Settings, custom plays, playlists, and shell layers

## Global Guardrails

1. Treat the phases as sequential by default. If one is intentionally skipped, record that choice in the next phase's ExecPlan before implementation.
2. Keep each bundle bounded to its phase. Do not silently pull later-phase cleanup into an earlier branch.
3. Create an ExecPlan for each implementation step and keep it current while the bundle is active.
4. Preserve the app's calm, minimal, responsive UX and exact product terminology.
5. Update durable docs when a phase changes architecture, operations, or long-lived decisions.
6. Prefer repo scripts and documented commands for verification and operational checks.

## Expected Durable Artifacts

- `docs/execplan-runtime-boundary-hardening-feature.md`
- `docs/review-runtime-boundary-hardening-feature.md`
- `docs/test-runtime-boundary-hardening-feature.md`
- `docs/execplan-backend-scale-hardening-feature.md`
- `docs/review-backend-scale-hardening-feature.md`
- `docs/test-backend-scale-hardening-feature.md`
- `docs/execplan-production-reference-cleanup-feature.md`
- `docs/review-production-reference-cleanup-feature.md`
- `docs/test-production-reference-cleanup-feature.md`
- `docs/execplan-media-cache-hygiene-feature.md`
- `docs/review-media-cache-hygiene-feature.md`
- `docs/test-media-cache-hygiene-feature.md`
- `docs/execplan-screen-decomposition-hardening-feature.md`
- `docs/review-screen-decomposition-hardening-feature.md`
- `docs/test-screen-decomposition-hardening-feature.md`

## Suggested Runner Usage

Use the shared runner with one bundle at a time, for example:

- `Read prompts/run-milestone-bundle.md and execute it for runtime-boundary-hardening-feature-bundle-with-branching.`
- `Read prompts/run-milestone-bundle.md and execute it for backend-scale-hardening-feature-bundle-with-branching.`

