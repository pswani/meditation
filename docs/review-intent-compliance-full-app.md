# Full App Intent Compliance Review

Date: 2026-03-31

## Scope and method
- Reviewed: `AGENTS.md`, `README.md`, `PLANS.md`, `requirements/intent.md`, `docs/product-requirements.md`, `docs/architecture.md`, `docs/ux-spec.md`, `docs/screen-inventory.md`, `requirements/roadmap.md`, `requirements/decisions.md`, and `requirements/session-handoff.md`.
- Audited the current frontend and backend implementation across timer, sounds, pause/resume/end flow, custom plays, meditation types, session logging, summaries, sankalpa goals, playlists, persistence, API boundaries, responsiveness, and docs.
- Supporting verification:
  - passed `npm run typecheck`
  - passed `npm run lint`
  - passed `npm run test` with 39/39 files and 242/242 tests passing
  - passed `npm run build`
  - `npm run start:app` failed against the default local H2 database because Flyway found an applied migration `8` that is no longer present locally
  - backend booted successfully on a clean isolated H2 database (`MEDITATION_H2_DB_NAME=meditation-prompt05`, port `8081`), so the startup failure is tied to the default persisted local DB state rather than a clean-boot backend regression

## Overall assessment
The app is strong on the timer, session logging, summaries, sankalpa calculation, playlist CRUD, local-first persistence, and REST boundary structure. The biggest compliance gap against `requirements/intent.md` is that `custom play` is still a timer preset with linked media metadata, not an actual runnable pre-recorded meditation-session flow. The biggest operational gap is that the documented managed local app start currently fails against the default persisted H2 database state.

## Pass/Fail matrix
`Partial` means the requirement is not fully compliant.

| Requirement | Sub-requirement | Status | Current observed state |
| --- | --- | --- | --- |
| Intent 1 | Meditate with the app using the timer | Pass | Fixed-duration timer flow is implemented with setup, active session, automatic completion, end-early handling, and history logging. |
| Intent 1.1 | Optional start and end sounds from a predetermined list | Pass | Start and end sounds are selectable in Practice and Settings, mapped through the timer sound catalog, and played during timer runtime. |
| Intent 1.2 | Optional interval sounds with validation that intervals are within total duration | Pass | Interval bell is optional, validation rejects non-positive intervals and intervals greater than or equal to fixed duration, and runtime cues use elapsed milestones. |
| Intent 1.3 | Pause, resume, end the session | Pass | Active timer supports pause, resume, and explicit end flow with confirmation and trustworthy auto-log creation. |
| Intent 2 | Create custom meditation plays using pre-recorded sessions | Partial | `Custom Plays` CRUD exists, optional linked media metadata exists, and `Use Custom Play` applies presets into timer setup, but there is no runnable media-backed custom-play session flow. |
| Intent 2 | Pre-configured meditation type on custom play | Pass | Custom plays require a meditation type and persist it. |
| Intent 2 | Optional start and end sounds on custom play | Pass | Custom play draft includes start and end sound selectors and persists them. |
| Intent 3 | Pre-configured meditation types list includes Vipassana, Ajapa, Tratak, Kriya, Sahaj | Pass | All five types are implemented in shared data and used across timer, manual log, custom play, playlist, summary, and sankalpa flows. |
| Intent 3 | Log the meditation | Pass | Timer sessions create auto logs, manual log flow exists in History, and manual vs auto source is preserved. |
| Intent 4 | Summarize meditation overall | Pass | Summary screen shows overall counts, duration, average duration, and completed vs ended-early totals. |
| Intent 4 | Summarize meditation by type | Pass | Summary includes by-type breakdown. |
| Intent 5.1 | Sankalpa duration goal in Y days, optionally filtered by meditation type | Pass | Duration-based sankalpa creation and progress calculation are implemented with optional meditation-type filter. |
| Intent 5.2 | Sankalpa session-count goal in Y days, optionally filtered by meditation type | Pass | Session-count sankalpa creation and progress calculation are implemented with optional meditation-type filter. |
| Intent 5.3 | Sankalpa goals filtered by morning, afternoon, evening, night | Pass | Time-of-day bucket filtering is implemented in both frontend fallback logic and backend API handling. |
| Intent 6 | Playlist sequences meditations one after the other | Partial | Playlist runtime advances timer-based items in sequence and creates per-item logs, but playlist items are still timer-only, cannot reference custom-play media sessions, and do not support optional small gaps. |
| Product reqs: Home | Quick start timer | Pass | Home exposes a primary quick-start action using saved defaults. |
| Product reqs: Home | Start last used meditation | Fail | No “last used meditation” action or persisted last-used shortcut exists. |
| Product reqs: Home | Favorite plays | Pass | Home shows favorite custom plays with `Use` actions. |
| Product reqs: Home | Favorite playlists | Pass | Home shows favorite playlists with `Run` actions. |
| Product reqs: Home | Today’s progress | Pass | Home shows today’s session count, duration, and completed vs ended-early totals. |
| Product reqs: Home | Sankalpa snapshot | Pass | Home shows the top active sankalpa with progress and deadline. |
| Product reqs: Timer | Fixed-duration or open-ended mode | Pass | Both modes are implemented. Open-ended mode is beyond `requirements/intent.md` but is supported by later product docs. |
| Product reqs: Custom Plays | Create, edit, delete, favorite | Pass | All CRUD and favorite flows exist with local-first persistence and backend sync. |
| Product reqs: Custom Plays | Attach pre-recorded session | Partial | Media asset selection exists, but it remains a stored reference rather than a runnable pre-recorded session experience. |
| Product reqs: Playlists | Create playlist, add/remove/reorder items, compute total duration, favorite | Pass | All are implemented in the playlist manager. |
| Product reqs: Playlists | Optional small gap between items | Fail | No UI, state, or runtime support for small item gaps exists even though the backend schema has `small_gap_seconds`. |
| Product reqs: Logging | Differentiate manual vs auto logs | Pass | History and summaries distinguish `manual log` vs `auto log`. |
| Product reqs: Summaries | Summary by source, date range, and time-of-day bucket | Pass | All three are implemented on the Sankalpa screen summary section. |
| Product/UX reqs | Responsive multi-device behavior | Pass | Mobile bottom navigation, tablet/desktop sidebar navigation, responsive grids, touch-sized controls, and wider-screen manager layouts are implemented in the shell and CSS. |
| Architecture | Route screens in `src/pages`, feature logic in `src/features`, shared types in `src/types`, helpers/API in `src/utils` | Pass | Current file layout follows the documented module structure. |
| Architecture | Business/state logic kept out of large JSX trees | Partial | Route components are reasonably clean, but `src/features/timer/TimerContext.tsx` is still a very dense orchestration module spanning timer runtime, playlist runtime, multiple sync flows, sound playback, and hydration logic. |
| Architecture | Clean REST boundary | Pass | Backend-backed flows are isolated behind `src/utils/*Api.ts` modules with typed request/response normalization. |
| Architecture / operations | Managed local app stack should start reliably from the documented local flow | Fail | `npm run start:app` currently fails on the default persisted H2 database because Flyway validation detects missing migration `8`. |

