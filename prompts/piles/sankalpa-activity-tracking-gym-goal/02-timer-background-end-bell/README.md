# Group 2: Timer Background End Bell

Group goal: Fix or materially improve the defect where the ending bell does not play if the app is not in focus, while staying honest about browser background execution limits.

Parent branch: `codex/integration-sankalpa-activity-tracking-gym-goal`

## Bundle Order

1. `timer-preserve-end-bell`
   - Diagnose the focus/background completion path and implement the narrow timer sound reliability fix.

## Thread Strategy

Run this group in one Codex thread. It has one focused bundle and is independent of the Sankalpa group.

## Reasoning Profiles

- Group execution: `group-orchestration`
- Bundle implementation and diagnosis: `bundle-implementation`
- Test and build command execution: `verification`
- Closeout/docs: `docs-and-cleanup`

## Required Verification

Run focused timer tests first, then:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

When practical, perform browser verification for a short timer with an end sound while switching focus away from the tab/window.
