# Code Quality Review

## Scope reviewed
- route-level screens and app shell
- timer state, reducer, and context orchestration
- local persistence and API-boundary utilities
- domain models and validation helpers
- custom play media metadata handling
- current automated test coverage

## Scope note
This workspace currently contains front-end code only. No server controller/service/repository layers or H2 schema code are present here, so backend- and H2-specific review areas were not applicable in this pass.

## Review lens
- architecture consistency with the documented design
- separation of concerns
- state-management quality
- persistence/API-boundary clarity
- validation placement and readability
- naming and model consistency
- duplication and cleanup opportunities
- test quality and change safety

## Summary
The repository has a solid prototype-quality baseline: domain helpers are generally separated from JSX, validation logic mostly lives outside render trees, and the test suite covers many of the load-bearing utility paths. The biggest code-quality problem is not style, but correctness: the shared timer reducer silently trims session-log history to 50 entries, which conflicts with the documented requirement that summaries and sankalpa calculations use the full local `session log` set.

After that, the main maintainability issues are architectural concentration and boundary drift. `TimerContext` has grown into a large orchestration hub for multiple unrelated domains, the REST-style API wrappers are inconsistent and only partially adopted, and media metadata is denormalized into stored custom-play records in a way that increases drift risk.

## What is working well
- Validation is mostly placed in dedicated helpers:
  - `timerValidation.ts`
  - `manualLog.ts`
  - `playlist.ts`
  - `customPlay.ts`
  - `sankalpa.ts`
- Storage load paths do meaningful shape validation instead of blindly trusting localStorage.
- Utility coverage is reasonably strong for:
  - timer validation
  - storage normalization
  - summary derivation
  - sankalpa progress
  - playlist logging/policies
- Route components generally consume helpers rather than embedding heavy business logic directly in JSX.

## Findings

### Critical

1. Session-log history is silently truncated to 50 entries in shared reducer logic.
- Affected area/files:
  - `src/features/timer/timerReducer.ts`
  - `requirements/decisions.md`
  - `src/utils/summary.ts`
  - `src/utils/sankalpa.ts`
- Why it matters:
  - the reducer appends and sorts logs, then slices the list to `MAX_SESSION_LOGS = 50`
  - summaries and sankalpa logic are explicitly documented to derive from the full local `session log` set
- Likely risk if left unchanged:
  - incorrect summary totals
  - incorrect sankalpa progress once a user exceeds 50 logs
  - older practice history disappears without an explicit product decision
  - trust-breaking data loss that tests currently do not guard against
- Recommended remediation:
  - remove the hard truncation from shared reducer flow
  - if any retention policy is desired, make it explicit and apply it at a clearly documented storage boundary
  - add tests covering history size beyond 50 entries and verifying summary/sankalpa correctness with older logs retained

### Important

1. `TimerContext` has become a large multi-domain orchestration layer.
- Affected area/files:
  - `src/features/timer/TimerContext.tsx`
  - `src/features/timer/timerContextObject.ts`
- Why it matters:
  - one context now owns timer settings, active timer lifecycle, playlist-run lifecycle, manual logging, custom plays, playlists, persistence, recovery messages, and API-boundary calls
  - this centralizes too many reasons to change in one file
- Likely risk if left unchanged:
  - higher regression risk when touching unrelated features
  - broad rerender surface for all consumers
  - harder onboarding and slower refactors because the state model is concentrated in one 600+ line file
- Recommended remediation:
  - split orchestration by domain responsibility
  - keep timer-session logic separate from playlist/custom-play/catalog concerns
  - extract persistence/recovery behavior into smaller hooks or repository-style helpers

2. Persistence and REST-style boundaries are inconsistent and only partially adopted.
- Affected area/files:
  - `src/utils/playlistApi.ts`
  - `src/utils/sankalpaApi.ts`
  - `src/utils/mediaAssetApi.ts`
  - `src/pages/HomePage.tsx`
  - `src/features/timer/TimerContext.tsx`
- Why it matters:
  - playlist APIs are async wrappers over local storage, sankalpa APIs are sync wrappers, and Home bypasses the boundary entirely by reading storage directly
  - endpoint constants exist, but the abstraction is not consistently used as the real integration seam
- Likely risk if left unchanged:
  - future backend migration will require touching many call sites instead of one boundary
  - inconsistent async/sync behavior increases accidental complexity
  - duplicate sources of truth emerge around storage access
- Recommended remediation:
  - choose one clear repository/API-boundary pattern and apply it consistently
  - route all sankalpa and playlist reads/writes through that boundary
  - stop reading persisted domain data directly from route components

3. Custom-play persistence denormalizes media label/path into stored records instead of treating media metadata as canonical data.
- Affected area/files:
  - `src/types/customPlay.ts`
  - `src/utils/customPlay.ts`
  - `src/utils/storage.ts`
  - `src/utils/mediaAssetApi.ts`
