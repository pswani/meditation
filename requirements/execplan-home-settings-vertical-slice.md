# ExecPlan: Functional Home + Settings Vertical Slice

## 1. Objective
Make `Home` and `Settings` fully functional in the current prototype, including meaningful data-driven UX, local persistence behavior, and responsive usability in the existing app shell.

## 2. Why
The shell and core flows already exist, but `Home` and `Settings` are still placeholders. Completing these routes improves first-use clarity, daily re-entry flow, and default-preference control without introducing new major feature areas.

## 3. Scope
Included:
- Functional `Home` screen with:
  - quick start entry to timer
  - today activity summary derived from available app data
  - recent session log activity
  - favorite/recent shortcuts where current state supports them
  - useful empty states and next-action navigation
- Functional `Settings` screen with:
  - editable default timer preferences
  - clear apply/save behavior
  - reset-to-default behavior
  - responsive layout
  - local persistence via existing timer settings pipeline
- Focused tests for:
  - home derived display logic
  - timer settings persistence/default fallback behavior
  - practical route/navigation behavior for Home/Settings

Excluded:
- backend/cloud sync
- auth/accounts
- notifications
- unrelated refactors
- large new feature areas outside Home/Settings

## 4. Source documents
- AGENTS.md
- PLANS.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md
- prompts/11-home-settings.md

## 5. Affected files and modules
- `src/pages/HomePage.tsx`
- `src/pages/SettingsPage.tsx`
- `src/utils/home.ts`
- `src/utils/home.test.ts`
- `src/utils/storage.test.ts`
- `src/App.test.tsx`
- `src/index.css`
- `README.md` (if setup/use guidance needs clarification)
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Home:
  - clear quick start entry
  - visible “today” summary from available `session log` data
  - recent activity list with human-readable timing
  - favorite custom play / playlist shortcuts when present
  - calm empty states and direct links to key routes
- Settings:
  - editable defaults:
    - duration
    - meditation type
    - start sound
    - end sound
    - interval preferences
  - explicit save confirmation
  - reset defaults action
  - clear validation feedback

## 7. Data and state model
- Reuse existing `TimerContext` state and `TimerSettings` persistence.
- Add pure helper derivation for Home “today” summary.
- No backend; all data remains local-first.

## 8. Risks
- Home could become noisy if too much data is surfaced at once.
- Quick actions could produce unclear behavior when active sessions/runs already exist.
- Settings validation must remain aligned with timer validation rules.

## 9. Milestones
1. Add Home derivation helper(s) and focused tests.
2. Implement functional Home screen with quick actions, summaries, recent activity, and favorites.
3. Implement functional Settings screen with save/reset and validation feedback.
4. Add/update focused tests for persistence/defaults and route behavior.
5. Run verification and update docs/handoff.

## 10. Verification
- `npm install`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run dev` (manual startup URL verification)

## 11. Decision log
- Keep Home and Settings implementation bounded to existing context/state model.
- Prefer explicit Save Defaults behavior in Settings for predictable user intent.
- Keep Home shortcuts limited to already-supported state (favorites/recent) to avoid scope creep.

## 12. Progress log
- Completed: required docs and prompt review.
- Completed: Home helper derivation utilities and focused tests.
- Completed: functional Home screen with:
  - quick start behavior
  - today summary
  - recent activity
  - favorite shortcuts
  - empty states and next actions
- Completed: functional Settings screen with:
  - default preference controls
  - save defaults behavior
  - reset defaults behavior
  - validation-aligned feedback
- Completed: focused tests for:
  - Home derived display logic
  - timer settings persistence and defaults fallback
  - practical Home/Settings route rendering behavior
- Completed: verification commands:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
- Completed: decisions and session handoff updates.
