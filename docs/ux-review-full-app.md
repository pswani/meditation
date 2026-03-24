# UX Review: Full Application

## Scope reviewed
- app shell and responsive navigation
- Home (`/`)
- Practice / Timer Setup (`/practice`)
- Active Timer (`/practice/active`)
- Playlist manager (`/practice/playlists`)
- Active Playlist Run (`/practice/playlists/active`)
- History (`/history`)
- Settings (`/settings`)
- Sankalpa + Summary (`/goals`)
- redirect behavior (`/sankalpa` -> `/goals`)

## Review lens
- calmness and focus
- information architecture clarity
- action discoverability and continuity
- validation and feedback quality
- responsive behavior across mobile, tablet, desktop
- accessibility-minded usability from the visible implementation
- coherence of end-to-end prototype journeys

## Method
- Reviewed route, screen, and feature source implementation.
- Ran the app locally and validated key journeys in-browser across desktop, tablet, and mobile breakpoints.
- Tested major flows:
  - start session
  - pause/resume/end early
  - auto log reflection in history
  - manual log creation
  - custom play create/favorite/use
  - playlist create/favorite/run/end early/history reflection

## Summary
The app now feels like a coherent, functioning prototype rather than disconnected slices. Core journeys are in place, terminology is mostly consistent, and the visual style remains calm and minimal. The biggest UX gap is still information architecture inside Practice and History: primary actions are working, but key screens still combine too many responsibilities in one scroll stack, especially on mobile. A second major gap is continuity signaling for active sessions/runs across the whole app shell.

## What is working well
- Navigation model is consistent across breakpoints:
  - mobile bottom nav
  - tablet/desktop sidebar
- Timer flow is understandable and includes meaningful safeguards:
  - progressive validation
  - advanced options grouping
  - end-early confirmation
- Logging trust has improved:
  - auto log and manual log are clearly differentiated in history
  - completed vs ended early distinction is visible
- Home functions as a real launch surface:
  - quick start
  - today snapshot
  - recent activity
  - favorites
  - sankalpa snapshot
- Settings now communicates unsaved vs saved state clearly.

## Journey assessment
- Entering app and wayfinding:
  - Strong. Primary destinations are obvious.
- Starting meditation quickly:
  - Functional but hindered by Practice screen density.
- Configuring timer options:
  - Strong. Required fields and advanced options are clear.
- Running, pausing, resuming, ending:
  - Strong. Focused active screen and clear controls.
- Seeing session reflected in history:
  - Strong behavior, but history layout priority can improve.
- Using Home as launch surface:
  - Good, with meaningful summaries and shortcuts.
- Using Settings effectively:
  - Good baseline; minor confidence polish remains.
- Cross-device continuity:
  - Mostly good, but active-run discoverability should be global.

## Findings

### Critical

1. Practice screen bundles too many jobs into one long page.
- Where:
  - `/practice` (Timer Setup + Custom Plays manager + Playlist entry)
- Why this is a problem:
  - Core timer-start intent competes with management-heavy forms and action clusters.
- User impact:
  - Higher cognitive load and slower start, especially on phones; calm, focused intent is diluted.
- Recommended fix:
  - Keep Timer Setup as the dominant first block.
  - Move heavy management sections behind tighter progressive disclosure or dedicated sub-routes from Practice.
  - Ensure “start session” remains above-the-fold at common phone heights.
- Device impact:
  - all-device, strongest on mobile

2. Active session/run continuity is not globally visible in the shell.
- Where:
  - app shell/topbar/nav while browsing non-Practice screens
- Why this is a problem:
  - Users can leave an active timer or playlist run and lose immediate awareness of in-progress state.
- User impact:
  - Reorientation friction and confidence drop (“is my session still running?”).
- Recommended fix:
  - Add a persistent global active-state affordance (chip/banner) in shell with one-tap resume.
  - Include destination-specific copy:
    - `Resume Active Timer`
    - `Resume Playlist Run`
- Device impact:
  - all-device

3. History prioritizes manual entry UI over recent log review.
- Where:
  - `/history`
- Why this is a problem:
  - Users commonly open History to confirm what happened; logs are pushed below a sizable form block.
- User impact:
  - Extra scroll and slower confirmation loop after practice.
- Recommended fix:
  - Make recent `session log` list the first visible section.
  - Move manual log into a collapsible panel or secondary section below logs.
- Device impact:
  - mobile/tablet primarily, still relevant on desktop

### Important

