# UX Review

Date: 2026-04-20

Reviewed sources:

- `docs/review-artifacts/test-matrix.md`
- `docs/review-artifacts/screenshot-index.md`
- `docs/review-artifacts/execution-report.md`
- screenshots under `docs/review-artifacts/screenshots/ios/`
- screenshots under `docs/review-artifacts/screenshots/web/`
- `README.md`
- `requirements/intent.md`
- `docs/product-requirements.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/session-handoff.md`

## Executive Summary

The app already has the right product shape: Home, Practice, History, Goals/Sankalpa, and Settings are present, and the captured flows show meaningful end-to-end meditation journeys across timer, manual logs, custom plays, playlists, summaries, and sankalpas. The calm visual direction is recognizable, especially in the restrained color palette and large touch targets.

The main UX risk is that the current interface often feels like a functional prototype wearing a production visual skin. Several screens leak implementation language such as backend, sync attempt, linked media identifier, and managed path. On web phone captures, persistent layers such as bottom navigation, the header, and the skip link visibly overlap page content in full-page evidence. On iPhone, the local-only banner collides with navigation controls, and the custom play / playlist Add actions did not reach their create forms during capture.

The strongest near-term release blockers are native iPhone management flow reachability, mobile fixed-layer layout integrity, validation clarity, and cross-platform navigation terminology. Once those are addressed, the next improvement should be reducing cognitive load in long management screens, especially web Goals/Sankalpa and custom play / playlist creation.

Evidence is incomplete for loading states, true native empty states, native custom play / playlist creation, native advanced timer validation, physical-device audio and notification behavior, and live viewport overlap verification beyond the captured full-page screenshots.

## Top 10 UX Issues Across The Product

### 1. Native custom play and playlist Add actions appear blocked

Severity: Critical

Platform affected: iPhone

Evidence:

- `docs/review-artifacts/screenshots/ios/custom-plays/06-create-form-unreachable-after-add.png`
- `docs/review-artifacts/screenshots/ios/playlists/06-create-form-unreachable-after-add.png`
- Flow context: tapping Add from native custom play and playlist libraries did not open the expected create form, according to the execution report.

Why it matters:

Creating custom plays and playlists is a primary product requirement. If Add is visible but does not transition, users lose confidence immediately and cannot complete core setup journeys on iPhone.

Recommended fix:

- Make Add route to a dedicated create screen or sheet for each library.
- Add an unmistakable create-screen title, such as `New custom play` and `New playlist`.
- Preserve the existing library context after cancel or save.
- Add a UI test that taps Add, verifies the form title, enters minimum valid fields, saves, and confirms the new item appears.

Concrete redesign suggestion:

- Use a native navigation bar item for Add only when the library list is loaded.
- Present create as a full-screen SwiftUI sheet with Cancel on the left and Save/Create on the right.
- Keep destructive actions out of the create sheet until editing an existing item.

### 2. Native iPhone top banner overlaps navigation controls

Severity: High

Platform affected: iPhone

Evidence:

- `docs/review-artifacts/screenshots/ios/custom-plays/05-library-populated.png`
- `docs/review-artifacts/screenshots/ios/custom-plays/06-create-form-unreachable-after-add.png`
- `docs/review-artifacts/screenshots/ios/playlists/05-library-populated.png`
- Flow context: the local-only status text runs across the same horizontal space as the back affordance and Add button.

Why it matters:

The user is asked to trust local-only behavior, but the message visually fights with primary navigation. This increases accidental taps, makes Add look partially obscured, and makes the iPhone app feel unfinished.

Recommended fix:

- Reserve vertical space for the status banner below the iOS status bar and above navigation controls.
- Keep the banner to one concise line on iPhone, for example: `Local-only mode. Changes stay on this iPhone.`
- Move detailed backend configuration copy into Settings.
- Never place banner text behind, under, or beside tappable navigation controls.

Concrete redesign suggestion:

- On iPhone library screens, structure the top area as:
  - native navigation bar: Back, title, Add
  - compact status pill below it, full width inside content margins
  - list content

### 3. Web phone fixed layers obscure content in captured pages

Severity: High

Platform affected: Web

Evidence:

