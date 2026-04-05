Read before implementation:
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
- `prompts/production-grade-hardening-phased-plan.md`

Implementation objective:
- Make timer-sound and media fallback ownership clearer and make offline cache invalidation safer for production deploys.

Required planning step:
1. Create and keep updated an ExecPlan at `docs/execplan-media-cache-hygiene-feature.md` before making substantial code changes.
2. Use that ExecPlan to record:
   - objective
   - scope and exclusions
   - affected modules
   - UX behavior and validations
   - data and state model
   - risks and tradeoffs
   - milestones
   - verification plan
   - decision log
   - progress log

Required behavior:
1. Define and implement one clear ownership model for timer sounds and media fallback assets across:
   - `src/assets`
   - `public/media`
   - runtime catalogs under `src/data`
   - media registration scripts
2. Remove or simplify redundant asset declarations or conflicting ownership paths where safe.
3. Replace hand-edited offline cache version strings with a build-derived or artifact-derived strategy that updates safely across deploys.
4. Preserve the current offline app-shell behavior and current recording-media expectations.
5. Keep timer sound lookup, playback, and media registration behavior explicit and documented.
6. Do not widen into browser upload/import or a broader media-library redesign.

Suggested implementation direction:
- Prefer a clearly documented canonical asset source over parallel fallback paths that drift silently.
- Keep the operator registration workflow script-driven if that remains the chosen model, but make the ownership boundaries obvious.
- Keep cache versioning deterministic and visible enough to debug when deployments invalidate old assets.

Expected affected areas:
- `src/features/timer/timerSoundCatalog.ts`
- `src/data/timerSoundCatalog.json`
- `src/data/soundOptions.json`
- `src/data/customPlayMediaCatalog.json`
- `src/features/sync/offlineApp.ts`
- `public/offline-sw.js`
- `scripts/media-registration-utils.mjs`
- `scripts/add-sound-option.mjs`
- `scripts/add-custom-play-media.mjs`
- `docs/media-registration-scripts.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

Required tests:
- Add or update focused tests for timer sound resolution and any asset-catalog logic that changes.
- Add or update focused tests for offline cache-version generation or registration behavior.
- Preserve or improve tests covering offline app registration and runtime cache messaging if those paths are touched.

Documentation updates:
- Update `README.md` if media placement or asset ownership guidance changes materially.
- Update `docs/architecture.md` for the final asset and cache-version model.
- Update `docs/media-registration-scripts.md` for the final registration workflow.
- Update `requirements/decisions.md` for long-lived asset ownership or cache-versioning decisions.
- Update `requirements/session-handoff.md` for the new repo state, artifact paths, and recommended next slice.

Verification after implementation:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- run any focused local smoke checks needed for offline app registration or media lookup behavior

Suggested durable artifacts:
- `docs/execplan-media-cache-hygiene-feature.md`
- `docs/review-media-cache-hygiene-feature.md`
- `docs/test-media-cache-hygiene-feature.md`

Commit expectations:
- Use a focused commit message in the repo's preferred style, such as:
  - `chore(media): align asset ownership and cache versioning`

Deliverables before moving on:
- coherent ExecPlan
- implementation changes
- updated tests
- updated durable docs
- verification results

