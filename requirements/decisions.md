# Decisions

## Decision log

### Initial decisions
- Use React + TypeScript + Vite for the front-end.
- Keep V1 local-first.
- Avoid unnecessary dependencies.
- Use responsive navigation with mobile-first bottom tabs and breakpoint-aware adaptation.
- Prioritize timer correctness and logging trustworthiness.
- Include playlists and manual logging in V1.
- Avoid community and AI features in V1.

### 2026-03-23 app shell decisions
- Keep the goals route path as `/goals` for compatibility, but use the user-facing label `Sankalpa` in navigation.
- Implement route-level placeholder screens in `src/pages` to align with architecture guidance.
- Use a shared route metadata module to keep desktop and mobile navigation labels consistent.
- Keep the shell calm and minimal with a mobile bottom navigation and tablet/desktop sidebar layout.

### 2026-03-23 timer-history vertical slice decisions
- Keep the timer vertical slice local-only and persist last-used timer settings and session logs in localStorage.
- Use fixed mock sound selectors for start/end/interval behavior in this slice, without implementing audio playback.
- Model active timing in seconds and use end-time-based recalculation to preserve pause/resume correctness.
- Auto-create a session log for both `completed` and `ended early` outcomes with source set to `auto log`.
- Keep primary navigation unchanged and add route-level active timer at `/practice/active`.

### 2026-03-23 timer-history UX refinement decisions
- Require explicit confirmation before finalizing `ended early` to reduce accidental session interruption.
- Group optional timer controls under a collapsed `Advanced` section to keep setup focused and calm.
- Add explicit interval sound selection when interval bell is enabled, while keeping sound options mocked.
- Use progressive validation display on setup fields to reduce first-load error noise.
- Improve `history` readability on larger screens with timestamp emphasis and multi-column metadata layout.

### 2026-03-23 custom-plays manual-log vertical slice decisions
- Add a dedicated `custom play` model with local-only persistence and support create/edit/delete/favorite in the Practice screen.
- Keep `custom play` controls embedded within the existing Practice route-level screen to avoid navigation sprawl for this slice.
- Extend `session log` source typing to include both `auto log` and `manual log`.
- Add a bounded manual log form in `history` with required fields:
  - duration
  - meditation type
  - session timestamp
- Model manual entries as completed local logs with derived start/end timestamps and include them in the same unified history list.
- Use explicit source/status pills in `history` to clearly distinguish `manual log` vs `auto log` and `completed` vs `ended early`.

### 2026-03-23 custom-plays manual-log UX refinement decisions
- Implement explicit delete confirmation for `custom play` entries instead of silent immediate deletion.
- Add a primary `Use Custom Play` action that prefills timer setup duration and meditation type while preserving other timer options.
- Clarify duplicate field copy by renaming custom play fields to:
  - `Custom play meditation type`
  - `Custom play duration (minutes)`
- Add explicit post-save confirmation for manual log creation with inline success status.
- Add helper guidance for `session timestamp` to clarify local-time intent.
- Refine list row structure for `custom play` and `history` items to improve tablet/desktop scanability without introducing dense table UI.

### 2026-03-23 playlists vertical slice decisions
- Introduce route-level playlist screens at:
  - `/practice/playlists`
  - `/practice/playlists/active`
- Keep playlists local-only with persistence in localStorage.
- Define playlist logging at per-item granularity:
  - each reached playlist item creates an `auto log` session log entry
  - completed items log with status `completed`
  - ending early logs the active item with status `ended early` and actual completed duration
  - unstarted future items do not log
- Store playlist metadata on session logs (`playlistName`, item position/count) to improve history context.
- Keep timer session and playlist run mutually exclusive to avoid overlapping active flows.

### 2026-03-23 playlists UX refinement decisions
- Enforce run safety by blocking playlist-run start while another playlist run is active; do not silently replace active run state.
- Return structured run-start outcomes with explicit block reasons so UI can show clear guidance (`timer session active`, `playlist run active`, etc.).
- Prevent deletion of the currently active playlist by guarding both context behavior and UI affordances.
- Add run-level playlist metadata (`playlistRunId`, `playlistRunStartedAt`) to playlist-generated auto logs for clearer history interpretation.
- Surface lightweight run-context lines in `history` using run metadata to reduce cognitive fragmentation of per-item playlist logs.
- Reduce phone control density in playlist item ordering by switching move/remove actions to compact touch-friendly controls.
- Add explicit `Up next` context on the active playlist run screen to improve flow predictability.

