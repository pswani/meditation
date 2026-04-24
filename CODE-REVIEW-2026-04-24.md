# Meditation App — Full-Stack Code Review

**Date:** 2026-04-24
**Scope:** Database (Flyway + H2), Backend APIs (Spring Boot 3.3.4 / Java 21), Web front end (React 19 / TS / Vite), iOS native (Swift 6 / SwiftUI), plus cross-cutting concerns (contracts, scripts, CI, docs, repo hygiene).
**Method:** Parallel deep reads of each tier by focused subagents, then consolidation and spot-check verification of representative findings.

---

## Executive Summary

The codebase is clearly built by a thoughtful team and shows real architectural intent — feature-sliced frontend, bounded-context backend packages, a separate `MeditationNativeCore` package on iOS, a generated sync contract shared across tiers, Flyway migrations, and a sync queue with stale-write protection. Tests exist in all three tiers and cover a lot of ground.

However, the intent is not uniformly realized, and the project is carrying significant debt as it has grown. The DDD/hexagonal framing the repo implies is not actually present on the backend (services + JPA entities, no aggregates, no ports/adapters). The frontend has two files approaching or exceeding 1,400 lines that do far too much (`TimerContext.tsx`, `useTimerSyncEffects.ts`). The iOS app has a 1,678-line `ShellViewModel` god-object. The sync protocol relies on client-supplied timestamps with no clock-skew guard, and three clients each parse it independently. Security posture for a "currently single-user" deployment is acceptable but fragile — no auth model at all, wildcard CORS headers, H2 in prod, actuator likely exposed, backend HTTP-only.

**Headline verdict:** the app works and ships, but the "DDD + hexagonal" story in the docs is aspirational, not implemented. Tech debt is accumulating unevenly — worst in a few large files that everyone keeps appending to — and the sync contract is the single biggest architectural risk because it's the seam between three tiers that can each drift independently.

**Overall health: 6 / 10.**
- Backend & DB: 5
- Web: 7
- iOS: 6.5
- Cross-cutting: 7

Roughly 135 issues were catalogued below, split as **~30 High, ~55 Medium, ~50 Low**. This report is organized by severity within each tier so you can skim the High list and triage. Each finding has a file:line pointer, evidence, why it matters, and a concrete fix.

---

## Top-10 Issues Across the Whole App

These are the findings I'd fix first if I had one sprint. They cut across tiers.

1. **Backend has no global exception handler.** `grep` for `@RestControllerAdvice`/`@ExceptionHandler` in `backend/src/main/java` returns zero hits. Spring's default 500 serialization leaks stack traces to clients. (Backend H-1)
2. **Stale-write detection depends on unverified client clocks.** `SyncRequestSupport.isStaleMutation` compares `existingUpdatedAt` to the client-supplied `X-Meditation-Sync-Queued-At` header with no skew bound. A client 10 minutes behind silently defeats the protection. (Backend H-4, Web H-7)
3. **`V14__drop_session_log_library_foreign_keys.sql` dropped referential integrity** after V10 denormalized playlist/custom-play fields into `session_log`. There is no service-layer check replacing the FK and no documented reason. Orphaned IDs will silently accumulate. (Backend H-2, H-3)
4. **Actuator + H2 + wildcard CORS headers + no auth, all together.** Any one of these is defensible alone. Stacked, they mean a network-reachable backend exposes `/actuator/env` (secrets), accepts mutations from anywhere, stores user data in an unencrypted local H2 file, and has no identity model. (Backend H-7, H-9, H-10; Cross H-1, H-4)
5. **Timer correctness uses wall-clock time on both web and iOS.** Web: `Date.now()` subtractions in `getActiveSessionElapsedSeconds`. iOS: `Timer.publish(every: 1, on: .main)`. Neither is monotonic. NTP adjustments, main-thread pressure, and background suspension can all produce negative or drifting durations. (Web H-6, iOS H-1, iOS M-7)
6. **Three monster files.** `src/features/timer/TimerContext.tsx` is 1,372 lines; `src/features/timer/useTimerSyncEffects.ts` is 822 lines; `ios-native/MeditationNative/App/ShellViewModel.swift` is 1,678 lines. These are where the debt is concentrated and where each new feature lands. (Web H-1, H-2, iOS M-6)
7. **No frontend `ErrorBoundary`.** `grep` confirms zero `ErrorBoundary`/`componentDidCatch`/`getDerivedStateFromError` in `src/`. Any render error in a provider or route blanks the app. (Web H-8)
8. **Sync contract is the seam but lives in multiple places with no CI cross-check.** `contracts/sync-contract.json` is the canonical contract, but `GeneratedSyncContract.java` (backend) and `src/generated/syncContract.ts` (web) are independent generators, and iOS appears to model it by hand. No CI job fails if they drift. (Cross H-5, Backend M-26, Web M-11)
9. **Sync queue dedup can silently lose deletes.** `syncQueue.ts` dedups by `(entityType, recordId)` regardless of operation, so an `upsert` enqueued after a pending `delete` of the same record removes the delete entirely. (Web M-18)
10. **iOS bell reliability still unproven.** `EXECPLAN-ios-native-bell-reliability.md` exists because this is a known gap. `SilentBackgroundAudioKeepAlive` is wired conditionally; `AVAudioSession` interruption handlers are absent; `Timer.publish` is wall-clock; `Task` captures are often missing `[weak self]`. The end bell will miss. (iOS H-1 through H-4, M-10, M-15)

