# Decisions

## Decision log

### 2026-03-27 milestone-e merge decisions
- Merge `codex/milestone-e-hardening-release` back into `codex/functioning` with a normal local merge commit so the review, remediation, accessibility, end-to-end verification, and release-readiness history remain intact.
- Mark Milestone E complete on `codex/functioning` after the merge because:
  - the hardening findings were addressed in scope
  - the connected local full-stack flows were verified live
  - the release-candidate handoff guidance and helper commands were re-verified on localhost and LAN-accessible URLs
- Treat the checked-in milestone prompt sequence as complete after `prompts/milestone-e-hardening-release/99-merge-branch.md`; there is no further prompt file in this repository for Milestone E.

### 2026-03-27 milestone-e release readiness decisions
- Clarify the README in the shared run and LAN sections that Vite preview is network-accessible but does not proxy `/api`, so connected preview checks require a build created with `VITE_API_BASE_URL` unless the backend will be served from the same origin.
- Treat Milestone E release readiness as a local release-candidate handoff bar:
  - helper commands run as documented
  - media roots are prepared as documented
  - backend, frontend, and preview startup are reachable on both localhost and the machine LAN address
  - offline and sync behavior remains documented and covered through the current automated suite plus prompt-04 live verification
- Record the remaining items as non-blocking limitations rather than release blockers for this milestone:
  - timer and playlist sound playback is still UI-only
  - richer `custom play` media-library management is still unimplemented
  - `sankalpa` edit/archive/delete flows are still unimplemented
  - backend Maven verification still emits the existing Flyway/H2 compatibility warning even though verify passes

### 2026-03-27 milestone-e end-to-end verification decisions
- Run connected local full-stack verification on backend `127.0.0.1:8081` with isolated H2 database `meditation-prompt04`, and point the frontend at that backend on supported local ports already covered by the backend CORS allowlist:
  - Vite dev: `5173` or `5174`
  - Vite preview: `4173` or `4174`
- Treat React StrictMode as part of the real app lifecycle and fix `TimerContext` mount-state bookkeeping in the provider, instead of weakening StrictMode-based test coverage or special-casing development behavior.
- Keep playlist-generated `session log` ids bounded to the backend `session_log.id varchar(64)` limit so playlist auto-log and ended-early flows remain safe against H2 persistence failures.
- Document local runtime expectations explicitly:
  - Vite dev proxies `/api`
  - Vite preview does not proxy `/api` and therefore requires an explicit `VITE_API_BASE_URL` for connected full-stack checks

### 2026-03-27 milestone-e accessibility and responsive polish decisions
- Improve accessible form semantics on the highest-value validation-heavy flows first:
  - timer setup
  - settings
  - manual log
  - `custom play`
  - playlist management
- Keep hint text visible and connected to its control through stable `aria-describedby` ids, then swap that relationship to the inline error message only when the field becomes invalid.
- Use wider-screen two-column layouts only for the management surfaces that naturally split into editing and review panes:
  - `custom play`
  - playlist management
- Keep phone layouts stacked and touch-friendly so the responsive polish adds space on tablet and desktop without turning the app into a dense dashboard.

### 2026-03-27 milestone-e hardening remediation decisions
- Reduce `TimerContext` risk incrementally by extracting the repeated queue-backed collection reconciliation rules into a focused helper module, instead of attempting a larger provider split during this prompt.
- Replace JSON-stringification-based queue hydration keys and collection equality checks with narrower metadata signatures and domain-aware equality helpers so sync cycles do less avoidable serialization work.
- Make `npm run media:setup` prepare both media roots used by the repo:
  - `public/media/custom-plays`
  - `local-data/media/custom-plays`
- Keep the frontend fallback and backend-served media paths both documented, because the repo still supports frontend-only sample checks while the backend serves `/media/**` from the H2-backed local stack.