- `docs/review-artifacts/screenshots/web/home/01-phone-empty-home.png`
- `docs/review-artifacts/screenshots/web/home/02-phone-populated-home.png`
- `docs/review-artifacts/screenshots/web/meditation/02-phone-timer-advanced-closed-open.png`
- `docs/review-artifacts/screenshots/web/custom-plays/02-phone-library-empty-form.png`
- `docs/review-artifacts/screenshots/web/goals/01-phone-summary-and-empty-goals.png`
- `docs/review-artifacts/screenshots/web/settings/02-phone-settings-validation-error.png`
- Flow context: full-page mobile captures show the bottom nav, sticky header, and focused skip link overlaying form fields, cards, and content.

Why it matters:

Even if some overlap is amplified by full-page screenshot mechanics, the evidence shows fixed layers that can cover important content. A meditation app should not require users to scroll around persistent UI chrome while filling forms or reviewing long sankalpa evidence.

Recommended fix:

- Add bottom safe-area padding equal to the mobile nav height plus `env(safe-area-inset-bottom)` to every scroll container.
- Ensure sticky headers do not duplicate or re-enter the scroll capture area.
- Confirm the skip link is only visible on keyboard focus and hides on blur.
- Run viewport screenshots, not just full-page captures, for the same screens at 390 x 844 and 430 x 932.

Concrete redesign suggestion:

- Make mobile bottom nav `position: sticky` within the app shell only if the content area gets a stable padding-bottom.
- For long forms, pin only the nav, not the section header, and keep submit buttons in content flow unless using a dedicated sticky action bar with reserved space.

### 4. Primary destination naming differs across platforms

Severity: High

Platform affected: Both

Evidence:

- iPhone tabs show `Goals`: `docs/review-artifacts/screenshots/ios/home/01-launch-home.png`, `docs/review-artifacts/screenshots/ios/goals/01-summary-and-goals.png`
- Web navigation shows `Sankalpa`: `docs/review-artifacts/screenshots/web/home/01-phone-empty-home.png`, `docs/review-artifacts/screenshots/web/responsive/01-desktop-home.png`
- Product docs define primary destinations as Home, Practice, History, Goals, Settings in `docs/ux-spec.md` and `docs/screen-inventory.md`.

Why it matters:

Users should build one mental model across web and iPhone. `Sankalpa` is a domain concept inside the Goals destination, but using it as the primary nav label on only one platform makes help text, screenshots, and future support harder.

Recommended fix:

- Use `Goals` as the primary navigation label on both platforms.
- Keep `Sankalpa` as the screen title or section heading inside Goals.
- Keep `/sankalpa` as a compatibility route only, not as user-facing nav terminology.

Concrete redesign suggestion:

- Web side nav and bottom nav: `Goals`
- Web page eyebrow: `Goal Tracking`
- Web H1: `Sankalpa`

### 5. Web validation can remain visible after fields appear populated

Severity: High

Platform affected: Web

Evidence:

- `docs/review-artifacts/screenshots/web/playlists/03-phone-create-populated-form.png`
- Flow context: the playlist form shows `Playlist name is required.` while `QA Morning Sequence` is present, and `Meditation type is required.` while `Ajapa` is selected.

Why it matters:

Contradictory validation breaks user trust. A user cannot know whether the form is valid, whether the field value was accepted, or whether the submit button will fail.

Recommended fix:

- Clear field-specific validation messages on input/change for that field.
- Revalidate derived playlist items whenever a linked custom play changes the item type or meditation type.
- Place validation messages directly below the field that currently fails, only while the current value is invalid.
- Add tests for stale validation clearing after entering playlist name, meditation type, linked custom play, and duration.

Concrete redesign suggestion:

- Use a compact inline error row: `Required` or `Choose a meditation type`.
- Add a top form summary only after submit, with links/focus to invalid fields.

### 6. Production UI exposes implementation terms and backend internals

Severity: High

Platform affected: Both

Evidence:

- `docs/review-artifacts/screenshots/ios/custom-plays/05-library-populated.png`
- `docs/review-artifacts/screenshots/web/custom-plays/05-phone-create-success-populated-library.png`
- `docs/review-artifacts/screenshots/web/home/02-phone-populated-home.png`
- `docs/review-artifacts/screenshots/web/settings/02-phone-settings-validation-error.png`
- Flow context: users see `linked media identifier`, `managed path`, `backend library`, `backend base URL`, and `1 change still need another sync attempt`.