---

## Tech-Debt Heatmap

| Area | State | Why |
|---|---|---|
| `src/features/timer/TimerContext.tsx` + `useTimerSyncEffects.ts` | 🔴 Hot | ~2,200 lines combined of state, hydration, sync, audio, and foreground-catchup orchestration. Ground zero for frontend regressions. |
| `ios-native/MeditationNative/App/ShellViewModel.swift` | 🔴 Hot | 1,678-line god viewmodel; coordinates everything. |
| `backend/.../sankalpa/SankalpaService.java` | 🔴 Hot | 700+ lines mixing TZ math, cadence, observance, sync. Triple-loads observance entries per request. |
| Sync contract ↔ three clients | 🔴 Hot | Three independent implementations of one protocol with no cross-tier CI. |
| DB schema | 🟡 Warm | V1→V15 is organic growth; V14 drops FKs without a replacement invariant; denormalized columns diverging. |
| Backend security posture | 🟡 Warm | No auth, open actuator, `allowedHeaders("*")`, H2 in prod. OK for `localhost` only; unsafe for any real exposure. |
| Frontend storage | 🟡 Warm | No quota handling, no corruption recovery, cache-bust hash not reproducible. |
| iOS audio session lifecycle | 🔴 Hot | Bell reliability is a known live defect. |
| Scripts (`scripts/`) | 🟢 OK | Generally clean; minor hygiene items. |
| Docs | 🟡 Warm | 1,227-line README drifts from reality; many EXECPLAN-*.md files stacked at root. |

---

## Architecture Verdicts (Answering Your Four Questions)

### 1. Design patterns and best practices
Partially present. Reducer + context pattern on the frontend is appropriate. Records-as-DTOs on the backend is appropriate. Swift `@Observable`/MVVM on iOS is appropriate. But the execution is inconsistent — the web `TimerContext` fans out its context value to 50+ methods (guaranteeing wide re-renders), the backend mixes validation across controllers and services with no consistent entry point, and the iOS ViewModel bypasses its own pattern by absorbing everything.

### 2. Is DDD implemented correctly?
**No, and the repo doesn't really claim to be.** Backend packages are organized by bounded context (good: `customplay`, `playlist`, `sankalpa`, `sessionlog`, `summary`, `sync`, `reference`, `media`) but there are no aggregate roots, no value objects, no domain events, and no invariants enforced in the domain — just JPA entities with getters and service classes that orchestrate them. This is classic "anemic domain model + transaction script." That's a legitimate choice for a small app, but `docs/architecture.md` claims more than the code delivers, which creates a drift the next contributor pays for.

### 3. Is hexagonal architecture implemented correctly?
**No.** There are no ports (interfaces in the domain that the application depends on) and no adapters (separate infrastructure modules that implement those ports). Domain classes are JPA entities — they depend on Spring/JPA. Controllers depend directly on repositories in some places. iOS is closer — `MeditationNativeCore` is a Swift package separate from the UI app — but even there `AppSyncClient`/`AppSyncService` mix concerns. No violation of pattern *causes* a production outage today, but the scaffolding you'd need to later swap H2 for Postgres, or swap the HTTP transport, isn't there.

### 4. Is the architecture elegant? How much debt?
Elegance is uneven. The sync design (offline queue, stable client IDs, stale-write detection, reconciled delete) is *conceptually* elegant and the team clearly thought about it. The three monster files, the 15 Flyway migrations with one destructive one, the 51KB README, the `a.txt` build log committed at root, and a sync protocol re-implemented three times tell you debt is real and growing. The worst debt is concentrated — fix the three monster files and the contract generation, and you've addressed maybe 60% of the pain.

---

# Backend & Database

**Verdict: Layered Spring Boot REST API, not DDD, not hexagonal. Pragmatic, testable, but accumulating security, validation, and consistency debt. Score 5/10.**

## High

### B-H1. No global exception handler — stack traces leak
`grep -r "ControllerAdvice\|ExceptionHandler" backend/src/main/java` returns zero hits. Controllers throw `ResponseStatusException` ad-hoc; Spring's default 500 serializer exposes the stack. Add a `@RestControllerAdvice` that returns `application/problem+json` and logs full traces server-side.

### B-H2. V14 drops FKs without replacement invariant
`backend/src/main/resources/db/migration/V14__drop_session_log_library_foreign_keys.sql` unconditionally drops `fk_session_log_custom_play` and `fk_session_log_playlist`. No service-layer check, no documented rationale. Add service-layer validation that the referenced ids exist (or restore FKs with `ON DELETE SET NULL`), and a comment header on the migration explaining why.

### B-H3. `session_log` denormalizes playlist/custom-play names with no refresh
`V10__add_custom_play_fields_to_session_log.sql` + `SessionLogEntity.java` copy `customPlayName`, `customPlayRecordingLabel`, `playlistName` into the log row. Renaming a custom play never updates the historical logs — queries return stale names indefinitely. Either drop the denormalization and JOIN, or document that these fields are intentionally point-in-time snapshots.

### B-H4. Stale-write detection depends on client clock with no skew bound
`SyncRequestSupport.isStaleMutation(existingUpdatedAt, syncQueuedAtRaw)` trusts the client-supplied `X-Meditation-Sync-Queued-At` header. Clients with wrong clocks silently defeat the protection. Reject syncs where `|clientTime - serverTime| > 300s`. Document the requirement.

