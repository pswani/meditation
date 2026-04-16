# 03 Test Sankalpa Threshold And Frequency Goals

Run the cross-stack verification flow and write `docs/test-sankalpa-threshold-frequency-goals-feature.md`.

Required automated checks:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`

Manual checks to document if practical:
- create a duration-based recurring goal that matches the example shape
- create a session-count recurring goal
- verify qualifying and non-qualifying `session log` history changes progress the way the UI claims
- verify archived, completed, and expired states remain trustworthy

If anything fails, document it clearly and continue with `04-fix-sankalpa-threshold-frequency-goals.md`.
