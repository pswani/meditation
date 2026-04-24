# Full-Stack Code Review (DB, API, Web, iOS)

Date: 2026-04-24  
Scope: `backend/`, `src/`, `ios-native/`, architecture and requirements docs  
Reviewer focus:
- design patterns and best practices
- DDD implementation quality
- hexagonal architecture quality
- elegance/maintainability and debt

## Executive summary

This repository is already a functioning vertical slice across web + backend + iOS-native tracks, with meaningful validation and test coverage.  
The primary risks are currently in:

1. **Cross-cutting orchestration concentration** (large coordinator modules/classes)
2. **Contract drift between UI copy and tests** (already causing test failure)
3. **Scalability debt in DB indexing/query shape alignment**
4. **Partial (not strict) DDD/hexagonal separation**
5. **Toolchain/environment friction for native/backend verification**

Auth/authz recommendations are intentionally excluded per current product direction.

---

## Findings and concrete remediation

## High severity

### H-1: Playlist flow contract drift is causing a failing app-level integration test

**Evidence**
- App integration test expects “item 2 of 2”: `src/App.test.tsx` around the playlist journey assertion.
- UI banner renders “item 2/2”: `src/app/ShellStatusBanners.tsx`.

**Risk**
- Breaks CI confidence for a key end-to-end meditation journey (playlist run + logging).
- Indicates copy contract drift that can reoccur across screens/tests.

**Concrete remediation**
1. Decide canonical progress copy format (`item X/Y` or `item X of Y`) and document it in UX conventions.
2. Update all surfaces and tests to one canonical format:
   - shell active banner
   - playlist screen status banner
   - history labels where applicable
   - app/integration tests + page tests
3. Add a shared formatter helper (`formatPlaylistPosition(position, total)`) and use it everywhere to prevent drift.
4. Add one targeted snapshot/contract test around this formatter and one cross-screen smoke test.

**Suggested owner**
- Web feature owner (playlist/runtime + testing)

**Effort**
- Small (0.5–1 day)

---

### H-2: Runtime orchestration concentration is high in both Web and iOS coordinators

**Evidence**
- `src/features/timer/TimerContext.tsx` imports and orchestrates timer runtime, playlist runtime, custom play runtime, storage, sync queue behavior, backend hydration, sound handling, and recovery behavior.
- `ios-native/MeditationNative/App/ShellViewModel.swift` owns many published app states plus persistence/sync/audio/notification/runtime behaviors.

**Risk**
- Large blast radius for changes.
- Harder onboarding and slower safe iteration.
- Increased chance of subtle regressions during frequent product slices.

**Concrete remediation**
1. Split Web `TimerContext` into explicit internal modules:
   - `timer-session-runtime` (start/pause/resume/end, foreground catchup, bells)
   - `custom-play-runtime`
   - `playlist-runtime`
   - `timer-sync-orchestrator` (queue replay + hydration only)
2. Keep `TimerContext` as composition boundary only (wiring + public context value).
3. Split iOS `ShellViewModel` with clear collaborators:
   - `SessionRuntimeCoordinator`
   - `SyncCoordinator`
   - `NotificationCoordinator`
   - `LibraryManagementCoordinator`
4. Introduce maximum-file-size / complexity CI guideline (soft threshold first, e.g., warning above 700 lines for coordinator files).
5. Preserve behavior via characterization tests before refactor.

**Suggested owner**
- Web platform + iOS native owner jointly (parallel tracks)

**Effort**
- Medium (3–6 days split across platforms)

---

## Medium severity

### M-1: DDD is domain-named but still partially mixed with application/infrastructure concerns

**Evidence**
- Architecture docs describe feature-oriented layering and explicit REST boundaries, but not strict domain port boundaries.
- Services like `SankalpaService` and `SessionLogService` combine request parsing/validation, sync reconciliation semantics, and mapping.

**Risk**
- Domain logic portability/testability decreases over time.
- Business rules can become coupled to transport and persistence details.

**Concrete remediation**
1. Introduce explicit “application service” vs “domain policy/calculation” split for high-churn domains:
   - `sankalpa` progression rules
   - `session log` mutation rules
2. Move pure goal/session calculations into dedicated domain policy classes/functions with no Spring dependencies.
3. Keep controller parsing and transport validation thin.
4. Add focused domain unit tests independent of repository/web concerns.

**Suggested owner**
- Backend API/domain owner

**Effort**
- Medium (2–4 days incrementally per domain)

---

### M-2: Hexagonal architecture is partial, not strict (ports/adapters are implicit rather than explicit)

**Evidence**
- Docs and code emphasize feature modules and shared utils/repositories, but not explicit inward-facing domain ports and adapter implementations per use case.

**Risk**
- Long-term swapability (storage/transport/runtime adapters) requires larger refactors.
- Architectural intent may drift under frequent delivery pressure.

**Concrete remediation**
1. Start with one pilot domain (`session log` or `sankalpa`):
   - define inbound port (`UseCase` interface)
   - define outbound ports (repository/time/provider interfaces)
   - implement Spring adapters in infra package
2. Keep route/service APIs stable while introducing the seam.
3. Document the chosen port naming convention and folder layout in `docs/architecture.md`.
4. Use this as template before broader rollout.

