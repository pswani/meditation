# Pending Work Inventory

Date: 2026-04-01

## Scope and source docs
- Reviewed: `AGENTS.md`, `README.md`, `PLANS.md`, `requirements/intent.md`, `docs/product-requirements.md`, `docs/architecture.md`, `docs/ux-spec.md`, `docs/screen-inventory.md`, `requirements/roadmap.md`, `requirements/decisions.md`, `requirements/session-handoff.md`.
- Also synthesized unfinished work from material review and planning artifacts, especially:
  - `docs/review-intent-compliance-full-app.md`
  - `docs/review-usability-full-app.md`
  - `docs/review-release-hardening.md`
  - `docs/review-foundation-fullstack.md`
  - `docs/review-custom-plays.md`
  - `docs/review-performance.md`
  - `docs/ux-review-full-app.md`
  - `requirements/execplan-milestone-e-release-readiness.md`
  - `requirements/execplan-milestone-e-e2e-verification.md`
  - `requirements/execplan-milestone-e-hardening-remediation.md`
  - `requirements/execplan-milestone-e-accessibility-responsive-polish.md`

## Current-state summary
- The repository is no longer a prototype shell. It already has a working timer flow, session logging, summaries, sankalpa progress, playlist CRUD, custom-play CRUD, responsive navigation, backend REST integration, H2-backed persistence, offline queue foundations, and broad automated test coverage.
- The strongest remaining product-scope gap is that `custom play` still behaves like a saved timer preset with linked media metadata, not a true pre-recorded meditation-session runtime.
- The strongest remaining operational gap is that the documented managed local stack is not currently trustworthy on the default persisted H2 path because `npm run start:app` fails Flyway validation against the checked-in local DB state.
- The main remaining scope-completion work after that is finishing the intended low-friction launch paths and playlist behavior, then tightening trust, architecture, release verification, and documentation accuracy.

## Prioritized backlog

### Must complete for core product correctness

#### 1. Restore trustworthy default local startup and persistence compatibility
- Why it matters: the app cannot currently be started through the documented managed local flow on the default persisted H2 path, which blocks reliable verification and undermines trust in the repository as a usable full-stack product.
- Affected areas:
  - managed startup scripts and local verification flow
  - backend Flyway/H2 startup path
  - local development data compatibility or repair/reset guidance
  - README and handoff docs
- Dependency notes:
  - no product-feature dependency
  - should happen before more feature work so later slices can verify against a trustworthy default stack
- Suggested slice size: medium
- Partial implementation status:
  - the backend boots successfully on a clean isolated H2 database
  - the failure is specific to the default persisted local DB state
  - what remains is reconciling the missing migration-history problem and making the default documented startup path succeed or fail with an explicit repo-owned recovery path

#### 2. Turn `custom play` into a real pre-recorded meditation-session flow
- Why it matters: this is the largest gap against `requirements/intent.md` and the clearest mismatch between current behavior and the intended meaning of `custom play`.
- Affected areas:
  - custom-play UI actions and copy
  - active-session runtime and media playback flow
  - session logging, summary, and sankalpa integration
  - backend/media API contract only where needed
  - responsive behavior for Practice and Home shortcuts
- Dependency notes:
  - benefits from the startup fix first so the slice can be verified end to end against the normal stack
  - should define the reusable launch model before Home last-used shortcuts and any richer playlist work
- Suggested slice size: large
- Partial implementation status:
  - create/edit/delete/favorite flows already exist
  - linked media metadata already exists
  - Home and Practice can already apply a custom play into timer setup
  - what remains is a primary run flow, actual linked-session playback behavior, correct active-session UX, and trustworthy complete/end-early logging

#### 3. Complete playlist behavior to match the intended sequencing scope
- Why it matters: playlists are part of the intended product scope, but the current runtime still stops short of the documented behavior by omitting optional item gaps and keeping the run model narrower than the product docs imply.
- Affected areas:
  - playlist editor and validation
  - playlist runtime flow and logging
  - backend/frontend playlist contract
  - Home and Practice launch surfaces if playlist behavior changes materially
- Dependency notes:
  - should follow the custom-play runtime decision so playlist sequencing is built on the final meditation-unit model instead of another temporary assumption
- Suggested slice size: large
- Partial implementation status:
  - playlist CRUD, reordering, favorites, total-duration derivation, sequential timer-item runs, and per-item logging already exist
  - backend schema already has `small_gap_seconds`
  - what remains is UI/runtime support for optional small gaps and a final product-level decision and implementation for whether playlists remain timer-segment sequences or can sequence richer meditation units

#### 4. Add the missing Home `start last used meditation` path
- Why it matters: Home is supposed to be the fastest path into practice, and one of its documented entry points is still missing.
- Affected areas:
  - Home shortcuts and labels
  - launch-context persistence
  - timer/custom-play/playlist start flows
  - tests for low-friction launch behavior
- Dependency notes:
  - best done after the custom-play runtime is settled so “last used meditation” can refer to the final set of supported launchable sessions
  - can happen before or after playlist completion depending on whether playlists are included in the first version of this shortcut