### 2026-03-27 milestone-e hardening release branch setup decisions
- Treat `codex/functioning` as the parent branch for `milestone-e-hardening-release`.
- Create and use the local milestone branch `codex/milestone-e-hardening-release` for all Milestone E prompt execution before merging back to the parent branch.
- Keep Milestone E bounded to the release-hardening slice:
  - release review across usability, code quality, performance, backend hygiene, API design, testing, and docs clarity
  - remediation of critical and important hardening findings
  - accessibility and responsive polish
  - full-stack end-to-end verification and release-candidate readiness handoff
- Preserve strict prompt-file execution order and avoid unrelated refactors while the milestone branch is active.

### 2026-03-27 milestone-d merge decisions
- Merge `codex/milestone-d-offline-sync-fullstack` back into `codex/functioning` with a normal local merge commit so the offline architecture, reconciliation, remediation, and testing history remain intact.
- Mark Milestone D complete on `codex/functioning` and hand off directly to `prompts/milestone-e-hardening-release/00-create-branch.md` as the next exact prompt.

### 2026-03-27 milestone-d offline sync testing decisions
- Use app-level stateful fetch-mock journeys in `src/App.test.tsx` as the main prompt 06 confidence layer, because the remaining Milestone D risk is startup and replay continuity across multiple features rather than isolated queue helpers.
- Add only two new prompt 06 journeys:
  - offline startup from cached queued state through reconnect success
  - partial reconnect failure followed by a later retry success
- Keep retry verification focused on durable user and queue outcomes:
  - local data stays visible
  - already synced work does not replay
  - failed work remains queued and retries on the next online transition

### 2026-03-27 milestone-d offline remediation decisions
- Keep stale queued delete handling explicit for backend-backed mutable records by returning a `"stale"` delete outcome with the current backend record instead of treating the delete as silent success.
- Rehydrate stale delete outcomes directly into the existing `custom play` and playlist UI flows so the latest backend-backed record is restored locally with calm conflict guidance, rather than adding a separate conflict-management surface in this milestone.
- Make `sankalpa` replay depend only on the queued replay payload shape, not queue state metadata, so failed or in-flight bookkeeping changes do not trigger extra `/api/sankalpas` reloads or reset failed entries back to pending.

### 2026-03-27 milestone-d backend reconciliation decisions
- Keep the existing REST routes as the offline reconciliation boundary instead of introducing parallel sync-only endpoints in this prompt.
- Send one queued-mutation timestamp from the frontend queue flush into backend writes so the server can distinguish current mutations from stale delayed retries.
- Treat mutable backend-backed records as stale-write-protected:
  - timer settings
  - custom plays
  - playlists
- Treat stable-id write flows as retry-safe through idempotent upserts in the current single-user model:
  - session logs
  - current create-only sankalpa saves
- Resolve stale queued deletes as backend no-ops rather than hard conflicts, so a newer backend-backed record is preserved and can rehydrate back into the UI on the next load.

### 2026-03-27 milestone-d offline frontend sync-queue decisions
- Make implemented backend-backed write flows local-first so the app remains usable offline without adding a second offline-only UI path:
  - timer settings
  - session logs, including manual logs
  - custom plays
  - playlists
  - sankalpas
- Treat locally queued writes as the frontend-visible truth until the backend confirms newer data, instead of clearing or hiding local edits while sync is pending.
- Reconcile stale backend hydration by overlaying queued local mutations on top of fetched records, so an older list response cannot resurrect deleted `custom play` or playlist records or erase newer offline edits.
- Reduce queued writes by entity identity and mutation intent to keep replay deterministic and bounded rather than re-sending every intermediate local edit after connectivity returns.
- Keep offline UX calm and lightweight:
  - shell-level offline and pending-sync visibility
  - feature-level warning copy where a save is deferred
  - no blocking sync modal, conflict center, or dashboard-style queue screen in this prompt

### 2026-03-27 milestone-d offline architecture decisions
- Start Milestone D with a shared frontend offline/sync foundation before wiring domain-specific queueing, so later prompts can reuse one queue model instead of adding more per-feature network logic inside `TimerContext`.
- Use one browser-persisted sync queue for deferred writes across the implemented backend-backed domains:
  - timer settings
  - session logs
  - custom plays
  - playlists
  - sankalpas