### 2026-03-23 summaries and sankalpa vertical slice decisions
- Implement summaries and sankalpa on the existing route-level `Sankalpa` screen (`/goals`) to keep navigation calm and bounded.
- Derive summaries from the full local `session log` set (not just `recent` entries):
  - overall summary
  - by meditation type summary
- Add a dedicated local `sankalpa` model with localStorage persistence.
- Support two sankalpa goal types:
  - `duration-based`
  - `session-count-based`
- Apply optional sankalpa filters:
  - meditation type
  - time-of-day bucket
- Define progress counting rules explicitly:
  - both `auto log` and `manual log` entries count
  - duration-based goals sum `completedDurationSeconds` (including partial ended-early logs)
  - session-count goals count matching `session log` entries
  - matching is constrained to the goal window (`createdAt` through `createdAt + days`)

### 2026-03-24 local setup verification decisions
- Keep setup verification scoped to operational readiness only:
  - install
  - typecheck
  - lint
  - test
  - build
  - local dev startup
- Treat generated build/dev artifacts (`dist`, vite cache, tsbuildinfo) as non-functional output and exclude them from setup commits unless explicitly requested.
- Document the observed local dev URL (`http://localhost:5173/`) as a typical startup target, while preserving that Vite may choose a different port when needed.

### 2026-03-24 home and settings functional slice decisions
- Implement `Home` and `Settings` as route-level functional screens within the existing app shell, without adding new feature areas.
- Define Home “today” summary from local `session log` data using local-date boundaries and include:
  - session log count
  - completed vs ended-early count
  - total completed duration
- Keep Home quick-start behavior explicit:
  - resume active timer if present
  - otherwise attempt timer quick start
  - if quick start cannot run, route to Practice with guidance
- Surface favorite shortcuts only for currently supported state:
  - favorite custom play shortcut loads timer defaults and opens Practice
  - favorite playlist shortcut attempts run with existing run-block safeguards
- Use explicit `Save Defaults` and `Reset To App Defaults` behavior in Settings for predictable preference control.
- Persist Settings through existing timer settings state pipeline (local-first storage), with validation aligned to timer rules.

### 2026-03-24 home/settings UX refinement decisions
- Pass Home quick-start validation failures to Practice through route state and render an entry status banner in timer setup, then clear route state after first display.
- Add a lightweight Home `sankalpa` snapshot using locally stored goals and derived progress, selecting the top active item by nearest deadline.
- Remove Home `Next Actions` buttons that duplicated shell navigation to reduce visual noise and keep Home focused on meaningful launch content.
- Add explicit Settings unsaved-edits affordance and disable `Save Defaults` until the draft differs from persisted defaults.
- Improve favorite shortcut row behavior on narrow phones by allowing long-label wrapping and stacking the action button when space is constrained.
- Strengthen UX coverage with focused tests for:
  - Home empty/populated states
  - Home quick-start failure handoff to Practice
  - Practice route-state status banner dismissal
  - Settings dirty-state + persistence behavior

### 2026-03-24 full-app UX phase-1 remediation decisions
- Add a global shell-level active-state banner in the top bar when a timer session or playlist run is active, with one-tap resume actions:
  - `Resume Active Timer`
  - `Resume Playlist Run`
- Keep Practice as the single setup route for this slice, but reduce cognitive load by collapsing management-heavy controls (`custom play`, playlists) behind a secondary `Practice Tools` disclosure by default.
- Reorder History information hierarchy so recent `session log` content is first, and move `manual log` into a secondary collapsible section (`Add Manual Log`) that opens by default only when there are no logs.
- Improve trust in short-session feedback by showing precise `mm:ss` completion duration text using `formatRemainingTime` in completion/last-outcome messaging.
- Improve test reliability in touched routes by enforcing cleanup/localStorage reset patterns where multi-render leakage caused ambiguous UI queries.

### 2026-03-24 QA build/test baseline decisions
- Keep this baseline slice strictly operational:
  - install
  - typecheck
  - lint
  - test
  - build
  - local dev startup guidance
- Strengthen test reliability at shared setup level by applying:
  - `localStorage.clear()` before every test
  - React Testing Library `cleanup()` after every test
- Clarify README setup expectations explicitly:
  - this workspace is currently front-end only
  - back-end setup instructions are deferred until a back-end service is introduced

