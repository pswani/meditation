# Pile Brief: Sankalpa Activity Tracking Gym Goal

Pile name: `sankalpa-activity-tracking-gym-goal`

Integration branch: `codex/integration-sankalpa-activity-tracking-gym-goal`

## Objective

Generate and execute a staged Pile -> Group -> Bundle workflow for Sankalpa feature enhancements and one timer sound defect. Do not implement features during pile planning.

## Feature Enhancements

1. On the Sankalpa screen/page, under active sankalpas, show tracking of activities for a given sankalpa. The tracking may be presented in calendar form or daily listing form. Analyze which presentation is calmer and more useful for the current app. The result should help the user understand daily progress and missed, pending, or observed activity for the sankalpa without creating dashboard clutter.
2. For creating sankalpas, support creating a sankalpa for going to the gym 5 times a week for 4 weeks. If this is not possible with the current model, think through the necessary product and implementation enhancement. It is acceptable if this is accomplished by adding a free-form title to the goal, with goal details auto-populated and editable by the user.

## Defect

1. The ending bell does not play if the app is not in focus.

## Product Constraints

- Keep this within the Sankalpa product area. Do not create a separate habit tracker.
- Preserve the terms `sankalpa`, `session log`, `summary`, and existing domain language.
- Keep the UX calm, minimal, and responsive across phone, tablet, laptop, and desktop.
- Prefer progressive disclosure over dashboard clutter.
- Treat gym tracking as an observance-style sankalpa if that fits the current model.
- Manual logs should not be confused with gym observance unless the design explicitly connects them.
- If model changes are needed, keep them narrow, local-first, and backend-aware.
- Update durable docs where behavior or workflow changes.
- Include focused tests for validation and state/domain logic where practical.

## Planning Output

- `README.md` for this pile.
- This `pile-brief.md`.
- One or more coherent groups.
- Domain-use-case bundle folders.
- Consolidated group review, test, build, and closeout prompts after bundles.
- Reasoning-effort guidance from `prompts/reasoning-effort-profiles.md`.
- Exact group prompts and `scripts/codex/run-group.sh` commands.
