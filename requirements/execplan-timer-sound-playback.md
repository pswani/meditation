# ExecPlan: Real Timer Sound Playback

## 1. Objective
Implement real timer sound playback in the meditation app for:
- session start
- interval cues
- session end on natural completion
- session end when the user intentionally stops early

The slice must keep the existing timer setup, active timer, saved timer settings, and `custom play` -> timer apply flow intact while making the selected sound labels actually play audio files from the repo media roots.

## 2. Why
Timer sound selection is already part of the product promise and current UX, but the app still treats those fields as labels only. Wiring real playback closes a release-candidate gap, makes the timer flow more trustworthy, and keeps the app aligned with the documented product intent for optional start, end, and interval sounds.

## 3. Scope
Included:
- add a stable timer-sound label -> file mapping for the existing sound options
- ship an initial playable sound file set under the repo media roots
- add a focused playback helper/service outside the route JSX
- trigger playback for timer start, interval milestones, natural completion, and early stop
- preserve pause/resume interval correctness and avoid duplicate playback from re-renders or StrictMode
- surface lightweight calm guidance when playback fails or a sound label cannot be resolved
- keep saved timer settings and `custom play`-applied timer sound labels working with the same mapping
- update docs, decisions, and session handoff
- extend the `sound:add` workflow if needed so new playable sounds can be added consistently

Excluded:
- playlist audio playback
- media uploads or admin UI
- backend sound metadata APIs
- unrelated timer or playlist refactors

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `requirements/execplan-media-registration-scripts.md`
- `docs/media-registration-scripts.md`

## 5. Affected files and modules
- `requirements/execplan-timer-sound-playback.md`
- `README.md`
- `docs/media-registration-scripts.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `scripts/add-sound-option.mjs`
- `scripts/media-registration-utils.mjs`
- `scripts/setup-media-root.sh`
- `scripts/common.sh` if media-root helpers need to cover sound directories too
- `src/data/` timer sound mapping source file(s)
- `src/features/timer/TimerContext.tsx`
- new focused timer audio helper/service under `src/features/timer/` or `src/utils/`
- timer playback tests under `src/features/timer/` and any test setup support under `src/test/setup.ts`
- shipped sound files under:
  - `public/media/sounds/`
  - `local-data/media/sounds/`

## 6. UX behavior
- `None` remains a true silent option and never tries to play audio.
- If `startSound` is selected, it plays once when a timer session starts.
- If interval cues are enabled and the interval sound is not `None`, playback follows real elapsed timer milestones.
- If `endSound` is selected, it plays once when the timer completes or the user ends the session early.
- Pause/resume must not replay the start sound or double-fire missed intervals.
- If playback is blocked or a mapped file cannot be played, the timer continues and the UI shows only lightweight truthful guidance where it helps.
- The existing calm, mobile-first timer setup and active timer UI stays visually minimal.

## 7. Data and state model
- Keep timer settings and active session domain data using the existing sound labels.
- Add a stable source of truth for playable timer sound metadata keyed by label.
- Resolve each playable sound to a shared `/media/sounds/<filename>` URL so the same mapping works with:
  - backend-served files from `local-data/media/sounds/`
  - frontend fallback files from `public/media/sounds/`
- Keep runtime playback bookkeeping in focused helper state/refs rather than expanding the persisted timer domain model.
- Freeze an active session’s playback behavior from the `ActiveSession` snapshot already stored by the reducer so later settings edits do not mutate the in-flight session.

## 8. Risks
- React StrictMode and repeated renders can replay effects if playback tracking is not idempotent.
- Pause/resume and delayed browser timers can cause interval milestones to drift unless playback keys off elapsed session progress instead of raw render timing.
- Recovered active sessions from local persistence must not replay the session start sound on hydration.
- Browser autoplay policies or missing files can reject playback, so the timer flow must stay usable without crashing.
- The repo currently has no shipped timer sound files, so the initial file format and naming convention must be documented clearly.

## 9. Milestones
1. Add the ExecPlan, inspect the timer runtime seam, and define the shipped sound mapping.
2. Add playable sound assets plus the shared sound-resolution helper and update media-root helpers if needed.
3. Wire timer sound triggering into `TimerContext` with duplicate-safe start, interval, and end behavior.
4. Add focused tests for mapping and playback-trigger logic, including failure handling and StrictMode safety.
5. Update README, media-registration docs, decisions, and session handoff.
6. Run verification commands, perform a local timer sound behavior check, review scope, and commit.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- local behavior check with a running frontend on localhost:
  - start a timer with start/end/interval sounds
  - confirm start sound plays once
  - confirm interval sound plays on elapsed milestones
  - confirm early stop plays the end sound once
- note any browser autoplay-policy limits if they prevent full automation

## 11. Decision log
- Use one label-based sound catalog that resolves to `/media/sounds/<filename>` so frontend fallback and backend-served local media share the same runtime URL shape.
- Keep playback bookkeeping out of the reducer state and route JSX; use a focused helper/service plus `TimerContext` integration instead.
- Treat playback failures as non-fatal runtime issues with calm guidance rather than validation errors or blocking UI.

## 12. Progress log
- 2026-03-27: reviewed the required product, architecture, UX, roadmap, handoff, and media-registration documents.
- 2026-03-27: inspected the current timer runtime, sound-option catalog, `custom play` timer apply helper, media-root conventions, and registration scripts.
