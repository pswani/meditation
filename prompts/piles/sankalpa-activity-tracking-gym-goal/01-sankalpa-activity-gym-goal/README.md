# Group 1: Sankalpa Activity Gym Goal

Group goal: Extend the existing Sankalpa product area so active sankalpas show calm daily activity evidence and the user can create a gym observance sankalpa for 5 times per week over 4 weeks.

Parent branch: `codex/integration-sankalpa-activity-tracking-gym-goal`

## Bundle Order

1. `sankalpa-create-gym-observance`
   - Add the narrow product/model/editor path needed for weekly observance sankalpas such as gym 5 times per week for 4 weeks.
2. `sankalpa-track-daily-activity`
   - Improve the active sankalpa tracking presentation so daily observed, missed, and pending activity is easy to audit without dashboard clutter.

## Thread Strategy

Run this group in one Codex thread. The second bundle depends on the Sankalpa shape clarified by the first bundle, and both benefit from shared UX and model context.

## Reasoning Profiles

- Group execution: `group-orchestration`
- Bundle implementation: `bundle-implementation`
- Review and diagnosis: `group-orchestration` or `bundle-implementation`
- Test and build command execution: `verification`
- Closeout and docs cleanup: `docs-and-cleanup`

## Required Verification

Run focused tests as each bundle requires, then consolidate with:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

If backend Sankalpa schema/API code changes, also run the relevant backend tests or the repo pipeline:

```bash
./scripts/pipeline.sh verify
```

Use browser verification for the Goals screen when UI behavior changes.