### 2026-03-24 milestone-a targeted QA hardening decisions
- Keep Milestone A QA improvements focused on load-bearing correctness areas only:
  - timer validation
  - active-session transitions
  - session-log creation constraints
  - Home and Settings integration flow continuity
  - critical route redirects and rendering behavior
- Treat local storage persistence contracts as the current integration boundary for this workspace until backend REST services are introduced.
- Prefer deterministic reducer/helper coverage for time-sensitive timer behavior, with route-level tests limited to user-visible navigation and persistence outcomes.
- Reduce route-test fragility by favoring accessible role/name selectors over brittle exact-label assumptions when equivalent user intent is being validated.

### 2026-03-24 manual logging review remediation decisions
- Treat manual log `session timestamp` as the time the session ended, and derive `startedAt` by subtracting duration.
- Harden manual log timestamp validation to reject malformed datetime values before entry construction.
- Sort session logs by `endedAt` recency in shared reducer insertion flow so mixed `manual log` and `auto log` entries preserve true `Recent Session Logs` ordering.
- Keep this remediation bounded to manual logging and minimum supporting history behavior; do not expand scope to unrelated custom play or playlist UX changes.

### 2026-03-24 manual logging review remediation pass-2 decisions
- Reject future-dated manual log timestamps during validation to protect summary/sankalpa trustworthiness.
- Strengthen session-log persistence boundary by validating loaded entry shape and enum values (`status`, `source`) before admitting items to runtime state.
- Preserve valid stored session logs while dropping malformed entries, instead of failing the entire load when a subset is invalid.

### 2026-03-24 custom plays implementation pass-2 decisions
- Extend `custom play` model to include optional preset sounds (`startSound`, `endSound`) so `Use Custom Play` can apply a fuller setup profile.
- Introduce a local media/session metadata catalog and API-boundary utility with an explicit list endpoint contract (`/api/media/custom-plays`) for future backend compatibility.
- Store media/session path references and metadata identifiers directly on `custom play` entries in local persistence, while backend/database implementation remains out of scope in this front-end-only workspace.
- Normalize legacy stored custom-play entries with safe defaults to preserve backward compatibility during model expansion.

### 2026-03-24 custom plays review remediation pass-3 decisions
- Tighten custom-play load normalization to enforce core domain validity:
  - `meditationType` must match supported meditation types
  - `durationMinutes` must be greater than `0`
  - invalid entries are dropped during load
- Improve media-model UX clarity by prioritizing human-readable metadata (label, duration, type) and keeping filesystem path as secondary managed detail.
- Add explicit inline success feedback for custom-play create/update actions to reduce save-state ambiguity.

### 2026-03-24 playlists implementation pass-3 decisions
- Keep the existing playlist UX/rules/logging flow intact and layer persistence integration through an explicit REST-style API boundary utility:
  - collection endpoint: `/api/playlists`
  - detail endpoint: `/api/playlists/:id`
- Route playlist persistence writes from timer context through the playlist API boundary while preserving local-first behavior in this front-end-only workspace.
- Tighten playlist load normalization at storage boundaries:
  - require valid playlist/item shape
  - enforce supported `meditation type`
  - enforce `durationMinutes > 0`
  - drop malformed playlist records instead of admitting invalid runtime state.

### 2026-03-24 practice composition review remediation decisions
- Persist active runtime flows for interruption resilience:
  - active timer session + pause state
  - active playlist run + pause state
- Rehydrate persisted active runtime flows on app load with safe guards:
  - recover only valid snapshots
  - clear stale/unrecoverable snapshots
  - surface a dismissible shell-level recovery status message.
- Make timer-start blocking explicit when a playlist run is active:
  - disable `Start Session`
  - show inline guidance with a `Resume Playlist Run` action.
- Expand `history` usability while preserving calm layout:
  - add lightweight filters (`source`, `status`)
  - show filtered-count context
  - add progressive reveal with `Show More Session Logs`.
- Strengthen `session log` load integrity checks at storage boundary:
  - require supported `meditation type`
  - require parseable and ordered timestamps
  - require non-negative and coherent duration values
  - require coherent optional playlist metadata when present.

### 2026-03-24 practice composition testing hardening decisions
- Keep this slice QA-only and avoid product-behavior changes while increasing coverage for Milestone B load-bearing rules.
- Strengthen manual-log coverage with boundary semantics:
  - allow `session timestamp` exactly equal to `now`
  - assert invalid timestamp rejection during manual log construction