- Treat the latest queued write for a given `(entity type, record id)` as the one that should survive in the queue, so offline edits do not pile up stale intermediate mutations for the same record.
- Keep app-level connectivity and queue visibility in a dedicated `src/features/sync/` provider instead of threading those concerns through route components.
- Surface offline and pending-sync state as lightweight shell banners only; do not introduce blocking overlays or dashboard-style sync UI in this milestone.

### 2026-03-26 milestone-c sankalpa rest decisions
- Move `sankalpa` persistence and primary progress calculation to the backend so Home and Sankalpa read the same H2-backed source of truth.
- Keep the frontend `SankalpaGoal` and `SankalpaProgress` shapes stable by returning backend progress entries that match the existing UI model instead of redesigning the screens.
- Preserve local `sankalpa` cache behavior as:
  - a migration source for older browser-only goals
  - a fallback cache when the backend is temporarily unavailable
- Add a Flyway migration to store `sankalpa_goal.target_value` as a fractional numeric value so duration-based goals can preserve the existing `0.5` minute UI precision.
- Use a shared frontend `useSankalpaProgress` hook so the Home snapshot and Sankalpa screen stay aligned on loading, fallback, migration, and save behavior.

### 2026-03-26 milestone-c summaries rest decisions
- Add a dedicated backend summary aggregate endpoint at `/api/summaries` so the insight layer reads from the same H2-backed `session log` source of truth as History.
- Keep summary range selection and validation in the frontend while moving aggregate derivation to the backend:
  - overall
  - by meditation type
  - by source
  - by time-of-day bucket
- Keep the backend summary contract aligned with the current `Sankalpa` summary UI shape so the screen can migrate without a route redesign.
- Preserve a calm local derived fallback on the `Sankalpa` screen when the summary API is temporarily unavailable, and explain that fallback plainly instead of hiding the degraded state.
- Treat backend time-of-day bucketing as a local-runtime timezone concern for the current single-user local-development setup.

### 2026-03-26 milestone-c discipline insight remediation decisions
- Accept an optional browser-supplied IANA `timeZone` query parameter on `/api/summaries` and `/api/sankalpas` so backend time-of-day buckets stay aligned with the frontend's local fallback semantics.
- Keep invalid time-zone input explicit and bounded by returning a `400` response instead of silently falling back to the backend host timezone.
- Narrow local `sankalpa` save fallback to true network-unreachable failures only; backend validation or server rejections must not fork local state away from the H2-backed source of truth.
- Surface degraded local-save fallback as a warning state and keep backend rejection feedback inline on the `Sankalpa` screen.

### 2026-03-26 milestone-c discipline insight testing decisions
- Add one stateful app-level interaction test for the highest-value Milestone C journey: a backend-backed manual log saved in `History` must surface correctly in both `summary` and `sankalpa` on the `Sankalpa` screen, including a fresh mount.
- Add negative-path backend controller coverage for invalid `timeZone` input so the remediation boundary is tested on both successful and rejected requests without widening the milestone into new feature work.

### 2026-03-26 milestone-c merge decisions
- Merge `codex/milestone-c-discipline-insight-fullstack` back into `codex/functioning` with a normal local merge commit so the milestone's review, remediation, and testing history stays intact.
- Mark Milestone C complete on `codex/functioning` and hand off to `prompts/milestone-d-offline-sync-fullstack/00-create-branch.md` as the next exact prompt.

### 2026-03-27 milestone-d offline sync branch setup decisions
- Treat `codex/functioning` as the parent branch for `milestone-d-offline-sync-fullstack`.
- Create and use the local milestone branch `codex/milestone-d-offline-sync-fullstack` for all Milestone D prompt execution before merging back to the parent branch.
- Keep Milestone D bounded to the offline-sync full-stack slice:
  - offline-first architecture foundations
  - frontend offline behavior and sync queue support for implemented domains
  - backend reconciliation and sync-safe duplicate handling
  - milestone review, remediation, verification, and local merge-back
- Preserve strict prompt-file execution order and avoid unrelated refactors while the milestone branch is active.