### B-H5. No idempotency tokens on upsert endpoints
`PUT /api/custom-plays/{id}`, `/api/playlists/{id}`, `/api/sankalpas/{id}`, etc. are idempotent *by payload* but have no client-token deduplication. A retried POST-like mutation can double-apply if the payload mutates state other than the provided fields (e.g., timestamps). Add optional `X-Idempotency-Key`, cache (key→response) for 24h.

### B-H6. Integer request fields accept negatives / overflow
`SessionLogUpsertRequest.intervalMinutes`, `CustomPlayUpsertRequest.durationMinutes`, etc. are primitive `int` with no `@Min`/`@Max`/`@Positive`. Validation happens in some services (e.g., `TimerSettingsService.java:105`) but inconsistently. Add Bean Validation annotations on the DTOs and a global `@Valid` on controllers.

### B-H7. Wildcard CORS allowed headers
`backend/src/main/java/com/meditation/backend/config/WebConfig.java:28` has `.allowedHeaders("*")`. Combined with PUT/POST/DELETE methods and no CSRF token enforcement, cross-site requests can spoof custom headers. Restrict to a known list: `Content-Type`, `X-Meditation-Sync-Queued-At`, `X-Requested-With`.

### B-H8. No rate limiting anywhere
No bucket4j, no Spring Cloud Gateway, no Nginx limit config documented in `mac-mini-production-runbook.md`. A single client can enqueue thousands of sankalpas or playlist items in seconds. Add per-IP rate limits (memory-backed is fine for single-machine) on all `POST`/`PUT`/`DELETE` endpoints.

### B-H9. H2 in production, no alternative configured
`backend/src/main/resources/application.yml` defaults to H2, username `sa`, blank password. No `application-prod.yml` overrides in the repo. If someone deploys with the wrong active profile, user data goes into an unencrypted H2 file. Add a `@PostConstruct` guard that refuses to start on the `prod` profile if `spring.datasource.url` contains `h2:`.

### B-H10. Actuator likely exposed
`pom.xml` does not appear to exclude `spring-boot-starter-actuator` or customize `management.endpoints.web.exposure.include`. Default exposure of `/actuator/health` is fine; exposure of `/actuator/env` (secrets), `/actuator/metrics`, `/actuator/httptrace` is not. Set `management.endpoints.web.exposure.include=health,info` in `application.yml` and re-enable broader endpoints only under a secured profile.

### B-H11. Sankalpa service is a 700-line god
`backend/src/main/java/com/meditation/backend/sankalpa/SankalpaService.java` mixes timezone math, cadence calculation, observance-entry maintenance, sync reconciliation, and persistence. It calls `sankalpaObservanceEntryRepository.findAll…()` three times per save. Extract `SankalpaCadencePolicy`, `SankalpaObservanceRecalculator`, and `SankalpaProgressProjector` as separate classes. Cache the observance query within a request.

## Medium

### B-M1. Transactional boundaries are inconsistent
`PlaylistService` and `SankalpaService` annotate `@Transactional`. `CustomPlayService.saveCustomPlay()` and `SessionLogService.saveSessionLog()` do not. Partial writes on failure are possible. Annotate consistently with `@Transactional(rollbackFor = Exception.class)` and add a test that asserts rollback.

### B-M2. No pagination on list queries
`PlaylistService` uses `findAllByPlaylistIdInOrderByPlaylistIdAscPositionIndexAsc(playlistIds)` unbounded. `SessionLogRepository.findTimeSlices()` is unbounded. Any user with enough history causes a memory spike. Accept a `Pageable` and return `Page<T>`.

### B-M3. Missing index on `session_log(ended_at, created_at)`
V1 creates `ix_session_log_ended_at` (single column). Summary queries sort by both columns; planner falls back to an in-memory sort. Add a composite index.

### B-M4. Float arithmetic on Sankalpa progress
`SankalpaService.java:~259` divides `(double) progressValue / targetValue` and calls `Math.min(..., 1.0)`. Percentages fluctuate at the boundary. Use `BigDecimal` with `RoundingMode.HALF_UP` or store fraction as `(numerator, denominator)`.

### B-M5. `BigDecimal.stripTrailingZeros()` before persist
`SankalpaService.java:~108` strips trailing zeros, which changes `scale`. If a column is `numeric(10,2)` and a later read expects scale 2, comparisons may fail. Don't strip pre-persist; normalize with `setScale(2, HALF_UP)`.

### B-M6. `Clock.systemUTC()` only — user TZ ignored
`TimeConfig.java:10-13` hardwires UTC. Sankalpa deadlines, summary buckets, and manual logs all implicitly assume user TZ matches server. Accept TZ per request (already partly done) and pass it into deadline/bucket calculations consistently.

### B-M7. Reference data in three places
`V2__seed_reference_data.sql`, `GeneratedSyncContract.java`, and `contracts/sync-contract.json` all list meditation types. Drift risk on each change. Drive all three from the JSON via codegen + a CI check.

### B-M8. Every service hand-rolls `toResponse()` mapping
Mappers are scattered across ~8 services. Manual DTO/entity mapping is fine, but it's not being done consistently (some null-safe, some not — e.g., `SankalpaService.toProgressResponse()` assumes non-null `createdAt`). Pick one — MapStruct or hand-rolled with a shared `Mapping` utility — and enforce.

### B-M9. No audit/logging of mutations
Services don't log "who (no identity today) changed what from what to what." There is no Envers, no structured SLF4J, no audit trail. For compliance *and* forensics this is the first thing to add when you add an auth model.