Why it matters:

The product intent is serious, minimal, and peaceful. Technical copy makes the app feel like an operator console, not a trustworthy meditation companion. It also risks confusing non-technical users when media is unavailable or sync is pending.

Recommended fix:

- Replace implementation terms with user-centered status copy.
- Hide identifiers and file paths behind a developer diagnostics mode, if needed.
- Make sync copy calm and grammatically polished.

Concrete redesign suggestion:

- `1 change still need another sync attempt.` -> `1 change is waiting to sync.`
- `3 managed media sessions loaded from the backend library.` -> `3 recordings available.`
- `Linked media identifier: media-vipassana-sit-20` -> omit from normal UI.
- `Managed path: custom-plays/vipassana-sit-20.mp3` -> omit from normal UI.
- `Recording unavailable on this device. Start still runs the saved duration and bells.` -> `Recording unavailable here. You can still run this as a timed session with saved bells.`

### 7. Home and Practice compete with too many similarly prominent actions

Severity: Medium

Platform affected: Both

Evidence:

- `docs/review-artifacts/screenshots/ios/home/01-launch-home.png`
- `docs/review-artifacts/screenshots/web/home/02-phone-populated-home.png`
- `docs/review-artifacts/screenshots/web/meditation/04-phone-active-fixed-timer.png`
- `docs/review-artifacts/screenshots/ios/meditation/01-timer-setup.png`
- Flow context: Home exposes Start timer, Start last used meditation, favorite custom play, and favorite playlist close together. Web active timer also shows `Resume Active Timer` while already on the active timer view.

Why it matters:

The product goal is fast start. Multiple full-width or high-contrast actions create decision friction, especially when the difference between current default, last used, favorite custom play, and favorite playlist is subtle.

Recommended fix:

- On Home, make one primary action: start the most likely next practice.
- Secondary actions should be visually lighter and grouped under `Other starts` or a compact shortcut list.
- Remove `Resume Active Timer` from the active timer screen itself; reserve it for Home or Practice setup when the active session is not currently open.

Concrete redesign suggestion:

- Home primary card:
  - title: `Start Sahaj timer`
  - metadata: `20 min`
  - primary CTA: `Start`
  - secondary row: `Open Practice`, `Last used: QA Morning Sequence`
- Favorites below as compact rows with small `Start` buttons.

### 8. Goals/Sankalpa mobile screen is too long and dense for a primary phone journey

Severity: High

Platform affected: Web, likely Both

Evidence:

- `docs/review-artifacts/screenshots/web/goals/01-phone-summary-and-empty-goals.png`
- `docs/review-artifacts/screenshots/web/goals/08-phone-observance-goal-created.png`
- `docs/review-artifacts/screenshots/ios/goals/01-summary-and-goals.png`
- Flow context: web Goals stacks summaries, breakdowns, create form, active goals, observance week evidence, completed, expired, and archived sections into one long mobile page.

Why it matters:

Sankalpa is important but cognitively sensitive. Users need to know current progress and make today's check-in quickly. A long page makes the most frequent action, marking observance, compete with summary analytics and creation fields.

Recommended fix:

- Split mobile Goals into clear sections: `Progress`, `Check-ins`, `Create`, `Archived`.
- Keep summaries collapsed or behind a `View summary details` disclosure on phone.
- Move create sankalpa below active goals only when active goals exist, or into an explicit `New Sankalpa` action.
- Put today's observance check-in at the top of the active goal card.

Concrete redesign suggestion:

- Top of Goals on phone:
  - active goal summary
  - `Today: Pending` with `Observed` and `Missed` actions
  - progress bar
  - `Details` disclosure for week-by-week evidence

### 9. Empty, loading, error, and success states are unevenly captured and sometimes not actionable enough

Severity: Medium

Platform affected: Both

Evidence:

- Empty web Home: `docs/review-artifacts/screenshots/web/home/01-phone-empty-home.png`
- Empty web History filter: `docs/review-artifacts/screenshots/web/history/08-phone-history-filter-empty.png`
- Web success states: `docs/review-artifacts/screenshots/web/custom-plays/05-phone-create-success-populated-library.png`, `docs/review-artifacts/screenshots/web/history/04-phone-manual-log-success.png`, `docs/review-artifacts/screenshots/web/goals/05-phone-duration-goal-created.png`
- Missing loading evidence: execution report notes loading states were not observed.
- Native empty states missing: execution report notes native launched with seeded data.

