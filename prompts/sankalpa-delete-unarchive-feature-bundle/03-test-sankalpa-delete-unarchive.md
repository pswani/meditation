# 03-test-sankalpa-delete-unarchive.md

## Goal
Execute verification for the `sankalpa` delete and unarchive slice.

## Automated checks
Run and report:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/` if backend code changed

## Focused behavior checks
1. Delete flow
- destructive confirmation required
- intended delete states behave correctly
- deleted `sankalpa` items do not linger in local or backend-backed views

2. Unarchive flow
- archived `sankalpa` items can be restored
- restored state matches goal-window rules
- progress remains trustworthy after restoration

3. Persistence and sync
- offline/local-first behavior stays calm
- queue replay or backend refresh does not resurrect stale deleted state

## Report format
For every check:
- status (pass/fail/warn)
- exact command/check
- concise result

Capture environment limitations explicitly.