## Missing, partial, inconsistent, or unclear behaviors
- `Custom play` does not yet behave like a pre-recorded meditation session. It behaves like a saved timer preset with a linked media reference.
- Playlist runtime is sequential, but it is still sequencing timer segments rather than media-backed plays or custom plays.
- The optional playlist small-gap requirement is present in product docs and backend schema, but not in the frontend product flow or API contract.
- Home has quick start, favorites, and snapshot behavior, but it does not provide the documented “start last used meditation” path.
- The default managed local startup path is unreliable against the checked-in default H2 data directory because of unresolved Flyway history.
- The current codebase structure mostly matches the architecture docs, but `TimerContext` remains an oversized boundary that weakens the intended separation of domain/runtime concerns.

## Prioritized gaps

### Blocker

#### 1. Default managed local app startup fails against the persisted default H2 database
- Requirement mapping: trustworthy behavior, API integration readiness, local verification expectations in `AGENTS.md`, and practical product auditability
- Current observed state: `npm run start:app` fails because the backend startup log reports `Detected applied migration not resolved locally: 8.` for `local-data/h2/meditation`
- Why it is a gap: the current app cannot be started through the documented default managed flow in this workspace, which blocks reliable full-stack verification and undermines confidence in local persistence/API behavior
- Recommended fix direction: restore the missing migration history or add a documented repair/reset path for legacy local DBs; ideally make startup detect the condition and provide explicit recovery guidance instead of a raw Flyway failure

#### 2. `Custom play` is not yet a runnable pre-recorded meditation-session flow
- Requirement mapping: `requirements/intent.md` item 2 and `docs/product-requirements.md` custom-play requirements
- Current observed state: users can create, edit, favorite, and delete custom plays, attach a media asset id, and apply the play into timer setup, but they cannot run the linked recording as the actual meditation session
- Why it is a gap: this misses the central meaning of “create custom meditation plays using pre-recorded sessions”; the current implementation is materially closer to “saved timer presets”
- Recommended fix direction: add a primary `Run Custom Play` flow that plays the linked media session end to end, keeps the configured meditation type and optional start/end sounds, and produces trustworthy session logs on completion or early end

### Important