Why it matters:

The app uses local-first and sync behavior, so state transitions are part of the trust model. Users need to know whether data is empty, loading, locally saved, pending sync, failed to sync, or restored from a cached snapshot.

Recommended fix:

- Add specific empty-state CTAs where useful, such as `Create custom play`, `Add manual log`, or `Start a timer`.
- Add skeleton or compact loading states for backend-backed summaries and media libraries, even if local loads are fast.
- Add a visual distinction between success toast, pending sync notice, and validation error.
- Capture these states explicitly in the next QA pass.

Concrete redesign suggestion:

- Use a shared `StateMessage` component with variants:
  - empty: calm outline, optional CTA
  - success: soft green, auto-dismiss when safe
  - warning/pending sync: soft amber, persistent until resolved
  - error: red text with retry

### 10. Visual hierarchy and accessibility polish are inconsistent

Severity: Medium

Platform affected: Both

Evidence:

- iPhone low-contrast cyan on pale buttons: `docs/review-artifacts/screenshots/ios/home/01-launch-home.png`, `docs/review-artifacts/screenshots/ios/custom-plays/05-library-populated.png`
- Large nested card density: `docs/review-artifacts/screenshots/web/goals/01-phone-summary-and-empty-goals.png`, `docs/review-artifacts/screenshots/web/custom-plays/05-phone-create-success-populated-library.png`
- Bottom nav covering content in iPhone captures: `docs/review-artifacts/screenshots/ios/home/01-launch-home.png`, `docs/review-artifacts/screenshots/ios/goals/01-summary-and-goals.png`
- Heavy type and all-caps labels on web: `docs/review-artifacts/screenshots/web/meditation/01-phone-timer-setup-default.png`

Why it matters:

The interface is readable, but visual weight is not always aligned with task priority. Oversized headings, nested cards, pale actions, and persistent nav overlap reduce polish and may affect users with low vision or motor constraints.

Recommended fix:

- Verify contrast for cyan text on pale cyan backgrounds and adjust to a darker teal or use filled primary buttons with white text.
- Reduce nested cards on web; use sections or dividers where a second framed container is not necessary.
- Use consistent button hierarchy: one filled primary, outline secondary, text/destructive tertiary.
- Add safe-area padding below scroll content on iPhone and web.

Concrete redesign suggestion:

- Keep rounded cards for repeated items and forms only.
- Make page sections unframed bands or simple vertical groups.
- Use smaller, clearer section headings and reserve large display type for screen titles.

## Cross-Platform UX Consistency Review

Confirmed inconsistencies:

- Primary destination naming differs: iPhone uses `Goals`, web uses `Sankalpa`. Evidence: `screenshots/ios/home/01-launch-home.png`, `screenshots/web/home/01-phone-empty-home.png`.
- Web exposes deeper management flows for custom plays and playlists than native. Evidence: web create/edit/favorite screenshots from `screenshots/web/custom-plays/02-phone-library-empty-form.png` through `screenshots/web/custom-plays/07-phone-favorite-toggled.png`; native Add is blocked in `screenshots/ios/custom-plays/06-create-form-unreachable-after-add.png`.
- Web exposes advanced timer and validation states; native capture only confirms the core fixed timer setup and runtime. Evidence: `screenshots/web/meditation/02-phone-timer-advanced-closed-open.png`, `screenshots/web/meditation/03-phone-interval-validation-error.png`, `screenshots/ios/meditation/01-timer-setup.png`.
- Web Goals includes deeper observance evidence and Gym Sankalpa interactions; native Goals capture confirms summary, create, archive, restore, and lower sections but not equivalent observance check-ins. Evidence: `screenshots/web/goals/08-phone-observance-goal-created.png`, `screenshots/web/goals/09-phone-observance-marked-observed.png`, `screenshots/ios/goals/01-summary-and-goals.png`.

Recommended alignment:

- Standardize navigation labels to Home, Practice, History, Goals, Settings.
- Keep platform conventions different where helpful: bottom tabs on iPhone, side nav on desktop web, bottom nav on web phone.
- Align domain vocabulary and state labels across both products: `manual log`, `session log`, `custom play`, `playlist`, `sankalpa`, `summary`, `favorite`, `recent`.
- Decide whether native iPhone is expected to support full create/edit parity now. If yes, native Add/create/edit should be release-blocking. If no, label native management features as not yet available and keep actions hidden until reachable.