### 2026-03-26 milestone-c discipline insight branch setup decisions
- Treat `codex/functioning` as the parent branch for `milestone-c-discipline-insight-fullstack`.
- Create and use the local milestone branch `codex/milestone-c-discipline-insight-fullstack` for all Milestone C prompt execution before merging back to the parent branch.
- Keep Milestone C bounded to the discipline-and-insight full-stack slice:
  - summary REST support
  - sankalpa REST persistence and progress support
  - milestone review, remediation, verification, and local merge-back
- Preserve strict prompt-file execution order and avoid unrelated refactors while the milestone branch is active.

### 2026-03-26 milestone-b merge decisions
- Merge `codex/milestone-b-practice-composition-fullstack` back into `codex/functioning` with a normal local merge commit so the manual logging, custom play, media catalog, playlist, remediation, and testing history stays intact.
- Mark Milestone B complete on `codex/functioning` and hand off to Milestone C branch setup as the next prompt sequence.

### 2026-03-26 milestone-b testing decisions
- Use app-level stateful fetch-mock coverage in `src/App.test.tsx` as the main prompt 06 confidence layer for Milestone B, because the remaining risk is backend-backed persistence and fresh-mount hydration continuity rather than isolated reducer or component logic.
- Strengthen test confidence with backend-backed rehydration journeys for:
  - manual log -> History
  - custom play -> Practice tools
  - playlist run -> History
- Keep prompt 06 bounded to test additions and milestone documentation only; do not introduce new feature behavior outside what the tests need to exercise.

### 2026-03-26 milestone-b remediation decisions
- Treat backend playlist hydration as the source-of-truth gate for playlist-run launch actions on both `Practice` and `Home`; expose an explicit `playlists loading` block reason and disable launch buttons while hydration is still in flight.
- Keep backend playlist persistence failures distinct from active-run delete blocks by returning expressive delete results from `TimerContext` and reserving the “currently running” message for the real run-conflict case only.
- Scope playlist-item `external_id` uniqueness to `(playlist_id, external_id)` instead of the whole table so migrated browser ids remain reusable across different playlists without leaking raw H2 constraint failures through the REST API.

### 2026-03-26 milestone-b playlists rest decisions
- Move playlist persistence to backend-owned H2 + REST while keeping the existing frontend `Playlist` and `PlaylistItem` shapes stable for screen consumers.
- Reuse the existing `playlist` and `playlist_item` tables, but add a stable string `external_id` for playlist items so older browser-created item ids migrate cleanly.
- Keep playlist-generated `session log` behavior at per-item granularity through the existing `session log` sync path:
  - each reached item logs an `auto log`
  - completed items log `completed`
  - ending early logs the active item as `ended early`
  - unstarted future items do not log
