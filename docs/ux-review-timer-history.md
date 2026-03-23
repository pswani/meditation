# UX Review: Timer + Active Timer + History

## Scope reviewed
- `Practice / Timer Setup`
- `Active Timer`
- `History`
- responsive behavior across mobile, tablet, and desktop

## Review lens
- clarity
- calmness
- low friction
- validation completeness
- responsive usability

## Summary
The current vertical slice is a strong functional baseline with clean visual direction and clear `history` status distinction. The main UX risks are accidental session interruption, configuration clarity for sounds/interval bells, and hierarchy/readability gaps in `Active Timer` and `history`.

## Findings

### Critical
1. `End Early` has no confirmation step.
- Friction/risk:
  - A single accidental tap immediately ends the session and creates an `auto log` with status `ended early`.
  - This conflicts with the calm, trust-preserving expectation for timer flow.
- Recommendation:
  - Add a confirmation modal/sheet for ending early with clear choices:
    - `Continue Session`
    - `End Early`
  - Keep `End Early` visually secondary and require explicit confirmation.

2. Timer configuration is missing a clear advanced grouping and interval-sound control.
- Friction/risk:
  - Optional sound controls are always visible instead of being grouped.
  - `interval bell` behavior is configurable by frequency, but interval sound choice is not explicit, which can feel incomplete/confusing.
- Recommendation:
  - Group optional controls under an `Advanced` section.
  - Keep advanced section collapsed by default.
  - Add explicit interval sound selector from fixed mock options when interval bells are enabled.

### Important
1. Validation messaging appears too early for first-time setup.
- Friction:
  - `Meditation type is required` can appear before user intent to submit, which raises cognitive load.
- Recommendation:
  - Use progressive validation:
    - show hard errors after `Start Session` attempt or field touch
    - keep calm helper text before that.

2. Active Timer hierarchy is not explicit enough in paused/completion moments.
- Friction:
  - Paused state relies mostly on button label change.
  - Completion card copy uses raw status wording (`Session ended early`) with minimal context hierarchy.
- Recommendation:
  - Add explicit paused badge/text (`Paused`) near timer clock.
  - Improve completion hierarchy:
    - strong title (`Session Completed` / `Session Ended Early`)
    - secondary line with completed duration and `auto log` confirmation.

3. `History` readability is acceptable on phone but under-uses tablet/desktop width.
- Friction:
  - Metadata is fully stacked, which reduces scan speed on larger screens.
  - Timestamp is visually similar to supporting metadata.
- Recommendation:
  - On medium/large screens, use a light two-column metadata grid.
  - Elevate ended-at timestamp and keep secondary metadata muted.

4. Empty-state actionability in `history` is weak.
- Friction:
  - Empty state explains what to do, but no direct action.
- Recommendation:
  - Add a direct CTA: `Start Session` linking to `Practice / Timer Setup`.

### Nice to have
1. Add simple duration presets (`10`, `20`, `30`) to reduce input friction.
2. Add subtle session progress context on `Active Timer` (elapsed vs total) without visual clutter.
3. Group `history` by relative date sections (`Today`, `Earlier`) for faster scanning.

## Prioritized UX improvement list

### Critical
1. Add `End Early` confirmation flow.
2. Introduce `Advanced` grouping and explicit interval sound selector.

### Important
1. Shift to progressive validation display for setup errors.
2. Strengthen paused/completion hierarchy on `Active Timer`.
3. Improve `history` readability on tablet/desktop.
4. Add actionable empty-state CTA in `history`.

### Nice to have
1. Duration presets.
2. Lightweight elapsed/total context.
3. Relative date grouping in `history`.