## iPhone-Specific UX Review

Strengths:

- The iPhone timer setup is more platform-native than the web equivalent, with segmented fixed/open-ended selection, +/- steppers, and a focused active timer screen. Evidence: `screenshots/ios/meditation/01-timer-setup.png`, `screenshots/ios/meditation/02-active-fixed-timer.png`.
- End confirmation uses a native modal style that clearly slows down destructive action. Evidence: `screenshots/ios/meditation/04-end-timer-confirmation.png`.
- Home supports quick start, last-used, favorite custom play, and favorite playlist from one surface. Evidence: `screenshots/ios/home/01-launch-home.png`.

Issues:

- The local-only banner is too large and conflicts with navigation controls on library screens. Evidence: `screenshots/ios/custom-plays/05-library-populated.png`, `screenshots/ios/playlists/05-library-populated.png`.
- Library Add behavior is not reliable in the captured flow. Evidence: `screenshots/ios/custom-plays/06-create-form-unreachable-after-add.png`, `screenshots/ios/playlists/06-create-form-unreachable-after-add.png`.
- Custom play library rows expose too much detail for iPhone, including media identifiers and unavailable-media prose. Evidence: `screenshots/ios/custom-plays/05-library-populated.png`.
- The bottom tab bar visually covers lower content in long screenshots, especially Home favorite playlist content and Goals lower summaries. Evidence: `screenshots/ios/home/01-launch-home.png`, `screenshots/ios/goals/01-summary-and-goals.png`.
- Native validation evidence is incomplete for manual logs, custom plays, playlists, and advanced timer settings. Evidence: execution report notes native validation states were partial or unreachable.

Recommended iPhone priorities:

1. Fix Add/create reachability for custom plays and playlists.
2. Redesign the local-only banner so it never overlaps Back/Add.
3. Reduce technical detail in library rows.
4. Add bottom safe-area padding to long scroll views.
5. Capture native empty and validation states without seeded data.

## Web-Specific UX Review

Strengths:

- Web has broad functional coverage. Custom plays, playlists, timer setup, open-ended timer, manual logs, filters, summaries, observance goals, settings, and desktop layouts are all evidenced.
- Desktop layouts use extra width meaningfully, especially Home, Practice, Settings, and Goals. Evidence: `screenshots/web/responsive/01-desktop-home.png`, `screenshots/web/responsive/02-desktop-practice.png`, `screenshots/web/responsive/05-desktop-settings.png`.
- Validation messages are generally human-readable when they match current state. Evidence: `screenshots/web/meditation/03-phone-interval-validation-error.png`, `screenshots/web/history/03-phone-manual-log-validation-error.png`.

Issues:

- Mobile web captures show persistent nav/header/skip-link overlays intersecting content. Evidence: `screenshots/web/home/01-phone-empty-home.png`, `screenshots/web/meditation/02-phone-timer-advanced-closed-open.png`, `screenshots/web/settings/02-phone-settings-validation-error.png`.
- Some web pages are extremely tall on phone and require heavy scrolling for common tasks. Evidence: `screenshots/web/goals/01-phone-summary-and-empty-goals.png`, `screenshots/web/goals/08-phone-observance-goal-created.png`, `screenshots/web/custom-plays/05-phone-create-success-populated-library.png`.
- The web UI uses multiple nested cards, which makes boundaries visually noisy and reduces calmness. Evidence: `screenshots/web/goals/01-phone-summary-and-empty-goals.png`, `screenshots/web/playlists/03-phone-create-populated-form.png`.
- Stale validation appears on populated playlist fields. Evidence: `screenshots/web/playlists/03-phone-create-populated-form.png`.
- The active timer page includes a `Resume Active Timer` action while the user is already viewing the active timer. Evidence: `screenshots/web/meditation/04-phone-active-fixed-timer.png`.

Recommended web priorities:

1. Fix mobile fixed-layer padding and skip-link visibility.
2. Rename web nav `Sankalpa` to `Goals`.
3. Split or progressively disclose long Goals and management forms on phone.
4. Remove implementation language from normal UI.
5. Add stale-validation regression tests.