- Suggested slice size: small to medium
- Partial implementation status:
  - Home already supports quick start from defaults, favorite custom plays, favorite playlists, today’s progress, and sankalpa snapshot
  - what remains is persisting last-used meditation context and exposing it as a distinct trustworthy Home action

### Should complete for product quality and trustworthiness

#### 5. Finish sankalpa management beyond create/list progress
- Why it matters: sankalpa creation and progress are present, but the feature still lacks the basic lifecycle controls expected for a trustworthy long-running goal system.
- Affected areas:
  - Sankalpa page management flows
  - sankalpa persistence and API contracts
  - Home snapshot behavior for archived or edited goals
  - tests around edits, archival, and filtering
- Dependency notes:
  - independent of custom-play and playlist work
  - should land before any “v1 complete” claim because README already calls this out as a remaining gap
- Suggested slice size: medium
- Partial implementation status:
  - create/list/progress, filtering, and Home snapshot behavior already work
  - what remains is edit/archive and any bounded delete/deactivation behavior the product wants to support

#### 6. Replace the seeded media catalog stopgap with a user-manageable media workflow
- Why it matters: the app can reference local media files today, but serious custom-play usage still depends on repo conventions and seeded metadata instead of a clean user-facing management flow.
- Affected areas:
  - media catalog UX
  - backend media metadata and file-path handling
  - local setup docs
  - validation and fallback behavior when media files are missing
- Dependency notes:
  - should follow the custom-play runtime slice so media management is built for the actual runtime behavior instead of only metadata selection
- Suggested slice size: medium to large
- Partial implementation status:
  - backend-served media metadata, directory conventions, and custom-play media references already exist
  - what remains is import/upload or another explicit user-managed registration flow plus calmer non-technical UX around media presence and failure states

#### 7. Reduce `TimerContext` into cleaner runtime and sync boundaries
- Why it matters: the current provider still carries too many cross-domain responsibilities, which raises regression risk and makes future correctness work harder than it should be.
- Affected areas:
  - `src/features/timer/TimerContext.tsx`
  - timer settings hydration and sync
  - session-log sync
  - custom-play and playlist sync
  - active timer and playlist runtime orchestration
- Dependency notes:
  - should follow the biggest remaining product-flow decisions so the extraction targets the settled behavior rather than temporary seams
  - pairs naturally with performance cleanup and test hardening
- Suggested slice size: medium
- Partial implementation status:
  - the current architecture is functional and some helper extraction already exists
  - what remains is moving discrete runtime and persistence concerns into focused hooks/services while keeping the public behavior stable

#### 8. Add maintained browser-level full-stack verification and release checks
- Why it matters: unit and integration coverage is good, but there is still no checked-in smoke path that proves the real browser, real frontend, and real backend work together on the main user journeys.
- Affected areas:
  - Playwright or equivalent local smoke coverage
  - managed app start/status commands
  - release-readiness docs
  - local full-stack verification flow
- Dependency notes:
  - depends on the startup reliability fix first
  - should cover the core completed journeys after the next feature slices land
- Suggested slice size: medium
- Partial implementation status:
  - the repository already has strong Vitest coverage and prior manual full-stack verification notes
  - what remains is a maintained browser-level smoke suite or scripted verification path for timer, custom play, playlist, history, and sankalpa happy paths

#### 9. Tighten degraded-state, timezone, and backend-surface trust behavior
- Why it matters: the app already handles offline and stale-write cases, but a few remaining trust issues can still make degraded or cross-timezone behavior feel inconsistent or more successful than it really is.
- Affected areas:
  - sankalpa fallback/save messaging
  - summary and sankalpa time-of-day bucketing
  - health/debug surfaces and local-only backend affordances
  - CORS/LAN/setup accuracy where still applicable
- Dependency notes:
  - partly independent
  - best done after the startup baseline is repaired so the backend/default environment is easy to verify
- Suggested slice size: medium
- Partial implementation status:
  - stale-write protection, offline queueing, and local-first fallback behavior already exist
  - what remains is cleaning up misleading success states, ensuring backend/browser time-bucket consistency, and confirming development-only operational surfaces stay appropriate and accurately documented

#### 10. Bring product and architecture docs back into fully truthful alignment
- Why it matters: a few docs still describe older architecture assumptions or claim functionality the app does not yet support, which makes planning and onboarding harder than necessary.
- Affected areas:
  - `requirements/roadmap.md`
  - `docs/screen-inventory.md`
  - README sections that still describe unresolved gaps unclearly
  - future handoff and planning docs
- Dependency notes:
  - some updates should happen alongside the feature slices they describe
  - the broader cleanup should happen before calling the product clean and trustworthy
- Suggested slice size: small to medium
- Partial implementation status:
  - README and architecture docs are mostly current
  - what remains is removing front-end-only language, aligning screen descriptions with current UI, and keeping remaining-gap statements precise

### Optional polish