**Suggested owner**
- Backend architecture owner

**Effort**
- Medium (2–3 days pilot, then incremental adoption)

---

### M-3: Session-log query patterns and index strategy are misaligned for growth

**Evidence**
- Migration creates primary index on `ended_at`.
- Repository queries frequently filter by `endedAt`, `meditationType`, and `source`, and include paged/summarized access paths.

**Risk**
- As log volume grows, list/summaries can degrade due to broader scans.
- Higher CPU/latency during summary windows and filtered history reads.

**Concrete remediation**
1. Add composite indexes in a new Flyway migration, guided by query paths:
   - `(ended_at desc, created_at desc)` for ordered list reads
   - `(meditation_type_code, ended_at desc)`
   - `(source, ended_at desc)`
   - optional `(meditation_type_code, source, ended_at desc)` depending on explain plans
2. Run explain plans for:
   - filtered list
   - paged list
   - summary aggregates
3. Keep only indexes that measurably improve target queries to avoid write amplification.
4. Add a small perf-check script for representative seeded datasets.

**Suggested owner**
- Backend DB/API owner

**Effort**
- Medium (1–2 days including measurement)

---

### M-4: Large backend services carry multiple responsibilities and are expensive to evolve safely

**Evidence**
- `SankalpaService` and `SessionLogService` include validation, normalization, stale-write handling, mapping, and domain progression.

**Risk**
- Change collisions and harder code review.
- More fragile regression surface despite good tests.

**Concrete remediation**
1. Extract internal collaborators:
   - request validators
   - mutation conflict evaluator
   - response mappers
   - progress calculators
2. Keep service methods orchestration-focused.
3. Add package-level architecture tests (or conventions) that prevent logic leakage back into controllers.

**Suggested owner**
- Backend owner

**Effort**
- Medium (2–5 days, staged)

---

## Low severity

### L-1: Copy inconsistency risk across playlist position strings

**Evidence**
- Different expectations/styles in tests and UI surfaces (`X of Y` vs `X/Y`).

**Risk**
- Recurring low-level test churn and UX inconsistency.

**Concrete remediation**
- Consolidate display formatting behind one shared utility and usage lint/check pattern.

**Owner/Effort**
- Web owner / small

---

### L-2: Native verification is gated by strict Swift toolchain requirement

**Evidence**
- README requires Swift 6.3 for package tests.

**Risk**
- Contributors/CI lanes with 6.2.x cannot run native core tests.

**Concrete remediation**
1. Add a preflight script that checks Swift version and emits exact upgrade instructions.
2. Optionally provide container/devbox profile with pinned toolchain for native tasks.
3. Keep requirement explicit in docs (already good), but make failure mode faster and friendlier.

**Owner/Effort**
- Native owner / small

---

### L-3: Architecture debt is known but not yet tracked as explicit milestones

**Evidence**
- Architecture docs acknowledge oversized modules and decomposition work in progress.

**Risk**
- Technical debt remains “known but unscheduled,” which tends to slip.

**Concrete remediation**
1. Add a dedicated “architecture debt burn-down” section in roadmap with 2–3 concrete milestones.
2. Attach measurable outcomes:
   - reduced file complexity/size
   - reduced cross-module imports
   - stable tests around extracted seams

**Owner/Effort**
- Tech lead / small-to-medium planning

---

## Prioritized remediation plan (90-day pragmatic path)

### Phase 1 (Week 1–2): Stabilize correctness and contracts
- Fix playlist text contract drift and add shared formatter.
- Add regression tests for playlist progress wording in shell + practice + history contexts.
- Add architecture notes defining canonical copy contract and where formatting helper lives.

### Phase 2 (Week 2–5): Backend scalability + service decomposition start
- Add session_log composite indexes with measured explain plans.
- Extract `SessionLog` validation/mapping collaborators.
- Extract `Sankalpa` progression policy layer (pure domain calculations).

### Phase 3 (Week 4–8): Web orchestration decomposition
- Refactor `TimerContext` into runtime/sync modules with unchanged external API.
- Add targeted tests around extracted modules and queue replay behavior.

### Phase 4 (Week 6–10): iOS orchestration decomposition
- Split `ShellViewModel` into coordinators.
- Keep UI behavior identical; add characterization tests around runtime safety prompts, sync state transitions, and playback lifecycle.

### Phase 5 (Week 10–12): Architecture guardrails
- Update `docs/architecture.md` with explicit layering decisions for pilot domain(s).
- Add lightweight complexity guardrail checks to prevent coordinator re-growth.

---

## Debt assessment

- **Current debt level:** Moderate, with a few high-impact hotspots.
- **Trajectory if unmanaged:** likely to become high due to ongoing vertical-slice feature changes in timer/sync/runtime surfaces.
- **Trajectory if remediated per plan:** manageable and compatible with continued product iteration.

---

## Validation commands executed for this review session

- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run test` ❌ (1 failing test in playlist journey copy assertion)
- `npm run build` ✅
- `cd backend && mvn test` ⚠️ (blocked by Maven central 403 in this environment)
- `swift test --package-path ios-native` ⚠️ (environment has Swift 6.2.3; repo requires 6.3)