- Why it matters:
  - custom plays persist `mediaAssetId`, `mediaAssetLabel`, and `mediaAssetPath`
  - label/path are derivable from the canonical media asset record and can drift if the catalog changes
- Likely risk if left unchanged:
  - stale labels or paths in existing saved records
  - extra migration burden if media storage evolves
  - harder reasoning about which field is authoritative
- Recommended remediation:
  - persist the stable media asset id only
  - resolve label/path through the media boundary at read/render time
  - keep any derived fallback behavior explicit for legacy records

4. Domain invariants are duplicated across layers instead of being shared from one canonical source.
- Affected area/files:
  - `src/types/timer.ts`
  - `src/features/timer/constants.ts`
  - `src/utils/storage.ts`
  - `src/utils/summary.ts`
  - `src/utils/sankalpa.ts`
- Why it matters:
  - meditation types and time-of-day buckets are repeated in multiple modules
  - storage validation, UI lists, and summary ordering each carry their own copies
- Likely risk if left unchanged:
  - drift between validation, persistence normalization, and UI options
  - harder global changes when product terminology or supported values evolve
- Recommended remediation:
  - move domain enumerations and ordering into shared domain modules
  - import those constants everywhere validation, normalization, and UI depend on them

5. Architecture documentation and actual routing structure have drifted apart.
- Affected area/files:
  - `docs/architecture.md`
  - `src/App.tsx`
  - `src/components/PlaceholderScreen.tsx`
- Why it matters:
  - docs still describe `/practice/timer` and `/practice/plays`, while the implementation uses `/practice` with embedded management flows
  - `PlaceholderScreen` remains in the codebase although the routes are no longer placeholder-driven
- Likely risk if left unchanged:
  - new contributors will form the wrong mental model of the route structure
  - cleanup work becomes harder because legacy scaffolding and current behavior coexist
- Recommended remediation:
  - update architecture docs to match current route composition
  - remove `PlaceholderScreen` if it is no longer part of any active path

### Hygiene / Cleanup

1. Error handling around persistence writes is very thin.
- Affected area/files:
  - `src/features/timer/TimerContext.tsx`
  - `src/utils/playlistApi.ts`
  - `src/utils/sankalpaApi.ts`
  - `src/utils/storage.ts`
- Why it matters:
  - writes assume success and, in the playlist path, async persistence is intentionally discarded with `void`
- Likely risk if left unchanged:
  - silent failures if the storage or API boundary later becomes fallible
- Recommended remediation:
  - introduce a small result/error contract for repository writes before backend work expands

2. Several route-level components are quite large for their responsibilities.
- Affected area/files:
  - `src/pages/SankalpaPage.tsx`
  - `src/features/customPlays/CustomPlayManager.tsx`
  - `src/features/playlists/PlaylistManager.tsx`
- Why it matters:
  - they remain readable today, but state, formatting helpers, and view logic are beginning to crowd together
- Likely risk if left unchanged:
  - slower edits and more fragile JSX-heavy changes
- Recommended remediation:
  - extract presentational subcomponents once the next behavior slice touches these areas

3. The test suite is strong at the utility level, but there is no guard for the current history-retention bug.
- Affected area/files:
  - `src/features/timer/timerReducer.test.ts`
  - `src/utils/summary.test.ts`
  - `src/utils/sankalpa.test.ts`
- Why it matters:
  - the most important data-correctness gap is currently untested
- Likely risk if left unchanged:
  - future changes can preserve the bug unnoticed
- Recommended remediation:
  - add focused tests for session-log retention behavior and long-history summary/goal calculations

## Prioritized remediation plan

### Architecture / Correctness
1. Remove silent 50-log truncation and preserve full local session-log history.
2. Extract session-log persistence/retention policy into a single explicit boundary.
3. Normalize persistence/API seams so playlist and sankalpa data are accessed through one consistent abstraction.

### Maintainability
1. Break `TimerContext` into smaller domain-oriented orchestration units.
2. Stop persisting denormalized media label/path fields on custom plays.
3. Centralize shared domain enumerations and ordering.
4. Update route/architecture docs so they reflect the implementation that contributors actually work in.

### Cleanup / Polish
1. Remove unused placeholder scaffolding.
2. Add lightweight write-error handling contracts around repository/storage calls.
3. Continue extracting small presentational subcomponents from the longest route managers as those areas evolve.

## Overall recommendation
Prioritize correctness over cleanup. The next code-quality slice should fix session-log retention first, because it affects summaries, sankalpa progress, and user trust. After that, the most valuable maintainability work is shrinking the `TimerContext` blast radius and making the persistence/API seams consistent before any backend-backed evolution begins.
