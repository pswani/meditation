# ExecPlan: Media Surface And CI Hardening Feature

## 1. Objective
Harden the repo’s remaining media-serving, offline media-caching, and verification-enforcement surfaces by narrowing backend static media exposure, making offline media caching bounded and honest, and adding visible CI plus diff-time hygiene gates.

## 2. Why
- The backend currently maps `/media/**` to the whole configured media root, which exposes more filesystem surface than the app actually intends to serve.
- The service worker still emulates range responses by buffering the full cached media file into memory, which is risky for larger recordings and overstates offline media support.
- The repo now has a clear local verification path through `./scripts/pipeline.sh verify`, but there is no checked-in GitHub Actions workflow enforcing the same gates.
- The repo-hygiene bundle removed tracked runtime artifacts, but there is no dedicated diff-time guard preventing those artifact classes from quietly coming back in future PRs.

## 3. Scope
Included:
- validate backend media-root configuration and serve only the intended `custom-plays` and `sounds` subtrees
- harden the service worker’s media policy so offline media caching is explicitly bounded and range requests are no longer faked from a full in-memory buffer
- add GitHub Actions workflows for the real web, backend, and iOS verification commands
- add a repo-hygiene diff check that rejects generated or runtime artifact paths in changes
- update durable docs for the new media-serving, offline-cache, and CI model

Excluded:
- broader repo-hygiene cleanup
- sync-contract redesign
- large runtime-boundary decomposition
- unrelated production-topology changes

## 4. Source Documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `requirements/intent.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/expert-review-remediation-phased-plan.md`
- `docs/execplan-media-cache-hygiene-feature.md`
- `docs/review-media-cache-hygiene-feature.md`
- `docs/test-media-cache-hygiene-feature.md`
- `docs/build-deploy-pipeline-review.md`

## 5. Affected Files And Modules
- `backend/src/main/java/com/meditation/backend/config/MediaStorageProperties.java`
- `backend/src/main/java/com/meditation/backend/config/WebConfig.java`
- `backend/src/main/java/com/meditation/backend/media/MediaStorageService.java`
- media-related backend tests under `backend/src/test/java/com/meditation/backend/`
- `public/offline-sw.js`
- sync/offline tests if touched
- new repo-hygiene script under `scripts/`
- new GitHub Actions workflow files under `.github/workflows/`
- `README.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/review-media-surface-and-ci-hardening-feature.md`
- `docs/test-media-surface-and-ci-hardening-feature.md`

## 6. UX Behavior
- Preserve calm, trustworthy offline behavior.
- Keep cached offline media support available for touched recordings when the file size stays within the new bounded policy.
- Avoid pretending cached media fully supports browser range semantics when it does not.
- Preserve existing backend-backed media URLs and timer-sound behavior for the supported `custom play` and sound paths.

## 7. Data And State Model
- Keep the configured media root as the filesystem anchor, but only resolve and serve validated child directories beneath it.
- Keep `/media/custom-plays/...` and `/media/sounds/...` as the supported public media paths.
- Keep service-worker media caching network-first and on-demand, with explicit count and size limits.
- Keep CI grounded in the repo’s real commands:
  - `./scripts/pipeline.sh verify`
  - `swift test --package-path ios-native`
  - `xcodebuild ... build`
- Keep the hygiene check focused on artifact classes the repo already expects to remain untracked.

## 8. Risks
- Over-validating media paths could break the documented local or production media setup if legitimate relative roots or subdirectories are rejected.
- Removing service-worker range emulation could reduce offline playback compatibility for some browser media implementations, so the tradeoff needs to be explicit and bounded.
- CI jobs that drift from local commands would create a second workflow surface, so the workflow should call the established commands rather than re-implement them piecemeal.
- Hygiene checks that are too broad could block legitimate changes.

## 9. Milestones
1. Create the branch and capture the current media, cache, and verification surfaces in this ExecPlan.
2. Narrow backend media exposure to validated `custom-plays` and `sounds` subtrees and add focused backend coverage.
3. Replace risky service-worker media buffering with a bounded, understandable cache policy.
4. Add GitHub Actions verification plus a focused diff-time hygiene check.
5. Update durable docs, write review and test artifacts, and merge back to `codex/expert-review`.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `./scripts/pipeline.sh verify`
- backend-focused tests for media configuration and serving
- `swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build`
- workflow YAML parse or syntax validation where feasible
- focused repo-hygiene script verification with a representative path

## 11. Decision Log
- 2026-04-16: Use `codex/expert-review` as the parent branch because it is the branch explicitly requested and it already contains the earlier remediation bundles this work depends on.
- 2026-04-16: Prefer narrowing backend media serving to explicit subdirectories under the configured media root instead of serving the whole root through one broad handler.
- 2026-04-16: Prefer honest range-request fallback over full-buffer partial-response emulation in the service worker, and bound cached media by both count and size.
- 2026-04-16: Prefer one readable GitHub Actions workflow grounded in the existing repo commands plus one dedicated repo-hygiene script for artifact-path enforcement.

## 12. Progress Log
- 2026-04-16: Read the new bundle prompts, required repo docs, prior media-cache and pipeline docs, and the current backend media, service-worker, and pipeline codepaths.
- 2026-04-16: Confirmed the current parent branch is `codex/expert-review` and created `codex/media-surface-and-ci-hardening-feature-bundle-with-branching`.
- 2026-04-16: Re-verified the remaining gaps:
  - backend `/media/**` still maps to the whole configured media root
  - `public/offline-sw.js` still uses `response.arrayBuffer()` to emulate partial media responses
  - no checked-in `.github/workflows/` CI workflow exists yet
  - no diff-time repo-hygiene script currently rejects generated or runtime artifact paths in changes
- 2026-04-16: Implemented backend media hardening by validating the configured root and subdirectories, creating the `sounds/` directory explicitly, and serving only `/media/custom-plays/**` plus `/media/sounds/**`.
- 2026-04-16: Hardened the service-worker media path by removing full-buffer range emulation, limiting cacheable media to full responses within the worker size cap, and trimming retained media entries to a bounded count.
- 2026-04-16: Added `scripts/check-repo-hygiene.sh`, `npm run check:repo-hygiene`, and `.github/workflows/ci.yml`, then fixed the iOS app target's missing `GeneratedSyncContract.swift` source reference so the new CI build matches local Swift package coverage.
- 2026-04-16: Verification passed with:
  - `./scripts/pipeline.sh verify`
  - `swift test --package-path ios-native`
  - `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build`
  - `./scripts/check-repo-hygiene.sh --diff-range HEAD`
  - a representative rejected-artifact check via `./scripts/check-repo-hygiene.sh --paths dist/example-artifact.js`
  - `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/ci.yml")'`