### B-M10. Observance replace via delete-then-insert is not atomic
`SankalpaService.replaceObservanceEntries()` does `deleteAllBySankalpaId(...)` then `saveAll(...)`. Even within `@Transactional`, a failure on the save half commits the delete if exception is swallowed. Prefer MERGE/UPSERT per entry, or add an assertion that the surrounding method is `@Transactional`.

### B-M11. `external_id` generated by migration, mutable in entity
`V5__add_playlist_rest_support.sql:5` generates `external_id = concat('playlist-item-', id)`. `PlaylistItemEntity` exposes it without an immutable guard. Add a `CHECK` or reject updates to `external_id` at the service layer.

### B-M12. `MediaAssetEntity.updated_at` not auto-updated
No `@UpdateTimestamp` on the field; service methods don't all refresh it. Stale frontend caches result. Use `@UpdateTimestamp` or a DB trigger.

### B-M13. Mime type is free-form text
`mime_type varchar(100)` with no constraint. A client can set `image/svg+xml` on an audio record. Add a `CHECK` against a whitelist.

### B-M14. Sankalpa `createdAt` accepted from request
`SankalpaService.saveSankalpa()` uses `parseTimestamp(request.createdAt())` and trusts it. A wrong client clock shifts goal windows. Accept client-supplied `createdAt` only if within ±10 min of server time; otherwise stamp server-side.

### B-M15. No startup check that reference data seeded
If V2 is skipped in a hand-rolled deploy, app starts and serves empty reference lists. Add a `CommandLineRunner` that queries `meditation_type_ref` count and fails startup if empty.

### B-M16. Hibernate `spring.jpa.open-in-view=true` (default) risks N+1
Not explicitly disabled. Lazy fetches get serialized during JSON rendering. Set `spring.jpa.open-in-view=false` and fetch what you need in services.

### B-M17. No tests for concurrent sync
`CustomPlayControllerTest` covers happy path and stale; there is no `CountDownLatch`-style test proving two simultaneous PUTs yield one winner. Given that stale detection is the whole point of sync — add it.

## Low

### B-L1. DELETE is not idempotent on response code
First `DELETE` returns 204, second returns 404. Clients reasonably retry; make both 204 (or 410 Gone if you want the distinction to be observable).

### B-L2. No soft deletes
Hard deletes across the board. Fine for now; forensics will hurt later.

### B-L3. No `application-prod.yml` / `application-dev.yml`
Single `application.yml` with defaults. See B-H9.

### B-L4. `DELETE` on playlist cascades via FK `ON DELETE SET NULL` but no test
Add a test that confirms `session_log.playlist_id` becomes NULL after playlist delete.

### B-L5. Unbounded summary queries
`SummaryService` recomputes from session logs every request with no cache. `@Cacheable` with a short TTL is cheap.

### B-L6. `Instant.parse` catches scattered
`CustomPlayService.parseOptionalTimestamp()` handles `DateTimeParseException`; similar code in other services may not. Centralize in `SyncRequestSupport`.

### B-L7. Custom play references `mediaAssetId` with no existence check on read
If a media asset is directly deleted, responses contain a broken link silently.

### B-L8. `TimerSettings` id uniqueness not explicit
Assumes a single `default` row. Add a `UNIQUE` constraint defensively.

### B-L9. `0 or positive interval_minutes` constraint not in V1
Added later in V3. Defensible, but worth documenting.

### B-L10. Playlist item `position_index` has no gap validation
`[0, 2, 5]` stored without complaint; UI assumes contiguous. Validate server-side.

### B-L11. Test profile uses `@ActiveProfiles("test")` but no `application-test.yml` evident
Confirm it's present; a grep suggested it was not committed.

### B-L12. Maven wrapper (`mvnw`) not present
Builds depend on whatever Maven is installed. Add `mvn wrapper:wrapper`.

### B-L13. Spring Boot 3.3.4
Current. Fine. Bump regularly.

---

# Web (React / TypeScript / Vite)

**Verdict: Solid offline-first architecture with real thought behind the sync queue and service worker. Two monster files concentrate most of the debt. Score 7/10.**

## High

### W-H1. `TimerContext.tsx` is 1,372 lines and owns everything
`src/features/timer/TimerContext.tsx` manages settings, active sessions (timer, custom play, playlist), session logs, custom plays, playlists, outcome tracking, hydration, visibility/pageshow handlers, and audio player wiring. Single responsibility is obliterated. Split into `TimerStateContext` (reducer only), `TimerActionsContext` (dispatch helpers), `CustomPlayContext`, `PlaylistRuntimeContext`, `SessionLogContext`. Split the memoized value so consumers re-render only for what they consume.

### W-H2. `useTimerSyncEffects.ts` is 822 lines of hydration + reconciliation
`src/features/timer/useTimerSyncEffects.ts` duplicates hydration patterns for 4 entity types with ~18 refs for dedup tracking. Extract a `createCollectionHydrator({ api, reducer, queueReconciler })` factory; shrink the file by >70%.

### W-H3. Sync queue retries are unbounded and uniform
`src/utils/syncQueue.ts:~markSyncQueueEntryFailed` bumps `retryCount` with no cap and no backoff. Fixed 15s poll. Add `maxRetries` (5), exponential backoff with jitter, and a dead-letter bucket the UI can surface.