## Navigation And IA Review

Confirmed issues:

- Cross-platform primary nav label mismatch: `Goals` on iPhone, `Sankalpa` on web.
- Web Practice hides custom play and playlist management inside `Practice Tools`, which keeps timer setup focused but can make management less discoverable. Evidence: `screenshots/web/meditation/01-phone-timer-setup-default.png`, `screenshots/web/custom-plays/01-phone-tools-open-empty.png`.
- Native secondary navigation was fragile during capture, according to `execution-report.md`.
- Home contains many start paths without enough differentiation. Evidence: `screenshots/ios/home/01-launch-home.png`, `screenshots/web/home/02-phone-populated-home.png`.

Recommended IA:

- Keep the primary destination model stable: Home, Practice, History, Goals, Settings.
- Inside Practice, use a simple segmented or tabbed secondary model on management pages: `Timer`, `Custom Plays`, `Playlists`.
- Keep Home optimized for the next likely practice, not as a full launcher for every path.
- On Goals, separate active goal action from summary browsing.

## Forms And Validation Review

Confirmed issues:

- Playlist stale validation: `screenshots/web/playlists/03-phone-create-populated-form.png`.
- Native manual log invalid validation was not captured because defaults saved successfully. Evidence: `screenshots/ios/history/03-manual-log-validation.png` and execution report.
- Web forms are long on phone and sometimes require scrolling past fixed layers to submit. Evidence: `screenshots/web/custom-plays/02-phone-library-empty-form.png`, `screenshots/web/playlists/03-phone-create-populated-form.png`, `screenshots/web/goals/01-phone-summary-and-empty-goals.png`.
- Settings validation screenshot does not show enough visible red validation evidence near the current viewport, despite being indexed as validation. Evidence: `screenshots/web/settings/02-phone-settings-validation-error.png`.

Recommended form behavior:

- Clear field errors on change.
- On submit failure, scroll and focus the first invalid field.
- Keep error text immediately below the failing control.
- Use input constraints where possible: numeric min values, valid intervals, and disabled future observance changes.
- For long forms, place the submit button after the relevant form section and avoid a submit control being obscured by sticky nav.
- On iPhone, verify empty/default save states for manual log, custom play, playlist, and sankalpa creation.

## Empty, Loading, Error, And Success State Review

Confirmed:

- Web empty states exist for Home, custom plays, playlists, active sankalpas, completed, expired, archived, and empty history filters. Evidence: `screenshots/web/home/01-phone-empty-home.png`, `screenshots/web/custom-plays/02-phone-library-empty-form.png`, `screenshots/web/history/08-phone-history-filter-empty.png`, `screenshots/web/goals/01-phone-summary-and-empty-goals.png`.
- Success states exist but often appear as plain inline cards inside already long screens. Evidence: `screenshots/web/custom-plays/05-phone-create-success-populated-library.png`, `screenshots/web/history/04-phone-manual-log-success.png`, `screenshots/web/goals/05-phone-duration-goal-created.png`.
- Sync pending state is visible but awkwardly phrased. Evidence: `screenshots/web/home/02-phone-populated-home.png`, `screenshots/web/settings/02-phone-settings-validation-error.png`.

Missing evidence:

- Loading states were not observed in the QA pass.
- Native empty states were not captured because seeded data was used.
- Backend unavailable and offline pending-sync states were not fully captured across all relevant screens.

Recommended state model:

- Define a shared state-message language:
  - Empty: `No session logs yet. Start a timer or add a manual log.`
  - Pending sync: `1 change is waiting to sync.`
  - Backend unavailable: `Showing saved data. Sync will retry when the server is reachable.`
  - Success: `Manual log saved.`
  - Error: `Could not save. Retry.`
- Use success messages briefly and place persistent sync messages in the shell, not inside form content.
- Capture loading and unavailable-media states in the next review pass.

## Accessibility And Readability Review

Confirmed concerns:

