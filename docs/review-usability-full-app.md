# Usability Review: Full Application

## Scope reviewed
- app shell and responsive navigation
- Home (`/`)
- Practice / Timer Setup (`/practice`)
- Active Timer (`/practice/active`)
- Playlists (`/practice/playlists`)
- Active Playlist Run (`/practice/playlists/active`)
- History (`/history`)
- Sankalpa and Summary (`/goals`)
- Settings (`/settings`)
- embedded Custom Plays management inside Practice
- all currently accessible major flows in the front-end workspace

## Review lens
- calmness and focus
- clarity of information architecture
- action discoverability
- terminology consistency
- responsive usability across phone, tablet, and desktop
- validation, feedback, and empty-state quality
- accessibility-minded usability visible from the implementation
- prototype coherence across connected journeys

## Method
- Reviewed the current route, component, and shared-style implementation.
- Validated current route rendering locally across phone, tablet, and desktop breakpoints.
- Assessed implemented journeys as an integrated experience, with special attention to:
  - quick start and timer setup
  - active timer and active playlist continuity
  - history review and manual logging
  - custom play and playlist management
  - summary and sankalpa creation

## Summary
The app now reads as a coherent, calm prototype rather than a set of disconnected slices. Navigation is stable across breakpoints, the timer flow is focused, History is much better prioritized than earlier versions, and the overall visual language stays restrained.

The biggest remaining UX problem is trust: the product prominently offers configurable sound cues across timer setup, settings, and custom plays, but those choices still do not produce actual playback. After that, the main gaps are terminology and composure issues rather than structural failures: Sankalpa still exposes internal labels, playlist runs still lack the optional small transition gap the product expects, and custom play media surfaces technical file-path details that pull the experience away from a calm user-facing tool.

## What is working well
- The shell is consistent:
  - mobile uses bottom navigation
  - tablet and desktop use a sidebar
  - labels and destinations stay aligned
- Home works as a genuine launch surface:
  - quick start
  - today snapshot
  - recent activity
  - favorites
  - sankalpa snapshot
- Practice keeps the timer setup dominant:
  - required inputs are easy to find
  - advanced options stay out of the way until needed
- History has a good current hierarchy:
  - recent `session log` content comes first
  - manual logging is secondary
  - source/status distinctions are readable
- Sankalpa and Summary now feel like part of the same product rather than separate experiments.

## Journey assessment
- Entering the app and orienting yourself:
  - strong
- Starting a session quickly:
  - strong
- Configuring timer options:
  - strong, except for the misleading sound controls
- Tracking what happened after practice:
  - good
- Managing custom plays and playlists:
  - functional, but some rows are still busy on narrow screens
- Reviewing discipline patterns and creating goals:
  - useful, but some wording is still too internal/technical

## Findings

### Critical

1. Sound controls promise behavior that the product does not deliver yet.
- Affected area/files:
  - `src/pages/PracticePage.tsx`
  - `src/pages/SettingsPage.tsx`
  - `src/features/customPlays/CustomPlayManager.tsx`
  - `README.md`
  - `requirements/roadmap.md`
- Why it matters:
  - start, end, and interval sounds are core meditation cues, not decorative options
  - the UI presents them as real settings, so users reasonably expect them to work
- Likely risk if left unchanged:
  - trust erosion
  - perceived product incompleteness in a core practice flow
  - confusion about whether the user misconfigured something
- Recommended remediation:
  - implement actual browser-based playback for selected timer and playlist sounds
  - add failure-safe feedback when playback is blocked or unavailable
  - keep the UX calm and bounded rather than adding a broad new sound-management surface
- Device impact:
  - all-device

### Important

1. Sankalpa still exposes internal system labels instead of human-facing language.
- Affected area/files:
  - `src/pages/SankalpaPage.tsx`
  - `src/pages/HomePage.tsx`
- Why it matters:
  - labels like `duration-based` and `session-count-based` read like implementation enums, not product copy
  - this weakens the seriousness and calmness of the goal-setting experience
- Likely risk if left unchanged:
  - lower comprehension
  - weaker product polish on an otherwise user-facing screen
- Recommended remediation:
  - replace internal-value copy with human labels such as `Duration goal` and `Session-count goal`
  - use the same phrasing consistently in the create form, Home snapshot, and summary/detail surfaces
- Device impact:
  - all-device

2. Playlist runs still lack the optional small gap between items that the product requires.
- Affected area/files:
  - `src/features/playlists/PlaylistManager.tsx`
  - `src/pages/PlaylistRunPage.tsx`
  - `docs/product-requirements.md`
  - `README.md`
- Why it matters:
  - direct item-to-item transitions can feel abrupt in a meditation flow
  - the current product requirements explicitly call for an optional small gap between items
- Likely risk if left unchanged:
  - playlist runs feel more mechanical than intentional
  - the product remains visibly short of a documented v1 expectation
- Recommended remediation:
  - add an optional per-playlist gap setting with clear copy
  - surface the transition state in the active playlist run UI without adding clutter
- Device impact:
  - all-device