### W-H4. `localStorage` writes swallow `QuotaExceededError`
`src/utils/storage/*`, `saveSyncQueue`, `saveSessionLogs`, etc. call `setItem` with no try/catch. On quota exceeded the in-memory state silently diverges from storage. Catch, evict oldest non-critical (session logs > 90 days), and surface a banner.

### W-H5. Service worker media cache evicts by count, not bytes
`public/offline-sw.js` uses `MAX_MEDIA_CACHE_ENTRIES = 12`. A user with 12 × 24MB files evicts nothing; a user with 12 × 100KB files evicts aggressively. Track byte totals, maintain an index, evict until `total + incoming ≤ cap`.

### W-H6. Timer elapsed uses wall-clock `Date.now()`
`src/features/timer/time.ts:getActiveSessionElapsedSeconds` computes `nowMs - session.lastResumedAtMs`. Both are `Date.now()`. NTP adjustment can rewind; accumulated session time can go backward. Store `lastResumedAtPerformanceMs` (monotonic) alongside, diff that for elapsed, keep wall-clock only for display/log timestamps.

### W-H7. Sync queue races on reload during in-flight
`useTimerSyncEffects` marks entries in-flight in localStorage, then fires the request. A mid-flush reload, SW update, or crash leaves entries in-flight forever. Add a `stalledAfterMs` threshold; on reload, demote in-flight older than 30s back to pending. Backend idempotency key (see B-H5) must agree so the redrive doesn't double-apply.

### W-H8. No `ErrorBoundary`
`grep` for `ErrorBoundary|componentDidCatch|getDerivedStateFromError` in `src/` returns nothing. Any render error in any provider or route blanks the app. Wrap `<App />` (and ideally each route) in a boundary with a recovery UI and an error sink.

### W-H9. Audio players not disposed on unmount
`src/features/timer/timerSoundPlayback.ts` keeps a `Map<string, AudioLike>` that never clears. Dispose in an effect cleanup and on timer cancellation. Same pattern in `useShellAudioSync.ts` — fetch promises have no `AbortController`.

### W-H10. Sync contract generated in two places independently
`scripts/generate-sync-contract.mjs` writes `src/generated/syncContract.ts` from `contracts/sync-contract.json`. The backend's `GeneratedSyncContract.java` is *separately* generated (or worse, hand-maintained). CI doesn't verify both are in sync. Add a `pipeline:verify` step that regenerates both and diff-fails if the repo copy is stale.

## Medium

### W-M1. Visibilitychange + pageshow fire overlapping catch-up
`TimerContext.tsx:~465-490` registers both handlers. Alt-tab fires both; duplicate completion checks can happen. Coalesce into one handler with a 100ms debounce.

### W-M2. Playlist item deletion mid-playback orphans the audio element
`src/app/AppShell.tsx:~95-165`: when `activePlaylistItem` goes null during an active run, `playlistAudioRef.current` keeps playing. Pause and end-run on transition.

### W-M3. Fetches without `AbortController`
`useShellAudioSync.ts` dispatches `mediaAssetApi.loadMediaAsset(...)` without abort. Unmount during fetch → unmounted setState → leak.

### W-M4. TimerContext value fans out ~50 methods
`src/features/timer/timerContextObject.ts` defines a single `TimerContextValue` with dozens of methods. Any memo miss re-renders every consumer. Split, memoize per domain, or migrate to a `useSyncExternalStore`-backed store with selectors.

### W-M5. Tests are heavy on snapshots
`src/pages/SankalpaPage.test.tsx` is ~978 lines; `pages/*.test.tsx` ratios are high. Snapshots catch structure churn, not behavior. Convert critical paths to behavior assertions (`await screen.findByText(...)`).

### W-M6. API error parsing is text-only
`src/utils/apiClient.ts:~110-125` reads the response as text. If backend returns JSON `{error,message}`, the detail is raw JSON. Detect `application/json`, parse, extract `message`/`error`.

### W-M7. Sync queue dedups across operation types
`enqueueSyncQueueEntry` dedups by `(entityType, recordId)` alone. An `upsert` queued after a `delete` of the same record removes the delete. Preserve pending deletes unless a new delete supersedes them. Subtle, high impact.

### W-M8. No request concurrency bound
Four collection hydrations fire simultaneously on boot. Throttle to 2 concurrent.

### W-M9. O(n) `recentLogs` on every render
Filter + sort + slice with no memo in `TimerContext` consumers. Memo the derived list against `sessionLogs` identity.

### W-M10. Session-log timestamps are client-generated
`new Date().toISOString()` on record. Backend should re-stamp on receive and keep `clientCreatedAt` for the audit trail. Aligned with B-M14.

### W-M11. Manual duration input not range-validated
`usePracticeSetupState.ts` accepts any number for `durationMinutes`. Enforce `[1, 1440]` at the form.

### W-M12. Audio element hidden with `style={{display:'none'}}`
`AppShell.tsx:~155-195`. No keyboard access to pause. For accessibility, offer visible controls or custom keyboard-accessible pause.

### W-M13. Asset version hash is not reproducible
`vite.config.ts:createAppAssetVersion` hashes file contents but not deterministically across file order/platform. Use the git SHA or sort before hashing. Otherwise cache-bust hash differs between CI and local.

### W-M14. `crypto.randomUUID` fallback is collision-prone
`syncQueue.ts:createQueueId` falls back to `Date.now()` + `Math.random()`. If two clients start at the same ms, collisions are possible. Use `crypto.getRandomValues` fallback.

