# Implement: Active Tracking UI

Use the `bundle-implementation` reasoning profile.

## Objective

Improve active sankalpa cards so the user can understand daily activity and missed, pending, or observed states for the given sankalpa without clutter.

## Likely Files

- `src/features/sankalpa/ObservanceTracker.tsx`
- `src/features/sankalpa/SankalpaSection.tsx`
- `src/features/sankalpa/sankalpaPageHelpers.ts`
- `src/pages/SankalpaPage.tsx`
- shared CSS in the current app stylesheet

## Requirements

- Show activity tracking under active sankalpas where it is most relevant.
- Keep completed, expired, and archived presentations readable but less action-forward.
- Support ordinary observance goals and weekly gym-style observance goals.
- Keep future dates visible but non-editable.
- Use visible text labels for state; do not rely on color alone.
- Prefer progressive disclosure for longer windows, such as showing the current week first with a calm way to reveal more.
- Preserve keyboard and screen-reader usability for status controls.
- Avoid putting cards inside cards.

## Tests

Add or update tests for the active tracking UI, including accessible labels and future-date disabled behavior.