- Strengthen manual-vs-auto differentiation confidence at route-level history rendering/filter behavior.
- Extend playlist rule coverage for less-traveled branches:
  - `playlist not found`
  - `playlist has no items`
  - delete-allowed path when no active run.
- Extend playlist logging helper coverage for negative-duration clamp behavior (`0` floor).
- Extend playlist REST-boundary tests to verify list-path normalization behavior against mixed valid/malformed stored payloads.
- Improve touched custom-play UI test reliability with explicit `localStorage` and DOM cleanup between tests.

### 2026-03-24 summaries milestone-c implementation decisions
- Keep summaries on the existing `Sankalpa` route (`/goals`) and expand insight depth without introducing new navigation.
- Add bounded date-range summary controls with calm defaults:
  - `All time`
  - `Last 7 days`
  - `Last 30 days`
  - `Custom range`
- Define date-range filtering against `session log` `endedAt` timestamps with inclusive day boundaries.
- Derive summary sections from one shared filtered dataset to preserve consistency between:
  - overall summary
  - by meditation type summary
  - by source summary
- Keep summary source segmentation aligned to existing domain values and ordering:
  - `auto log`
  - `manual log`
- Keep this slice local-first; do not add backend summary fetching in this front-end-only workspace.

### 2026-03-24 summaries review-remediation decisions
- Fix trust-critical custom-range behavior by treating invalid custom input as `no valid summary window`:
  - show correction guidance
  - do not render summary metric sections until range is valid
- Extend summaries to include required `by time of day` insight using existing shared bucket semantics:
  - `morning`
  - `afternoon`
  - `evening`
  - `night`
- Improve by-source comprehension with explicit in-row metric labels:
  - `completed`
  - `ended early`
- Keep remediation scope bounded to critical/important summary-review findings only; defer nice-to-have items.

### 2026-03-25 prototype cleanup pass-1 decisions
- Remove dead placeholder-era scaffolding that no longer serves the app:
  - unused `.placeholder-list` styling
  - stale active prompt guidance that still tells contributors to add placeholder screens
- Keep the fixed custom-play media catalog, but treat it explicitly as intentional sample/reference data behind the existing media API seam.
- Simplify `custom play` persistence to store only `mediaAssetId` as the link to sample media metadata.
- Derive linked-media display details from the current media catalog at render time instead of persisting denormalized label/path fields in product records.
- Remove technical media implementation details from the custom-play UX:
  - no managed path display
  - no MIME-type display
- Preserve backward compatibility for existing local storage by accepting legacy custom-play records that still contain label/path fields and normalizing them into the slimmer runtime shape.

### 2026-03-25 app-level scripting decisions
- Keep this slice truthful to the current repository:
  - the repo remains front-end only
  - no in-repo backend, H2 service, or deployment server was invented for scripting convenience
- Add app-level helper scripts for the current workspace and paired-backend workflows:
  - `dev:frontend`
  - `dev:backend`
  - `dev:all`
  - `build:app`
  - `preview:app`
  - `db:h2:reset`
  - `media:setup`
- Treat backend and H2 scripting as external-backend adapters configured through environment variables rather than in-repo implementation details.
- Default media-root setup to `public/media/custom-plays` and H2 reset to ignored local files under `local-data/h2`.
- Prefer shell helper scripts and `package.json` wiring over Docker in this slice because local development and front-end truthfulness were the higher-priority goals.

### 2026-03-25 full-stack gap assessment decisions
- Confirm the current repo state explicitly:
  - no backend module
  - no Spring Boot application
  - no H2 datasource or schema
  - no live REST persistence
  - current API layers for playlists and sankalpas still persist through `localStorage`
  - current media API layer still serves a fixed in-memory sample catalog
- Choose one Java/Spring Boot backend application as the first full-stack target instead of splitting the platform into multiple backend services.
- Keep H2 as the initial database for local development and early deployment simplicity.
- Keep media files on disk under a configured root and store relative file paths plus metadata in the database.
- Migrate the front end to the backend through the existing API-boundary utilities incrementally, starting with backend foundation and persistence before broader feature rewrites.

### 2026-03-24 sankalpa milestone-c implementation decisions
- Keep sankalpa persistence local-first but route through an explicit REST-style API boundary utility for backend readiness:
  - collection endpoint: `/api/sankalpas`
  - detail endpoint: `/api/sankalpas/:id`
- Harden sankalpa storage load boundaries by validating persisted records before admission:
  - valid goal type
  - valid positive target value
  - integer `days > 0`
  - valid optional `meditation type`
  - valid optional `time-of-day` bucket
  - parseable `createdAt`