3. Custom play media details surface technical file-path language that breaks the calm product tone.
- Affected area/files:
  - `src/features/customPlays/CustomPlayManager.tsx`
- Why it matters:
  - `Managed path` and raw path references are implementation details, not meaningful meditation content
  - they add technical noise inside a screen that should feel like a simple preset manager
- Likely risk if left unchanged:
  - avoidable cognitive load
  - a more “tooling” feel than a focused consumer product
- Recommended remediation:
  - keep user-facing metadata like label, duration, and meditation type
  - hide raw file-path details behind a secondary disclosure or remove them from the primary UI entirely
- Device impact:
  - all-device, strongest on mobile

4. Confirmation sheets are visually clear but still behave like partial dialogs.
- Affected area/files:
  - `src/pages/ActiveTimerPage.tsx`
  - `src/pages/PlaylistRunPage.tsx`
  - `src/features/customPlays/CustomPlayManager.tsx`
  - `src/features/playlists/PlaylistManager.tsx`
- Why it matters:
  - they use dialog-like presentation, but focus behavior and keyboard dismissal are not fully handled
  - this is especially relevant for keyboard users and assistive technology
- Likely risk if left unchanged:
  - reduced accessibility confidence
  - inconsistent interaction behavior across destructive or session-ending actions
- Recommended remediation:
  - add proper dialog behavior:
    - initial focus placement
    - focus trapping while open
    - `Esc` dismissal where appropriate
- Device impact:
  - all-device

5. Action density in custom play and playlist rows is still high on phones.
- Affected area/files:
  - `src/features/customPlays/CustomPlayManager.tsx`
  - `src/features/playlists/PlaylistManager.tsx`
  - `src/index.css`
- Why it matters:
  - rows combine several same-weight actions in a tight area
  - on narrow screens this makes scanning and confident tapping harder
- Likely risk if left unchanged:
  - mis-taps
  - slower decision-making
  - a more “busy” feel in management-heavy areas
- Recommended remediation:
  - keep one primary row action visible
  - move secondary actions into a compact overflow/disclosure pattern on narrow breakpoints
- Device impact:
  - mobile primarily

### Nice to have

1. Home and History would be easier to scan with relative-time helper text.
- Affected area/files:
  - `src/pages/HomePage.tsx`
  - `src/pages/HistoryPage.tsx`
- Why it matters:
  - absolute timestamps are accurate, but slower to parse during daily habit checks
- Likely risk if left unchanged:
  - minor scan friction
- Recommended remediation:
  - add subtle relative-time text alongside the existing full timestamp
- Device impact:
  - all-device

2. The Sankalpa create section uses a dense explanatory paragraph before the form.
- Affected area/files:
  - `src/pages/SankalpaPage.tsx`
- Why it matters:
  - the content is useful, but visually heavy on smaller screens
- Likely risk if left unchanged:
  - slower entry into goal creation
  - more text-first than action-first UX
- Recommended remediation:
  - compress the copy into shorter bullets or a collapsed “How counting works” disclosure
- Device impact:
  - mobile/tablet primarily

3. Settings could use a quieter confidence cue after save.
- Affected area/files:
  - `src/pages/SettingsPage.tsx`
- Why it matters:
  - the current saved/unsaved state is clear, but a small “last saved” cue would reduce ambiguity after repeated adjustments
- Likely risk if left unchanged:
  - minor uncertainty after multiple edits
- Recommended remediation:
  - add a lightweight saved timestamp or equivalent micro-confirmation without increasing toast noise
- Device impact:
  - all-device

## Dimension-by-dimension assessment
- information architecture:
  - strong overall; the main remaining friction is within management-heavy rows, not route structure
- discoverability of key actions:
  - strong
- navigation consistency:
  - strong
- terminology consistency:
  - moderate; Sankalpa still leaks internal labels
- interaction friction:
  - low in core timer flow, moderate in playlist/custom-play management on phones
- form usability and validation clarity:
  - strong baseline
- empty/error/success states:
  - strong
- visual hierarchy and scanability:
  - calm overall, with some avoidable technical/noisy details in management areas
- responsiveness:
  - shell behavior is solid across phone, tablet, and desktop
- functioning-prototype coherence:
  - strong

## Prioritized remediation plan

### Phase 1: must fix now
1. Implement actual timer and playlist sound playback with failure-safe feedback.
2. Replace Sankalpa’s internal-value labels with human-facing product copy.

### Phase 2: should fix soon
1. Add the optional small gap between playlist items and make the transition state feel intentional.
2. Remove technical file-path details from primary custom play UI.
3. Improve confirmation-sheet accessibility behavior.
4. Reduce action density in custom play and playlist rows on narrow screens.

### Phase 3: polish later
1. Add relative-time helper text in Home and History.
2. Tighten Sankalpa counting-rules copy.
3. Add a quieter Settings save-confidence cue.

## Overall recommendation
The product is now credible as a calm, local-first meditation prototype. The next UX win is not a broad redesign; it is closing the trust gap around sound cues and then polishing the remaining places where technical/internal language still leaks into the user experience.
