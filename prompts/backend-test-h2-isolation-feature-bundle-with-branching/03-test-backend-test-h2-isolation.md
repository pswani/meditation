# 03 Test Backend Test H2 Isolation

Run the verification flow and capture results in `docs/test-backend-test-h2-isolation-feature.md`.

Required automated checks:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`
- `./scripts/pipeline.sh verify`

Evidence to capture in the test doc:
- which H2 URL or temp directory the backend tests used
- which runtime and H2 directories the verify smoke check used
- confirmation that the production-like file-backed H2 path was not touched by the automated flow

If anything fails, document it clearly and continue with `04-fix-backend-test-h2-isolation.md`.