### W-M15. SW cache version from URL search param
`public/offline-sw.js:resolveCacheVersion` reads `?v=` from its own URL. If an attacker can get the SW fetched with a different `v`, they can pin users to an old cache. Read from a controlled header or embedded constant at build.

### W-M16. No feature flag / kill switch for problematic clients
If a bug ships to iOS Safari, you can't remotely disable a feature. Consider `GET /api/client-flags` served by the backend.

## Low

### W-L1. Inconsistent memoization
`useCallback` / `useMemo` use varies file to file. Establish a convention; let ESLint `react-hooks/exhaustive-deps` enforce it.

### W-L2. Discriminated unions lack `as const`
`src/types/sync.ts`, `timer.ts` — literal types get widened. Use `as const` on action-type constants and derive union.

### W-L3. No toast auto-dismiss
`ShellStatusBanners.tsx` banners stay until cleared.

### W-L4. Playlist form allows empty / duplicate titles
`src/features/playlists/PlaylistForm.tsx`. Validate.

### W-L5. Media has no cache-busting version
If backend updates a recording, clients see old copy indefinitely. Append `?v={contentHash}` to the media URL in the media asset response.

### W-L6. Audio onError has no retry
`AppShell.tsx:~140-145` reports error, no retry. Transient fail surfaces permanently.

### W-L7. Sankalpa observance doesn't guard against duplicate same-day entries
Client-side. Add a `findIndex` pre-check.

### W-L8. Interval cue doesn't check paused state
Pause while an interval bell is queued; it plays anyway.

### W-L9. `getUserTimeZone()` returns unvalidated IANA string
No list check. If backend expects canonical IDs, non-canonical values break summary.

### W-L10. Session log list is unpaginated
`listSessionLogsFromApi` loads everything. Add `limit`/`offset` and change display code.

### W-L11. Playlist item durations not guarded at ≥ 0
`getPlaylistItemDurationSeconds` can return 0 or negative, causing infinite-loop-adjacent behavior.

### W-L12. Custom play media catalog cache not invalidated on update
`useCustomPlayMediaCatalog` caches once on mount.

### W-L13. No runtime contract validation
Frontend assumes `/api/*` responses match `syncContract.ts`. One unexpected shape can cascade. Add zod (or io-ts) validation at the API boundary.

### W-L14. Service worker skip-waiting / immediate claim policy undocumented
It's easy to ship a SW that traps users on an old bundle after deploy.

### W-L15. Generated files checked in (`src/generated/`)
Fine, but add a CI check that regenerating produces no diff.

---

# iOS Native

**Verdict: Modern Swift 6 / @MainActor discipline, clean `MeditationNativeCore` package boundary, but one god ViewModel absorbs most of the app, and audio-session reliability is a known live defect. Score 6.5/10.**

## High

### I-H1. Timer tick uses wall-clock `Timer.publish`
`ios-native/MeditationNative/App/ShellViewModel.swift:~960-967` uses `Timer.publish(every: 1, on: .main, in: .common)`. Main-thread stalls skip ticks; background suspension skips all. Use `DispatchSourceTimer` on a background queue for schedule, and `ContinuousClock` for elapsed accounting. Decouple display from scheduling.

### I-H2. `Task { ... }` captures without `[weak self]`
`ShellViewModel.swift` lines ~369, 599, 909, 1249, 1265-1267, 1555, 1573 create unstructured tasks that capture `self` strongly. Retain cycles and work firing on would-be-deallocated objects. Audit and add `[weak self]`, and prefer structured concurrency with `async let` / `TaskGroup` + cancellation.

### I-H3. Background audio keepalive wired conditionally — bells under lock unreliable
`ShellViewModel.swift:~225-276` drives `SilentBackgroundAudioKeepAlive` only when `shouldKeepBackgroundAudioAlive(for:)` matches specific conditions (timer end/interval, custom play missing media). A custom play *with* a recording but with an end bell doesn't trigger keepalive — the recording finishes, audio session deactivates, end bell misses. Cover all bell-emitting cases. Add a regression test per `EXECPLAN-ios-native-bell-reliability.md` milestone 3.

### I-H4. No `AVAudioSession.interruptionNotification` handling
`SystemSupport.swift:~245-275` (`SystemSoundPlayer`) and the custom-play/playlist players don't register for interruption notifications. A phone call drops the bell and the app doesn't reschedule. Subscribe in each player; on `.began` mark-as-interrupted; on `.ended` with `.shouldResume`, resume or reschedule.

### I-H5. `ShellViewModel` is 1,678 lines — god object
Persistence, sync coordination, timer state machine, custom play state machine, playlist state machine, notification scheduling, audio delegation, bridge management, presentation. Extract three `*SessionCoordinator` classes. Keep the ViewModel as a thin adapter to `@Published` for SwiftUI.

### I-H6. `PlaybackAudioSessionSupport.options` includes `.duckOthers` without recovery
`SystemSupport.swift:~521-550` sets `.mixWithOthers, .duckOthers, .interruptSpokenAudioAndMixWithOthers`. No observer restores the ducked audio of other apps if this session deactivates abnormally. Explicitly `deactivate(.notifyOthersOnDeactivation)` in all teardown paths and test with background music.

### I-H7. Force-unwraps in test helpers mask real flakes
`Tests/MeditationNativeCoreTests/AppSyncServiceTests.swift:~980`: `try! JSONSerialization.data(...)`, `HTTPURLResponse(...)!`. The EXECPLAN mentions an XCTest flake with unexpected process exit — force-unwraps in test fixtures make that flake impossible to diagnose. Replace with `XCTUnwrap` and `try`.

