# UX Review: Home + Settings

## Scope reviewed
- `Home` screen (`/`)
- `Settings` screen (`/settings`)
- integration with current responsive app shell (mobile bottom nav + tablet/desktop sidebar)
- behavior on mobile, tablet, and desktop

## Review lens
- calmness and hierarchy
- action clarity
- usefulness of surfaced content
- responsive scanability
- information density
- empty-state guidance
- terminology consistency

## Summary
Home and Settings are now clearly beyond placeholders and function as a usable prototype slice. Core actions exist and persistence behavior is meaningful. The main UX gaps are around quick-start failure clarity, missing sankalpa snapshot context on Home, and responsive information grouping refinement (especially tablet/desktop scanability and mobile compactness in shortcut rows).

## Findings

### Critical
1. Quick-start failure guidance is not visible in practice use.
- Context:
  - In Home quick start, failure sets local feedback then immediately navigates to Practice.
  - The Home feedback does not remain visible once route changes.
- Risk:
  - Users can feel the primary action failed without clear reason or next step.
- Recommendation:
  - Keep user on Home and show actionable inline guidance, or
  - pass an explicit message state to Practice and render a clear entry status banner there.

### Important
1. Home is missing a sankalpa snapshot despite Home inventory/product intent.
- Context:
  - Home currently shows quick start, today, recent, favorites, next actions.
  - No current sankalpa progress summary is surfaced.
- Risk:
  - Daily intent loop is weaker; users must context switch to Sankalpa to check progress.
- Recommendation:
  - Add a lightweight active sankalpa snapshot block (top active item + progress + direct link).

2. Home section hierarchy is functional but primary path competes with utility links.
- Context:
  - `Next Actions` duplicates shell navigation and competes with higher-value content.
- Risk:
  - Visual noise and reduced emphasis on the most relevant action chain.
- Recommendation:
  - De-emphasize or simplify `Next Actions` (fewer buttons, contextualized actions only).

3. Settings does not communicate unsaved edits state.
- Context:
  - Users can edit many fields; save is explicit.
  - No “unsaved changes” cue or disabled/enabled save state.
- Risk:
  - Uncertainty about whether a change was applied.
- Recommendation:
  - Add a simple dirty-state cue and disable `Save Defaults` until changes exist.

4. Mobile shortcut rows can become cramped with long names.
- Context:
  - Favorite rows are horizontal (`name + button`) and can compress text.
- Risk:
  - Truncation pressure and harder scanability on narrow phones.
- Recommendation:
  - Add text wrapping/truncation strategy and preserve button touch target.

### Nice to have
1. Add relative-time helper in Home recent activity.
- `2h ago` style secondary timestamp can improve quick scan while retaining full timestamp.

2. Add minor grouping polish on tablet/desktop.
- Consider 2-column composition for selected Home sections to reduce long vertical scroll while staying calm.

3. Add a subtle “last saved” indicator in Settings.
- Useful confirmation without adding noisy toasts.

## Specific review comments

### Home
- Positive:
  - Good foundational structure; sections are meaningful and data-backed.
  - Empty states are practical and point to useful next actions.
- Needs improvement:
  - Quick-start failure handling clarity (critical).
  - Missing sankalpa snapshot (important).
  - Reduce duplicate-action density (`Next Actions`) (important).

### Settings
- Positive:
  - Functional defaults coverage is appropriate for prototype scope.
  - Save + reset actions are clear and predictable.
- Needs improvement:
  - Unsaved-changes affordance is missing (important).
  - Could improve post-save confidence with subtle persistence cue (nice to have).

### Navigation/shell integration
- Positive:
  - Home and Settings are wired correctly and discoverable in both nav modes.
  - Terminology in nav labels is consistent with product language.
- Needs improvement:
  - Home internal `Next Actions` redundantly mirrors shell destinations; simplify to reduce cognitive load.

### Mobile layout
- Positive:
  - Panels and form controls remain touch-friendly.
  - Vertical rhythm is generally calm.
- Needs improvement:
  - Favorite shortcut rows need stronger long-text handling to avoid cramped composition.

### Tablet layout
- Positive:
  - Sidebar navigation improves wayfinding.
  - Home summaries/favorites gain structure with grid usage.
- Needs improvement:
  - Home still reads as mostly long stacked cards; selective two-column grouping could improve scanability.

### Desktop layout
- Positive:
  - Calm visual tone is preserved; no dashboard overload.
  - Settings remains readable with clear sectioning.
- Needs improvement:
  - Some Home sections feel sparse/wide; modest width-aware grouping could improve hierarchy.