- Tighten sankalpa draft validation for clearer goal semantics:
  - `session-count-based` targets must be whole numbers
  - `days` must be a whole number
- Clarify sankalpa progress counting rules in UI copy:
  - both `auto log` and `manual log` entries count
  - ended-early duration contributes to duration-based goals
  - matching is constrained by optional filters and goal window boundaries.

### 2026-03-24 discipline-and-insight remediation decisions
- Render exact zero durations as `0 min` and reserve `\< 1 min` for strictly positive sub-minute values to protect summary trust.
- Reduce summary density on `/goals` by hiding inactive categories by default in:
  - by meditation type
  - by time of day
  and exposing a lightweight `Show inactive categories` toggle.
- Replace ambiguous overall split shorthand (`X / Y`) with explicit labels:
  - `completed`
  - `ended early`
- Improve medium-breakpoint summary readability by making row metric columns more flexible and using compact metric pills in by-source rows.
- Keep this remediation bounded to critical and important review findings; defer nice-to-have items.

### 2026-03-24 discipline-and-insight testing hardening decisions
- Keep this slice QA-only and avoid product behavior changes; strengthen Milestone C confidence through targeted utility/API tests.
- Add explicit summary edge coverage for:
  - inclusive same-day range boundaries
  - by-type counts constrained by date-range filtering
  - malformed `endedAt` exclusion in snapshot derivation.
- Add explicit sankalpa edge coverage for:
  - time-of-day bucket boundaries used by optional filters
  - status precedence that keeps `completed` goals completed after deadline.
- Add explicit sankalpa API-boundary coverage for malformed persisted payload handling (`invalid JSON`, `non-array payload`).

### 2026-03-24 milestone-d production-readiness testing hardening decisions
- Keep this slice QA-only and focus on cross-app continuity/risk surfaces rather than broad test-count growth.
- Prefer route-level integration coverage for persisted recovery behavior so tests exercise storage normalization, provider hydration, shell messaging, and navigation together.
- Use fixed system time in new recovery and playlist-run tests to make time-sensitive assertions deterministic and less flaky.
- Strengthen production-readiness confidence in playlist behavior through targeted tests for:
  - timer-blocked playlist starts
  - persisted active playlist continuation
  - ended-early playlist logging and history continuity

### 2026-03-24 milestone-d accessibility and responsive polish decisions
- Add a shell-level `Skip to content` affordance and focus target on the main content region to reduce repeated keyboard navigation cost.
- Keep disclosure interactions lightweight but explicit by wiring existing toggle buttons with `aria-expanded` and `aria-controls` rather than replacing them with heavier components.
- Use one shared focus-visible treatment across links, buttons, inputs, selects, summaries, and tabbable containers to improve accessibility without breaking the calm visual language.
- Improve small-screen readability/touch comfort through:
  - slightly larger bottom spacing above mobile navigation
  - full-width primary action stacking in narrow timer action groups
  - reduced wrapping friction in panel headers and tool rows
- Improve tablet/desktop balance with modest spacing adjustments and a more intentional Home two-column split instead of a fully even grid.

### 2026-03-24 milestone-d performance cleanup decisions
- Focus this slice on obvious startup and persistence inefficiencies instead of speculative render memoization.
- Consolidate timer provider bootstrapping so persisted timer data is loaded once and reused across hydration/state initialization.
- Skip first-render persistence writes for unchanged local-first data sets:
  - timer settings
  - session logs
  - custom plays
  - playlists
  - sankalpas
- Preserve first-render persistence for active runtime recovery only when hydration changed the stored snapshot (for example, corrected remaining time or clearing stale active state).
- Broaden storage save helpers to accept `readonly` arrays so unchanged data can be persisted without unnecessary array copying at call sites.

### 2026-03-24 milestone-d release readiness decisions
- Keep the final Milestone D pass documentation-first:
  - verify setup/run/build/test guidance
  - verify quality commands
  - inventory remaining product gaps
  - avoid behavior changes during handoff
- Treat the current front-end-only, local-first architecture as the repository baseline for handoff rather than a defect to "fix" in this slice.
- Call out only concrete remaining v1 product gaps that are visible from the current requirements and implementation audit:
  - actual sound playback is still unimplemented
  - optional playlist item gaps are still unimplemented
  - custom-play media remains backed by a fixed local metadata catalog rather than user-managed import or a real backend media source
