# 03-test-custom-play-media-library.md

## Goal
Execute verification for the custom-play media library slice.

## Automated checks
Run and report:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`

## Focused behavior checks
1. Media library management
- new managed media items can be registered
- metadata and relative-path validation behave correctly

2. Frontend integration
- `custom play` create/edit flows can select managed media
- empty/loading/error states remain usable

3. Runtime integrity
- existing saved `custom play` references still resolve correctly or fail clearly
- playlist/runtime guardrails still hold when recording-backed items are used

## Report format
For every check:
- status (pass/fail/warn)
- exact command/check
- concise result

Capture environment limitations explicitly.