- Cyan text on pale cyan buttons may not meet contrast requirements, especially on iPhone. Evidence: `screenshots/ios/home/01-launch-home.png`, `screenshots/ios/custom-plays/05-library-populated.png`.
- Large all-caps labels and heavy type create visual noise on web phone. Evidence: `screenshots/web/meditation/01-phone-timer-setup-default.png`.
- The skip link is visible and overlapping content in many web captures. Evidence: `screenshots/web/custom-plays/02-phone-library-empty-form.png`, `screenshots/web/goals/08-phone-observance-goal-created.png`.
- Bottom navigation overlap may block content or focusable controls on both web and iPhone captures. Evidence: `screenshots/web/playlists/03-phone-create-populated-form.png`, `screenshots/ios/home/01-launch-home.png`.

Recommended checks:

- Run automated contrast checks for all button states.
- Verify keyboard-only flow on web, especially skip link focus/blur behavior.
- Verify screen reader labels for icon-only or symbol-heavy controls such as playlist reorder arrows.
- Use visible text labels for critical icon controls unless the icon is universally understood and has accessible name support.
- Verify touch target size and spacing for clustered action buttons in iPhone custom play rows.

## Visual Polish And Production Readiness Review

The current UI is coherent enough for a prototype, but production readiness is held back by overlap, copy, and density.

Most production-impacting polish issues:

- Native banner overlap with navigation controls.
- Web mobile fixed layers and skip link appearing over content.
- Technical copy in user-facing screens.
- Inconsistent nav naming.
- Stale validation messages.
- Excessive nested cards and long forms on web phone.
- iPhone custom play rows are too verbose and action-heavy.
- Several QA-created logs show `0 min` or `< 1 min`, which makes summaries look less trustworthy in review artifacts.

Recommended production bar:

- No overlapping persistent UI layers at phone widths.
- No implementation identifiers or file paths in normal user flows.
- One primary action per card or screen section.
- Consistent nav labels and domain terms.
- Validation always matches current field state.
- Key flows pass with empty data and populated data.

## Quick Wins

1. Rename web primary nav from `Sankalpa` to `Goals`.
2. Change pending sync copy to `1 change is waiting to sync.`
3. Hide media IDs and file paths from custom play cards.
4. Add bottom padding to mobile scroll containers.
5. Fix skip link visibility so it appears only when focused and never blocks form controls after interaction.
6. Remove `Resume Active Timer` from the active timer screen.
7. Clear playlist validation on field change.
8. Shorten iPhone local-only banner copy.
9. Increase contrast of pale cyan button text or convert secondary actions to outline buttons.
10. Add native UI tests for custom play Add and playlist Add.

## Strategic Improvements

1. Rework Goals/Sankalpa on phone around the user's daily job: see active intent, mark today, review progress, then optionally inspect summary details.
2. Create a shared cross-platform content glossary for status, validation, sync, media unavailable, and destructive confirmations.
3. Introduce a shared state-message pattern for empty, loading, success, pending sync, backend unavailable, and error states.
4. Split web Practice management into clearer subroutes or tabs for Timer, Custom Plays, and Playlists while preserving Home quick start.
5. Build a parity matrix that distinguishes web-only, native-only, and expected shared behavior for custom play, playlist, observance, and sync flows.
6. Add screenshot capture variants for live viewport screenshots, not only full-page screenshots, to catch actual mobile overlap.

## Scores

Overall usability: 6/10

The main journeys exist, but native Add blockers, web overlap, dense mobile pages, and technical copy create significant friction.

Visual clarity: 6/10

The calm direction is clear, but hierarchy is weakened by oversized headings, nested cards, low-contrast secondary actions, and repeated status layers.

Navigation: 6/10

Primary destinations are present, but `Goals` vs `Sankalpa`, fragile native secondary navigation, and hidden management surfaces reduce confidence.

Consistency: 5/10

The mental model is similar across platforms, but naming, feature reachability, validation depth, and technical state language differ noticeably.

Accessibility: 5/10

Large text and touch targets help, but contrast, skip-link behavior, sticky overlap, and icon-control labeling need verification and fixes.

Mobile UX: 5/10

iPhone timer flow is promising, but management flow reachability and banner overlap are serious. Web phone is functional but too long and prone to fixed-layer obstruction.

Web UX: 6/10

Web has the broadest functional coverage and reasonable desktop adaptation, but mobile density, stale validation, and implementation-heavy copy limit polish.

Production readiness: 5/10

The app is feature-rich but not yet production-grade from a UX standpoint. The highest-priority fixes are layout integrity, native create flow reachability, validation correctness, and user-centered copy.