#### 11. Refine Practice/Home/History composition for calmer navigation
- Why it matters: the app works, but the information architecture can still feel busier than the intended calm, fast-start experience.
- Affected areas:
  - Home quick-start composition
  - Practice page density and tool disclosure
  - History primary/secondary action ordering
  - shell-level active-session affordances
- Dependency notes:
  - best after the remaining launch flows are complete so the IA reflects final behavior
- Suggested slice size: medium
- Partial implementation status:
  - responsive shell and major screens are already present and usable
  - what remains is calmer prioritization, especially around long Practice surfaces and cross-screen session continuity

#### 12. Improve dialog accessibility and narrow-screen action density
- Why it matters: current confirmation sheets and list-row actions are usable, but they still have rough edges that are noticeable on phones and with keyboard/screen-reader interaction.
- Affected areas:
  - custom-play and playlist manager dialogs
  - narrow-screen row actions
  - focus handling and escape behavior
  - responsive component polish
- Dependency notes:
  - independent of core correctness
  - good candidate after the remaining product-scope flows stop moving
- Suggested slice size: small to medium
- Partial implementation status:
  - form accessibility and responsive layouts improved in recent slices
  - what remains is tightening modal behavior and reducing action clutter on smaller screens

#### 13. Add calmer feedback copy and supporting micro-UX cues
- Why it matters: the app would feel more polished and trustworthy with slightly better copy around relative times, save states, and ended-early details.
- Affected areas:
  - Home and History wording
  - sankalpa helper copy
  - settings and save confirmation treatment
  - timer completion and end-early messaging
- Dependency notes:
  - best after the final feature behavior is stable
- Suggested slice size: small
- Partial implementation status:
  - core flows already communicate enough to be usable
  - what remains is tone, clarity, and a few missing helper details such as relative-time context

#### 14. Optimize runtime persistence and derived-summary performance
- Why it matters: current performance is acceptable for prototype-scale data, but the active timer still writes frequently and summary derivations will become costlier as real history grows.
- Affected areas:
  - active timer persistence cadence
  - playlist/timer tick effects
  - summary and sankalpa derivation utilities
  - `TimerContext` render fan-out
- Dependency notes:
  - should follow the `TimerContext` boundary cleanup so optimization targets stable seams
- Suggested slice size: medium
- Partial implementation status:
  - the app already performs well enough for current development use
  - what remains is reducing unnecessary writes and rerenders for larger long-term datasets

#### 15. Clean up long-lived review artifacts and repository hygiene debt
- Why it matters: the repository now has a large amount of historical planning and review material, which is useful but increasingly noisy without a clearer archive/index strategy.
- Affected areas:
  - docs organization
  - historical review and ExecPlan discoverability
  - stray scaffolding or duplicate config cleanup
- Dependency notes:
  - best after the higher-priority product work is settled
- Suggested slice size: small
- Partial implementation status:
  - the historical documents are still useful and should not be deleted casually
  - what remains is indexing, archiving, or reorganizing them so the core product docs stay easy to navigate

## Best next vertical slices

### 1. Restore the default local full-stack startup baseline
- Why first: every remaining slice will be easier to verify and safer to trust if the documented managed stack starts cleanly on the normal local path.
- Included outcome:
  - fix the default H2/Flyway startup breakage or provide a repo-owned repair/reset path
  - verify the managed start/status flow, backend health, frontend reachability, and one representative persisted flow
  - update the docs that describe how local verification should work

### 2. Implement end-to-end custom-play runtime
- Why second: this is the biggest remaining product-scope gap and unlocks cleaner launch continuity work afterward.
- Included outcome:
  - add a real `Run Custom Play` path
  - make linked media sessions actually drive the meditation runtime
  - ensure complete/end-early logging flows through History, Summary, and Sankalpa

### 3. Finish launch continuity and playlist sequencing
- Why third: once custom plays are real runtime units, the app can finalize its low-friction launch model and complete the remaining playlist behavior without building on temporary assumptions.
- Included outcome:
  - add `start last used meditation`
  - finish optional playlist small-gap behavior
  - align playlist runtime/logging with the final supported meditation-unit model

## Exact next prompt
`Read AGENTS.md, PLANS.md, README.md, docs/architecture.md, docs/review-intent-compliance-full-app.md, docs/pending-work-inventory.md, requirements/roadmap.md, requirements/decisions.md, and requirements/session-handoff.md. Then create an ExecPlan and implement a bounded startup-reliability slice that restores the documented managed local app flow on the default H2 path. Include: diagnosing and fixing the Flyway/default-database compatibility problem behind npm run start:app; if legacy local data needs repair, adding a safe repo-owned repair or reset path with explicit documentation instead of relying on an ad hoc clean-database workaround; verifying npm run start:app and npm run status:app, backend health, frontend reachability, and at least one representative persisted API flow on the repaired default stack; focused tests or verification improvements where practical; and doc updates in README.md, requirements/roadmap.md if needed, requirements/decisions.md, and requirements/session-handoff.md. Exclude unrelated product-feature work. Run npm run typecheck, npm run lint, npm run test, npm run build, plus relevant backend verification, and commit with a clear message such as fix(dev): restore default local app startup reliability.` 