- Preserve readable historical playlist context even after a playlist is deleted by storing snapshot fields (`playlistName`, run metadata, item position/count`) on `session log` rows and letting `playlist_id` null out on delete.
- Preserve browser `localStorage` for:
  - first-hydration migration of older local playlists
  - fallback cache continuity when backend hydration fails
- Keep playlist management feedback calm and local to the Practice/playlist surfaces:
  - loading banners during backend hydration
  - inline warning banners on backend failures
  - truthful save/update/delete feedback only after backend confirmation

### 2026-03-26 milestone-b media catalog custom plays rest decisions
- Keep the existing backend `media asset` catalog, configured media-root filesystem conventions, and seeded custom-play metadata as the source of truth for selectable recordings in this slice.
- Move `custom play` persistence to backend-owned H2 + REST while keeping the existing frontend `CustomPlay` shape stable and adapting the new backend contract to it.
- Extend the existing `custom_play` table with the missing sound fields instead of introducing a second `custom play` persistence model.
- Use backend detail upserts at `PUT /api/custom-plays/{id}` so existing browser-created `custom play` ids can migrate cleanly during first backend hydration.
- Preserve browser `localStorage` for:
  - first-hydration migration of older local `custom play` records
  - fallback cache continuity when backend hydration fails
- Keep backend validation narrow and explicit in this slice:
  - required `custom play` name
  - allowed meditation type
  - duration greater than 0
  - required start and end sounds
  - optional linked `media asset` id must exist, be active, and belong to the `custom-play` asset kind
- Add calm Practice feedback for backend-backed `custom play` load and save states instead of introducing heavier global status UI.

### 2026-03-26 milestone-b manual logging rest decisions
- Add a dedicated backend create route for manual logs at `/api/session-logs/manual` while keeping the existing `PUT /api/session-logs/{id}` flow for auto-log and playlist-log sync.
- Keep manual logs in the shared `session_log` table and shared `SessionLogResponse` contract instead of introducing a separate manual-log persistence model.
- Make the backend the owner of manual-log construction details:
  - generated id
  - `source = manual log`
  - `status = completed`
  - derived `startedAt` and `endedAt`
  - default sound and interval fields
- Keep frontend manual-log validation in place for calm immediate feedback, but treat the backend-created `session log` response as the source of truth for what enters History.

### 2026-03-26 milestone-b practice composition branch setup decisions
- Treat `codex/functioning` as the parent branch for `milestone-b-practice-composition-fullstack`.
- Create and use the local milestone branch `codex/milestone-b-practice-composition-fullstack` for all Milestone B prompt execution before merging back to the parent branch.
- Keep Milestone B bounded to the practice-composition full-stack slice:
  - manual `session log` REST persistence for manual logging
  - media catalog and `custom play` REST persistence
  - playlist and playlist-item REST persistence
  - milestone review, remediation, verification, and local merge-back
- Preserve strict prompt-file execution order and avoid unrelated refactors while the milestone branch is active.

### 2026-03-26 milestone-a core full-stack branch setup decisions
- Treat `codex/functioning` as the parent branch for `milestone-a-core-fullstack`.
- Create and use the local milestone branch `codex/prompts/milestone-a-core-fullstack` for all Milestone A prompt execution before merging back to the parent branch.
- Keep Milestone A bounded to the core full-stack practice engine flow:
  - session log REST persistence
  - timer completion record support needed by the core flow
  - settings/preferences persistence needed by the core flow
  - Home, Practice, active timer, and History backend integration
  - milestone review, remediation, verification, and local merge-back
- Preserve strict prompt-file execution order and avoid unrelated refactors while the milestone branch is active.

### 2026-03-26 milestone-a session-log rest integration decisions
- Implement the first Milestone A backend-backed core flow around:
  - `session log` history
  - timer settings/preferences
- Keep the frontend `SessionLog` and `TimerSettings` shapes stable and adapt the new backend DTOs to those existing contracts instead of rewriting screen-level consumers.
- Use backend hydration as the source of truth for timer settings and session logs, while retaining local storage as:
  - a migration source for existing browser data
  - a fallback cache when backend hydration fails
- Sync new timer-generated and manual `session log` entries through the `/api/session-logs` REST boundary, with calm warning states when backend sync fails.
- Use one seeded `timer_settings` record (`default`) for the current single-user local setup instead of introducing profile/account complexity in Milestone A.
- Keep active timer and active playlist recovery local-only in this slice; only persisted settings and session history move to H2.

### 2026-03-26 milestone-a core practice engine decisions
- Treat backend timer-settings hydration as the gate for timer-start actions on `Home` and `Practice` so the core flow never starts from stale defaults before the H2-backed source of truth arrives.
- Keep backend state feedback calm and local to the relevant screens:
  - lightweight loading banners while timer defaults hydrate
  - inline warning banners when backend sync/load fails
  - no blocking overlay or dashboard-style status layer
- Verify prompt 02 with the real local full-stack setup that now exists in-repo:
  - Spring Boot dev backend
  - H2 file-backed persistence
  - Vite dev frontend and `/api` proxy
  - media files served from disk through backend path references
- Expand confidence in the core flow with stateful app-level integration tests rather than adding a new e2e framework in this slice:
  - Home quick-start hydration gating
  - backend timer-settings persistence across a fresh app mount
  - ended-early timer -> `session log` -> History rehydration across a fresh app mount

### 2026-03-26 milestone-a remediation decisions
- Lock timer-setting controls on `Practice` and `Settings` until backend hydration finishes, rather than allowing editable-but-overwritable intermediate state.
- Expose explicit timer-settings sync state from `TimerContext` so `Settings` can distinguish:
  - loading
  - saving in flight
  - saved after backend confirmation
- Keep the broader `Practice` draft-vs-defaults model unchanged in this remediation slice and defer that bigger product/state decision as a later nice-to-have improvement.

### 2026-03-26 milestone-a verification decisions
- Keep prompt 05 verification-focused and add only narrow confidence-building coverage where the milestone still had a meaningful gap:
  - backend-backed Home quick start launching from hydrated defaults
  - direct H2 timer-settings persistence at the repository boundary
- Treat the locked default dev H2 file and occupied default dev ports as environment constraints, not Milestone A product failures.
- Complete live runtime verification against an isolated local stack when the default dev runtime is busy:
  - temporary backend H2 database name `meditation-prompt05`
  - backend port `8081`
  - frontend port `5175`
- Use that isolated runtime only for verification and keep the shipped app behavior/config unchanged.

### 2026-03-26 milestone-a merge decisions
- Merge `codex/prompts/milestone-a-core-fullstack` back into `codex/functioning` with a normal local merge commit to preserve the milestone history.
- Treat the unrelated staged `AGENTS.md` change as out of scope for Milestone A merge work and keep it separate from the merge-related documentation update.
- Mark Milestone A as complete on the parent branch and hand off to Milestone B branch setup as the next prompt sequence.

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

### 2026-03-25 backend bootstrap foundation decisions
- Add one in-repo Spring Boot backend module under `backend/` as the first real backend implementation step.
- Use Maven for the backend foundation because it works reliably in this environment, while the local Gradle installation does not.
- Use Flyway migrations as the source of truth for schema and seed data instead of Hibernate schema generation.
- Establish the initial backend package structure with real implementation in:
  - `config`
  - `health`
  - `media`
  and reserved domain packages for:
  - `customplay`
  - `playlist`
  - `reference`
  - `sankalpa`
  - `sessionlog`
- Keep the first live domain API bounded to seeded custom-play media metadata plus a health endpoint; defer broader feature REST APIs to later slices.
- Store media files on disk under a configured backend media root and persist relative paths in H2 rather than binary blobs.
- Keep frontend feature flows local-first for now; do not mix backend scaffolding with premature frontend transport rewiring in this slice.

### 2026-03-26 frontend API integration foundation decisions
- Introduce one shared frontend JSON API client instead of adding ad hoc `fetch` calls inside feature components.
- Keep API-base resolution same-origin by default (`/api`) and support explicit absolute override with `VITE_API_BASE_URL`.
- Add a Vite dev proxy for `/api` so local frontend development works cleanly against the in-repo backend without hardcoding backend origins into feature code.
- Limit the first live frontend/backend transport slice to the existing media endpoint because the backend already exposes `/api/media/custom-plays`.
- Preserve current custom-play UX by falling back to built-in sample media metadata when the backend media API is unavailable or incomplete.
- Keep playlists, sankalpas, custom-play CRUD, and session-log persistence local-first until their backend APIs and migration slices are implemented.

### 2026-03-26 foundation remediation and testing decisions
- Disable the H2 console in the default backend runtime and enable it only in the local `dev` profile used by `npm run dev:backend`.
- Keep `/api/health` limited to readiness metadata and remove absolute filesystem-path details from the response.
- Replace fixed localhost-only CORS entries with origin patterns that match the documented local and LAN frontend workflow on the supported dev/preview ports.
- Make the advertised `/media/**` contract truthful by serving backend media files from the configured filesystem media root.
- Keep frontend media fallback support, but distinguish backend-unavailable cases from invalid backend responses and server-side failures so integration regressions are visible.
- Strengthen the foundation test layer around:
  - runtime profile/config expectations
  - API client error classification
  - repository/service/controller/media-serving behavior

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
