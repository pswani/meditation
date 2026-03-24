# UX Review: Custom Plays + Manual Session Logging + History Integration

## Scope reviewed
- `Practice` screen custom play management
- `History` screen manual log form and list integration
- unified history source/status badges
- responsive behavior across mobile, tablet, and desktop

## Review lens
- clarity
- calmness
- low friction
- validation completeness
- responsive usability

## Summary
The current slice is a solid functional baseline: key flows work, terminology is mostly consistent, and the visual direction remains calm. The strongest UX risks are destructive actions without safety rails, weak form feedback/labeling in a few places, and layout patterns that underuse tablet/desktop space while feeling crowded on long Practice pages.

## Findings

### Critical
1. Custom play deletion has no confirmation or undo.
- Friction/risk:
  - A single tap on `Delete` immediately removes a custom play with no recovery path.
  - This creates avoidable trust loss in a personal-practice app where presets are user-curated.
- Recommendation:
  - Add a confirmation step (`Cancel` / `Delete custom play`) or lightweight undo snackbar.
  - Keep delete visually secondary and separated from frequent actions.

2. Manual log form does not provide clear submit-success feedback.
- Friction/risk:
  - After `Save Manual Log`, the form resets but no explicit success state appears.
  - Users can be unsure whether the entry was saved, especially when the list is long.
- Recommendation:
  - Show a brief, calm success banner inline (for example: `Manual log saved to history`).
  - Optionally scroll/focus to the newly added entry or highlight it briefly.

### Important
1. Practice screen has duplicate field labels (`Meditation type`, `Duration`) across timer setup and custom play form.
- Friction:
  - In one screen, repeated labels increase cognitive load and weaken accessibility clarity.
  - It is harder to parse which form is being edited on smaller screens.
- Recommendation:
  - Add clearer section-level labeling and field wording for custom play form, for example:
    - `Custom play meditation type`
    - `Custom play duration (minutes)`
  - Keep wording concise and consistent with product terminology.

2. Custom play action hierarchy is management-heavy and misses a primary use action.
- Friction:
  - `Edit`, `Favorite`, and `Delete` exist, but there is no direct `Use custom play` action to prefill timer setup.
  - This breaks user expectation that custom plays reduce setup effort.
- Recommendation:
  - Add `Use custom play` as the primary action per row, with management actions secondary.
  - Prefill timer setup fields when selected.

3. Manual log timestamp field lacks contextual guidance.
- Friction:
  - `Session timestamp` gives no timezone/context hint and no helper text.
  - Users logging earlier sessions may hesitate about expected format/meaning.
- Recommendation:
  - Add helper text (for example: `Use your local date and time when the session ended`).
  - Preserve current sensible default, but make intent explicit.

4. Tablet/desktop layout underuses available width for list readability.
- Friction:
  - History rows remain mostly stacked and custom play rows are narrow cards with wrapped actions.
  - Desktop scan speed is lower than necessary.
- Recommendation:
  - On medium/large screens, give list items a clearer two-zone layout:
    - left: title + metadata
    - right: badges + actions
  - Keep spacing generous and avoid dense table styling.

### Nice to have
1. Add lightweight filtering in history for `source` and `status`.
2. Add favorite-first sorting toggle in custom plays for faster recall.
3. Improve empty-state guidance with contextual microcopy (for example: suggest creating a first custom play after first completed session).

## Prioritized UX improvement list

### Critical
1. Add delete confirmation/undo for custom play deletion.
2. Add explicit success feedback after saving manual log.

### Important
1. Clarify duplicate field labels across timer setup and custom play forms.
2. Add `Use custom play` action to prefill timer setup.
3. Add helper text/context for manual log timestamp.
4. Improve list/action layout for tablet and desktop readability.

### Nice to have
1. Add history filters by `source` and `status`.
2. Add favorite-first sorting option in custom plays.
3. Improve contextual empty-state guidance.
