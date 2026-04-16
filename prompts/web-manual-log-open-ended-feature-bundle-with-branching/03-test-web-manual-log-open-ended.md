# 03 Test Web Manual Log Open-Ended Support

Run the verification flow and capture results in `docs/test-web-manual-log-open-ended-feature.md`.

Required automated checks:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/` if the backend manual-log contract changed

Manual checks to document if practical:
- create an open-ended manual log from the web History screen
- confirm the saved entry shows the open-ended badge and calm duration copy
- confirm fixed-duration manual logging still works
- if backend or offline sync changed, confirm the entry survives refresh and reconciliation

If anything fails, document it clearly and continue with `04-fix-web-manual-log-open-ended.md`.
