# Backend Test H2 Isolation Verification

Date: 2026-04-17

## Required commands

- `npm run typecheck`: pass
- `npm run lint`: pass
- `npm run test`: pass, 47 files and 338 tests
- `npm run build`: pass
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`: pass, 60 backend tests
- `./scripts/pipeline.sh verify`: pass

## H2 and runtime evidence

- Focused backend config test:
  - `mvn -Dmaven.repo.local=../local-data/m2 -Dtest=DefaultRuntimeConfigurationTest,TestRuntimeIsolationConfigurationTest test`: pass
  - `TestRuntimeIsolationConfigurationTest` logged an in-memory datasource URL shaped like `jdbc:h2:mem:meditation-test-b42d60ff-e562-49c2-9fbd-c3e1a3baea64`
- Full backend Maven verify:
  - controller and service tests logged in-memory datasource URLs shaped like `jdbc:h2:mem:meditation-test-6dfdaba9-7d52-4a45-92d9-1b7b83174d54`
  - Spring embedded repository tests also stayed in memory with URLs shaped like `jdbc:h2:mem:589fb648-ac4b-4894-b07a-b17b990f362d`
  - no backend test log in the automated flow referenced `jdbc:h2:file:`
- Unified verify smoke check:
  - runtime dir: `/var/folders/qs/xz6stp6x53z0d1467g07w9280000gn/T/meditation-verify-runtime.Z1oowD`
  - H2 dir: `/var/folders/qs/xz6stp6x53z0d1467g07w9280000gn/T/meditation-verify-h2.SjD6EV`
  - media root: `/var/folders/qs/xz6stp6x53z0d1467g07w9280000gn/T/meditation-verify-media.T3Wv6Y`
  - health endpoint: `http://127.0.0.1:18080/api/health`
  - the script cleaned those temp directories after the smoke check; an immediate `ls` against them returned `No such file or directory`

## Persistent H2 path check

- `local-data/h2` existed before the final verify run with:
  - `meditation.mv.db`
  - `meditation-prompt04.mv.db`
  - `meditation-prompt04.trace.db`
  - `meditation-prompt05.mv.db`
- The recorded mtimes before `./scripts/pipeline.sh verify` were:
  - `1775081931 local-data/h2`
  - `1775081950 local-data/h2/meditation.mv.db`
  - `1774637562 local-data/h2/meditation-prompt04.mv.db`
  - `1774637460 local-data/h2/meditation-prompt04.trace.db`
  - `1775017301 local-data/h2/meditation-prompt05.mv.db`
- The recorded mtimes after `./scripts/pipeline.sh verify` were identical:
  - `1775081931 local-data/h2`
  - `1775081950 local-data/h2/meditation.mv.db`
  - `1774637562 local-data/h2/meditation-prompt04.mv.db`
  - `1774637460 local-data/h2/meditation-prompt04.trace.db`
  - `1775017301 local-data/h2/meditation-prompt05.mv.db`
- Conclusion: the automated verification flow did not touch the production-like file-backed H2 path under `local-data/h2`.

## Residual risk

- The opt-in native live-backend integration path is still user-directed by `MEDITATION_NATIVE_LIVE_SYNC_BASE_URL`; it now has clearer documentation to use an explicit non-production backend runtime, but that path remains a manual operator choice rather than an enforced repository default.