#### 3. Home does not implement “start last used meditation”
- Requirement mapping: `docs/product-requirements.md` Home requirements
- Current observed state: Home supports quick start from saved defaults and favorite shortcuts, but no last-used meditation shortcut is persisted or surfaced
- Why it is a gap: one of the documented low-friction home entry points is missing, so the Home screen does not fully match its intended usage model
- Recommended fix direction: persist the last started or last completed timer/custom-play/playlist context and expose a distinct Home action for resuming that pattern

#### 4. Playlists are still timer-only and do not support the documented optional small gap
- Requirement mapping: `requirements/intent.md` item 6 and `docs/product-requirements.md` playlist requirements
- Current observed state: playlist items only contain meditation type and duration; runtime sequences silent timer segments; no small-gap control exists even though `small_gap_seconds` exists in backend schema
- Why it is a gap: playlist behavior is only partially aligned with the intended richer meditation sequencing flow and still omits a documented requirement
- Recommended fix direction: extend playlist modeling so items can represent the intended meditation units, add a small-gap preference, and update playlist runtime plus logging to reflect that model

#### 5. The roadmap currently claims a front-end-only baseline even though the repo now contains a real backend and live REST integration
- Requirement mapping: documentation accuracy and architectural alignment
- Current observed state: `requirements/roadmap.md` still says the workspace “remains intentionally front-end only” and refers to API-style utilities for future compatibility, while the repo now has a Spring backend, H2 persistence, and live frontend REST clients
- Why it is a gap: this can mislead future contributors and audits about what is real, what is mocked, and where responsibility sits
- Recommended fix direction: rewrite the roadmap’s status and handoff notes so they describe the actual full-stack baseline and its remaining gaps accurately

#### 6. `TimerContext` is still carrying too many cross-domain responsibilities
- Requirement mapping: architecture expectations for predictable state, clean boundaries, and reusable domain helpers
- Current observed state: timer runtime, timer settings hydration, queue-backed sync, session-log sync, custom-play sync, playlist sync, playlist runtime, active-session recovery, and timer sound playback all converge in one large provider
- Why it is a gap: the current code remains workable, but this concentration of responsibilities raises change risk and makes feature behavior harder to reason about
- Recommended fix direction: extract focused hooks/services for timer-settings hydration, session-log sync, custom-play/playlist persistence, and playlist runtime orchestration while keeping the current public context contract stable

### Polish

#### 7. Practice docs overstate what the Practice screen currently exposes as dedicated surfaces
- Requirement mapping: `docs/screen-inventory.md`
- Current observed state: the Practice page is primarily timer setup plus collapsible tools; favorites live on Home, and meditation types are currently exposed as select inputs rather than a distinct hub surface
- Why it is a gap: the docs read like a broader “practice hub” than the current UI actually presents
- Recommended fix direction: either update the screen inventory to the current calmer structure or explicitly add the missing hub surfaces

#### 8. The custom-play/media copy is more capable than the actual runtime behavior
- Requirement mapping: custom-play user understanding and doc accuracy
- Current observed state: the UI explains linked media sessions clearly, but there is still no actual media-backed custom-play runtime
- Why it is a gap: the labeling is truthful at the metadata level, yet it still invites the assumption that the recording itself is the playable meditation unit
- Recommended fix direction: tighten short-term copy toward “linked recording reference” or deliver the runnable custom-play flow so the current wording becomes fully true

## Docs that currently claim functionality the app does not fully support
- `docs/product-requirements.md`
  - `Home` includes `start last used meditation`, which is not implemented
  - `Custom Plays` says `attach pre-recorded session`; current implementation stores a linked media reference but does not provide a runnable pre-recorded-session flow
  - `Playlists` include `optional small gap between items`, which is not implemented
- `docs/screen-inventory.md`
  - `Practice Hub` lists `favorites` and `meditation types` as hub surfaces, but the current Practice screen is timer setup plus collapsible tools; favorites are surfaced on Home
- `requirements/roadmap.md`
  - says the workspace “remains intentionally front-end only,” which is no longer true
  - says local-first persistence is the current baseline with API-style utilities for future compatibility, but several flows now use real backend persistence and REST APIs today

## Functionality present in the app that is outside the original intent doc
- Open-ended timer mode is implemented even though `requirements/intent.md` only asks for timer meditation generally. This is additive and consistent with later product docs.
- Offline-first sync queue behavior, sync banners, and stale-write reconciliation are implemented even though they are not called out in `requirements/intent.md`. These are infrastructure additions rather than product-scope violations.
- Settings-backed default timer preferences are more detailed than the original intent doc, but they support the app’s low-friction practice goals and do not conflict with scope.

## Recommended next implementation slice
Implement the missing end-to-end `custom play` runtime so `custom play` becomes a true pre-recorded meditation-session flow rather than only a timer preset. That is the single biggest compliance improvement against `requirements/intent.md` while still being a meaningful bounded vertical slice.
