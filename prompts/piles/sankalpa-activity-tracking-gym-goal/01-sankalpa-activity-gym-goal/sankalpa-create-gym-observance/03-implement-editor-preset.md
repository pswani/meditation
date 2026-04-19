# Implement: Editor Preset

Use the `bundle-implementation` reasoning profile and the `ux-designer` skill.

## Objective

Make creating "Gym, 5 times a week for 4 weeks" possible from the Sankalpa editor without adding clutter.

## UX Requirements

- Keep the screen titled and framed as `Sankalpa`.
- Treat gym tracking as an observance-style sankalpa.
- Use calm copy and progressive disclosure.
- Provide a path that auto-populates:
  - observance label or title: `Gym`
  - weekly observed days: `5`
  - weeks: `4`
  - derived days/window: `28`
- Keep all populated details editable before save.
- Do not imply gym observance comes from meditation `session log` entries.
- Keep phone layout single-column and touch-friendly; use larger widths without making a dashboard.

## Likely Files

- `src/features/sankalpa/SankalpaEditor.tsx`
- `src/features/sankalpa/sankalpaPageHelpers.ts`
- `src/pages/SankalpaPage.tsx`
- relevant tests in `src/pages/SankalpaPage.test.tsx`

## Tests

Add or update tests proving the user can select or start from the gym path, edit generated details, save the sankalpa, and see the resulting goal represented with existing Sankalpa terminology.
