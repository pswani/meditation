Read before doing anything else:
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/intent.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

Task:
- Create a dedicated feature branch for the observance-based sankalpa slice.
- Default branch name: `codex/observance-sankalpa-feature-bundle-with-branching`

Scope for this bundle:
- add an `observance-based` sankalpa mode for non-meditation observances
- support manual per-date marking for observed or missed dates
- preserve the existing meditation-derived sankalpa flows
- keep the Goals experience calm and responsive across phone, tablet, and desktop

Explicitly out of scope:
- unrelated timer, playlist, custom-play, or summary redesign work
- reminders, notifications, or journaling for observance dates
- arbitrary non-contiguous date scheduling

Branching instructions:
1. Confirm the current branch is a safe parent for this bounded slice.
2. Create and switch to `codex/observance-sankalpa-feature-bundle-with-branching`.
3. Do not change production code in this step.

Output expectations:
- Report the parent branch used.
- Report the created branch name.
- Stop after branch creation so the next prompt can drive implementation.
