# Production Reference Cleanup Test Report

Date: 2026-04-05
Branch: `codex/production-reference-cleanup-feature-bundle-with-branching`

## Automated verification

- `./scripts/pipeline.sh verify`: PASS
  - `npm run typecheck`: PASS
  - `npm run lint`: PASS
  - `npm run test`: PASS with 46 files and 318 tests
  - `npm run build`: PASS
  - `mvn -Dmaven.repo.local=../local-data/m2 verify`: PASS with 48 backend tests
  - temporary backend smoke at `http://127.0.0.1:18080/api/health`: PASS

## Focused checks

- Shared reference-data behavior across frontend guards and validators: PASS
  - frontend shared values covered by [referenceData.test.ts](/Users/prashantwani/wrk/meditation/src/types/referenceData.test.ts)
  - backend seed alignment covered by [ReferenceDataSeedTest.java](/Users/prashantwani/wrk/meditation/backend/src/test/java/com/meditation/backend/reference/ReferenceDataSeedTest.java)
- Remaining Vite config is the only authoritative config file: PASS
  - [vite.config.ts](/Users/prashantwani/wrk/meditation/vite.config.ts) present
  - root `vite.config.js` absent after a fresh verify run
- Durable docs now match the checked-in Vite and verify behavior: PASS
  - [README.md](/Users/prashantwani/wrk/meditation/README.md)
  - [docs/architecture.md](/Users/prashantwani/wrk/meditation/docs/architecture.md)
  - [requirements/decisions.md](/Users/prashantwani/wrk/meditation/requirements/decisions.md)
- Generated artifacts are no longer recreated in the repo root after verification: PASS
  - `vite.config.js` absent
  - `vite.config.d.ts` absent
  - `tsconfig.node.tsbuildinfo` absent
- Unified verify path is documented accurately and rerunnable: PASS

## Residual risk

- Local Vite development still proxies `/api` only, so backend-served `/media/**` behavior remains a separate manual validation concern outside this cleanup bundle’s scope.