## Medium

### I-M1. `@ObservedObject` vs `@StateObject` ownership unclear
Root view takes `@StateObject`; child views take `@ObservedObject` on the same ViewModel. Works by accident of the root holding the object. Document ownership or migrate to `@EnvironmentObject` for the ViewModel and pass explicit slices to leaves.

### I-M2. `@Published` on entire sessions causes every-second re-renders
`activeSession` is re-assigned every tick; every view observing anything derived from it re-renders. Extract an `ActiveSessionDisplay` ObservableObject that publishes just `formattedTime`, `progressFraction`, etc. Keep the full session off the SwiftUI graph.

### I-M3. `SilentBackgroundAudioKeepAlive` force-unwrap on `AVAudioFormat`
`SystemSupport.swift:~465-478`: `AVAudioFormat(standardFormatWithSampleRate: 44_100, channels: 1)!`. Devices with odd hardware config could crash. Optional-bind and fall back.

### I-M4. JSON date encoding scattered, not configured on encoder
`AppSyncService.swift` calls `Date.ISO8601Format()` in multiple places rather than `JSONEncoder.dateEncodingStrategy = .iso8601`. Consistency is fragile. Configure encoder/decoder once, centralize.

### I-M5. `JSONFileStore` atomic per file, not transactional across files
`ios-native/Sources/MeditationNativeCore/Services/JSONFileStore.swift:~35-44`. Crash between snapshot write and sync-state write leaves the two out of sync. Either write one combined file atomically or add a WAL.

### I-M6. No snapshot schema versioning
`AppSnapshot` / `AppSyncState` decode structurally; adding a field will fail old snapshots. Add `version: Int`, a migration pipeline, and tests that decode prior-version fixtures.

### I-M7. Pending mutations queue is unbounded
`AppSyncService.enqueue()` has no cap. Offline for months → unbounded memory, slow recovery. Cap (500 entries or 50MB). On overflow, surface UI and offer "discard oldest" or "re-sync from server."

### I-M8. Audio errors logged silently
`SystemSoundPlayer` and `SilentBackgroundAudioKeepAlive` catch and set `isActive = false` without `os.Logger`. When bells fail, nothing in Console.app tells you. Adopt `os.Logger(subsystem:, category:)` throughout.

### I-M9. No tests for session restoration under time warp
If a user backgrounds the app, changes device clock, foregrounds — behavior unverified. Add tests that inject a `Clock` dependency into the session restore path and simulate jumps.

### I-M10. `BundledCustomPlayAudioPlayer` holds session lease across pause
`SystemSupport.swift:~314-362`: `pausePlayback()` does not release the playback-session lease; only `stopPlayback()` does. Long pauses keep the audio session active, draining battery and blocking other apps. Release on pause; re-acquire on resume.

### I-M11. Core package uses Swift 6 strict; app target may not
`Package.swift:29` sets `swiftLanguageModes: [.v6]`. Verify MeditationNative.xcodeproj target is also on Swift 6 / strict concurrency. A CI job that builds with `-strict-concurrency=complete` would lock this down.

### I-M12. No iOS integration tests for sync reconcile
Core tests exist. No end-to-end test that enqueues a mutation offline, brings backend up, and asserts reconciliation matches backend truth. Adds confidence about the contract alignment vs. web.

## Low

### I-L1. `deinit` cancels `clockCancellable` but relies on no retain cycles
Belt-and-suspenders: confirm closures use `[weak self]` and add a test.

### I-L2. `SilentBackgroundAudioKeepAlive.end()` doesn't await engine teardown
Audio hardware may still be draining; deactivating immediately is risky. Add short delay or check engine state.

### I-L3. Bundled sound missing → silent failure
`Bundle.main.url(forResource:...) == nil` returns silently. Assert in DEBUG, `os.Logger.error` in RELEASE.

### I-L4. `AppSyncState` corruption → permanent "pending sync" banner
If the JSON file is unreadable, the fallback hides the fact forever. Log + optionally reset.

### I-L5. No telemetry / crash reporting
For a single-user desktop-era app maybe fine; for scale, add something. (Sentry, OSLog → diagnostic export.)

### I-L6. Access control not audited on Core package public surface
Confirm `public` is intentional on everything; `internal` by default is safer.

### I-L7. UI tests exist; headless CI for UI tests is tricky
Verify `MeditationNativeUITests` runs in CI with a simulator; otherwise they are dev-only.

---

# Cross-Cutting Concerns

**Verdict: The repo is organized and intent-driven. Operational posture is weak for anything beyond single-user `localhost`, and contract-driven development isn't enforced in CI. Score 7/10.**

## High

### X-H1. No auth / identity model anywhere
README doesn't mention users. Backend endpoints are all unauthenticated. OK for a single-user app on your own Mac mini; a blocker the moment a second user exists, or if the backend is reachable off-host.

### X-H2. H2 as sole persistence, no backup story
`docs/mac-mini-production-runbook.md` describes the runbook for the single machine but the H2 file is not mentioned in any backup/restore step. Add a `scripts/backup-db.sh` that takes a consistent snapshot (`SCRIPT TO` or file copy after `CHECKPOINT SYNC`).

### X-H3. Single-machine Mac mini deploy is the architecture
Runbook acknowledges it. Acceptable for current scope; important to label it explicitly. Migration to a real VPS + Postgres + CI deploy is a significant project and should be on `PLANS.md`.