1. Completion messaging rounds very short sessions up to 1 minute.
- Where:
  - Active Timer completion state and Timer Setup last-outcome messaging
- Why this is a problem:
  - Display can overstate very short ended-early sessions.
- User impact:
  - Minor trust mismatch between lived session and shown completion text.
- Recommended fix:
  - Show exact `mm:ss` in completion messages; optionally show rounded minutes as secondary.
- Device impact:
  - all-device

2. Home `sankalpa` snapshot can become stale while mounted.
- Where:
  - Home reads sankalpas once at load
- Why this is a problem:
  - Snapshot may not reflect newly created sankalpas or updates until remount/refresh.
- User impact:
  - Intent loop on Home can appear inconsistent.
- Recommended fix:
  - Source snapshot from shared reactive state (or subscribe to storage changes) rather than one-time load.
- Device impact:
  - all-device

3. Confirmation dialogs have partial accessibility behavior.
- Where:
  - End-early and delete confirmations rendered as dialog-like sheets
- Why this is a problem:
  - Visual dialog is present, but focus management and keyboard escape behavior are limited.
- User impact:
  - Reduced keyboard and assistive-tech usability confidence.
- Recommended fix:
  - Implement proper dialog focus trapping, initial focus placement, and `Esc` dismissal where appropriate.
- Device impact:
  - all-device (accessibility-focused)

4. Action density in custom play and playlist rows remains high on phones.
- Where:
  - custom play list actions
  - playlist list actions
- Why this is a problem:
  - Multiple same-weight inline actions create crowded, harder-to-scan rows.
- User impact:
  - Slower decision-making and occasional mis-taps.
- Recommended fix:
  - Keep one primary row action and move secondary controls into a compact overflow pattern on narrow screens.
- Device impact:
  - mobile primarily

5. Home and History rely on absolute timestamps only.
- Where:
  - Home recent activity
  - History list
- Why this is a problem:
  - Absolute timestamps are accurate but slower to parse during daily habit checks.
- User impact:
  - Extra cognitive effort when scanning recency.
- Recommended fix:
  - Add relative-time helper text (`2h ago`, `yesterday`) alongside full timestamp.
- Device impact:
  - all-device

### Nice to have

1. Add subtle “last saved” indicator in Settings.
- Where:
  - `/settings`
- Why:
  - complements current dirty-state and improves confidence without noisy toasts
- Device impact:
  - all-device

2. Improve desktop Home composition for long-session users.
- Where:
  - `/` on wide screens
- Why:
  - once data grows, selective multi-column grouping can reduce vertical scanning
- Device impact:
  - desktop/tablet

3. Add tiny orientation cues for Practice sub-areas.
- Where:
  - Practice + Playlist routes
- Why:
  - helps users understand when they are in timer setup vs management context
- Device impact:
  - all-device

## Dimension-by-dimension assessment
- information architecture:
  - moderate; primary nav is clear, but Practice and History internal IA still overloaded
- discoverability of key actions:
  - good for first-time paths, moderate for in-progress resume continuity
- navigation consistency:
  - strong across breakpoints and route labels
- terminology consistency:
  - good; product terms are largely aligned
- interaction friction:
  - low in timer flow, moderate in management-heavy screens
- form usability and validation clarity:
  - strong baseline
- empty/error/success states:
  - generally good, with room for tighter prioritization in History
- visual hierarchy and scanability:
  - calm overall; dense action clusters remain in places
- responsive behavior:
  - solid shell behavior; content density needs further mobile tuning in key routes
- prototype coherence:
  - strong; journeys are functional and connected

## Prioritized remediation plan

### Phase 1: must fix now
1. Rebalance Practice IA for fast timer-start focus.
2. Add global active-session/playlist-run resume affordance in shell.
3. Reorder History so recent `session log` content leads and manual log is secondary.

### Phase 2: should fix soon
1. Improve completion message precision (`mm:ss`) for short ended-early sessions.
2. Make Home sankalpa snapshot reactive.
3. Reduce mobile action density for custom play and playlist rows.
4. Improve dialog accessibility behavior (focus + keyboard handling).

### Phase 3: polish later
1. Relative-time helpers in Home/History.
2. Settings “last saved” micro-confirmation.
3. Additional desktop grouping polish where data volume grows.

## Overall recommendation
Prioritize the shell-level continuity and internal IA fixes before cosmetic polish. The product already feels credible; these changes will most directly improve calmness, trust, and flow continuity across mobile, tablet, and desktop.