- Mark the Milestone D prompt set complete and shift the next recommended work toward bounded release-candidate gap closure instead of more general readiness cleanup.

### 2026-03-25 review remediation pass-1 decisions
- Remove shared `session log` truncation from timer-state updates so History, summary, and sankalpa continue to use the full local log set.
- Keep active timer and active playlist recovery local-first, but persist only recovery-relevant snapshot changes:
  - run start
  - pause / resume
  - item transitions
  - run end
  - corrected first-load recovery snapshots
- Preserve corrected remaining-time persistence on first-load recovery for already-running timer or playlist state, while avoiding repeated writes during normal countdown ticks.
- Route Home sankalpa reads through the existing sankalpa API boundary and replace raw sankalpa goal-type enum text with human-readable labels in UI controls and snapshot content.
- Align repo hygiene with the current workspace by:
  - updating prompt-bundle docs to front-end-only reality
  - updating architecture route docs to match implemented routes
  - removing stale duplicate Vite config artifacts
  - removing unused placeholder-screen scaffolding
- Keep this remediation slice bounded and explicitly defer:
  - actual sound playback
  - optional playlist item gaps
  - dialog accessibility rework
  - larger `TimerContext` decomposition

### 2026-03-25 end-to-end verification pass-1 decisions
- Treat this repository as front-end only for verification purposes:
  - no backend service is present in the workspace
  - no H2 persistence layer is present in the workspace
  - REST-style API utilities remain local-first boundary seams rather than live network integrations
- Prefer high-value App-level integration tests over adding a new e2e framework in this pass, because the biggest remaining confidence gaps are full user journeys across routing, provider state, timing, and local persistence.
- Add explicit end-to-end-style integration coverage for:
  - timer setup -> active session -> pause/resume -> completion -> History auto log
  - playlist run -> item progression -> completion -> History playlist auto logs
- Validate local startup with the documented `npm run dev` path and browser navigation against the running app, while treating loopback-shell connectivity quirks as environment-specific rather than application failures.

### 2026-03-25 README operational rewrite decisions
- Rewrite `README.md` as a repo-truthful operational guide rather than a brief product summary.
- Document the workspace explicitly as front-end only:
  - no backend service in repo
  - no H2 configuration or schema in repo
  - no live REST transport wiring in repo
- Treat the REST-style utilities as current integration seams, not active network clients:
  - `src/utils/playlistApi.ts`
  - `src/utils/sankalpaApi.ts`
  - `src/utils/mediaAssetApi.ts`
- Document browser `localStorage` as the only implemented persistence layer and list the concrete storage keys contributors/operators need to know.
- Document custom-play media paths truthfully:
  - current catalog is fixed source code metadata
  - persisted custom plays store root-relative media paths such as `/media/custom-plays/...`
  - actual files are not checked in
- Recommend `public/media/custom-plays/` as the compatible local static-file directory for any real custom-play media assets because the existing catalog already targets `/media/custom-plays/...`.
- Call out that timer sound options are currently labels only:
  - selectable in UI
  - persisted in settings/logs/custom plays
  - not yet mapped to actual files or playback behavior
- Document deployment for the current repo as static front-end deployment only, with SPA history fallback and no backend/database rollout steps.

### 2026-03-25 LAN / Wi-Fi access decisions
- Configure Vite dev and local preview servers to bind to `0.0.0.0` on stable default ports so the app can be opened from other devices on the same local network:
  - dev: `5173`
  - preview: `4173`
- Keep LAN access changes minimal and front-end focused because no backend service exists in this workspace to bind or reconfigure.
- Add one shared API-base configuration helper so REST-style boundary modules can derive either:
  - same-origin `/api/...` paths by default
  - fully qualified URLs from optional `VITE_API_BASE_URL` when pairing the front end with a separate backend outside this repo
- Preserve the existing local-first persistence model:
  - no live HTTP transport was introduced in this slice
  - `playlist`, `sankalpa`, and `custom play media` boundaries remain local-first seams
- Document backend host-binding and CORS requirements as external integration guidance only:
  - backend should listen on `0.0.0.0` or the machine LAN IP
  - backend must not assume `localhost` when serving requests from phones or other laptops
  - backend CORS must allow the front-end LAN origin if the backend runs on a separate port
- Keep root-relative static asset paths such as `/media/custom-plays/...` unchanged because they already work correctly for LAN access when served by Vite on the developer machine.
