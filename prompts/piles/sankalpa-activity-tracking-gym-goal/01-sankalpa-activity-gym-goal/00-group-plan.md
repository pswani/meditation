# Group Plan: Sankalpa Activity Gym Goal

## Scope

Implement the Sankalpa work only:

- Support a gym-style observance sankalpa for 5 observed days per week over 4 weeks.
- Keep the work inside the existing `sankalpa` product area and Goals screen.
- Improve active sankalpa activity tracking so observed, missed, and pending states are visible in a calm, minimal way.
- Keep local-first persistence, backend contracts, and offline queue behavior aligned if the model changes.
- Update durable product, architecture, UX, and current-state docs when behavior changes.

Explicit exclusions:

- Do not create a separate habit tracker.
- Do not make Home into a dashboard.
- Do not connect manual `session log` entries to gym observance unless a prompt explicitly designs that link.
- Do not widen unrelated timer, playlist, custom play, summary, or History behavior.

## Current-State Notes

The current app already has:

- `observance-based` sankalpas with per-date `observed`, `missed`, and derived `pending` states.
- `qualifyingDaysPerWeek` for meditation-derived recurring weekly cadence goals.
- No separate free-form `title` field on `SankalpaGoal`; `observanceLabel` currently names observance goals.
- A compact `ObservanceTracker` rendered inside `SankalpaSection` for observance goals.

The likely narrow model enhancement is to allow observance goals to use weekly cadence semantics, for example "Gym" observed at least 5 days per week for 4 weeks. Validate this during implementation before changing data contracts.

## UX Direction

Use the `ux-designer` skill for the Sankalpa UX decisions.

Starting hypothesis: for this app, a daily listing grouped by week is calmer and more useful than a full calendar grid inside every active sankalpa card. A calendar can look dense, compete with summaries, and consume too much phone space. The implementation should still analyze the option before committing and document the decision in durable UX docs if behavior changes.

## Risks

- Observance weekly cadence may require contract, backend schema, cache migration, and sync queue updates.
- Adding a separate `title` may duplicate `observanceLabel`; only introduce it if it removes real ambiguity.
- Active sankalpa cards could become visually noisy if every day is shown uncollapsed for long windows.
- Future-date check-ins must remain locked until their date arrives.

## Bundle Dependencies

1. `sankalpa-create-gym-observance` defines and implements the model/editor path.
2. `sankalpa-track-daily-activity` builds on the resulting progress shape and presentation rules.

## Shared Verification Gates

Use focused tests for:

- Sankalpa draft validation.
- Goal creation/update normalization.
- Progress derivation for observance weekly cadence.
- Backend API and migration behavior if changed.
- Active Goals UI behavior and accessible labels.

Then run the group verification listed in `README.md`.