### X-H4. Backend serves HTTP, relies on nginx for TLS
Fine *if* the backend listens on loopback only. Confirm `server.address=127.0.0.1` in `application.yml`; otherwise a hostile network peer can bypass nginx.

### X-H5. Sync contract is consumed by three independent generators
`contracts/sync-contract.json` is the canonical file. `src/generated/syncContract.ts` is generated. Backend has `GeneratedSyncContract.java` (re-generated or hand-maintained). iOS appears to type it by hand. Every change risks two-way drift. Add a CI job: regenerate all three, fail if any differs from repo.

### X-H6. No runtime validation of contract on any client
Even with codegen, JSON shape drift won't be caught at the boundary. Add zod (web) and `Decodable` with clear error messages (iOS) plus a structured handler on the backend for shape-mismatched requests.

## Medium

### X-M1. `a.txt` (55KB) committed at root
Spot-checked: it's a stale build log. Add to `.gitignore` and `git rm` it.

### X-M2. 1,227-line README drifts from code reality
Many bullets describe near-term plans in past tense. Either mark aspirational items or split into README + CHANGELOG. The README is where new contributors are misled first.

### X-M3. CI coverage across all three tiers unclear
Verify `.github/workflows/` actually builds iOS in CI. Simulator builds in GitHub Actions are possible but slow; without them, iOS regressions land silently.

### X-M4. No dependency vulnerability scanning
No Dependabot/Renovate or `npm audit` / OWASP dep-check in CI.

### X-M5. Stale EXECPLAN files at root
`EXECPLAN-ios-native-bell-reliability.md`, `EXECPLAN-ux-review-followup.md`, `PLANS.md`. Ship or archive — a root full of in-progress plans becomes noise.

### X-M6. Logging is unstructured and unaggregated
Backend uses default Spring logging; frontend uses `console.warn`; iOS uses `print`. No central sink. For a single-user deployment, fine. For operability, adopt structured JSON logging + a local log aggregator (even a `tail -F` + `jq` pipeline would help).

### X-M7. Maven wrapper missing
Add `./mvnw` so backend builds are reproducible without a system Maven.

### X-M8. Service-worker strategy undocumented
When to bump the cache version, how to force clients to skip-waiting, what happens if a user is stuck on an old SW. Write a short `docs/web-offline-policy.md`.

### X-M9. `docs/architecture.md` claims more than code delivers
If it says DDD / hex, either change the code or change the doc. Drift in architecture docs is high-cost because it blocks correct reasoning.

## Low

### X-L1. `.agents`, `.codex`, `prompts/` at top level
Tool scaffolding; low risk but clutter. Decide policy: keep in repo with `.gitignore` for content, or move to a `.tooling/` folder.

### X-L2. `.editorconfig` is minimal
Add YAML rules and explicit final-newline enforcement.

### X-L3. `node_modules/` visible in `ls` output
Expected in a local checkout but verify it's gitignored (it is in `.gitignore`).

### X-L4. `dist/` and `local-data/` correctly gitignored
Verified. ✅

### X-L5. No CODEOWNERS / PR template visibility
Check `.github/` — if this is a multi-contributor repo, codify.

### X-L6. No license file detected
If you want anyone else to contribute or use this, add a LICENSE.

### X-L7. No deployment verification step
Runbook documents startup but no `curl /api/health` smoke in the deploy pipeline. Add to `scripts/prod-release.sh`.

### X-L8. Secrets managed by `.env.example` pattern
Acceptable for single-user; mention explicitly that no real secrets live in the repo today.

---

## Suggested Triage (Not Prescriptive)

If the question is "what do I do first," here's an order that front-loads high-impact, low-effort work:

1. **Cheap wins this week.** Add `@RestControllerAdvice` (B-H1), `ErrorBoundary` (W-H8), restrict CORS headers (B-H7), restrict actuator endpoints (B-H10), gitignore + remove `a.txt` (X-M1), refuse-to-start guard for H2 in prod (B-H9).
2. **Contract safety.** CI cross-check that the sync contract is in sync across all three tiers (X-H5), runtime schema validation at the boundary (X-H6), clock-skew bound on stale detection (B-H4).
3. **Monotonic timers.** Web `performance.now()` (W-H6), iOS `ContinuousClock` + `DispatchSourceTimer` (I-H1). Fixes correctness visibly.
4. **Break up the three monster files.** `TimerContext.tsx` (W-H1), `useTimerSyncEffects.ts` (W-H2), `ShellViewModel.swift` (I-H5). This is weeks of work but it buys back velocity every sprint after.
5. **iOS bell reliability follow-through.** Finish the EXECPLAN (I-H3, I-H4, I-H6). This is user-facing.
6. **Backend FK + sync-queue consistency.** Decide: denormalize intentionally with refresh (B-H3) or restore FKs (B-H2). Preserve pending deletes in web dedup (W-M7). Add idempotency keys (B-H5).

---

## What I Did Not Verify

- Whether CI actually runs iOS builds (file inspection only; didn't read `.github/workflows/` contents in detail).
- Whether `server.address=127.0.0.1` is set in the runtime config (X-H4 depends on this).
- Whether `spring.jpa.open-in-view` is disabled (B-M16).
- The exact UI test coverage in `MeditationNativeUITests`.
- Whether `scripts/generate-sync-contract.mjs` outputs to the Java file too, or only TS.

These are worth a second pass, but they don't change the severity of anything in the list.

---

*End of report.*
