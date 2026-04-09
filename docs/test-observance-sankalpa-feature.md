# Test Report: Observance Sankalpa Feature

## Automated verification
- `npm run typecheck`: pass
- `npm run lint`: pass
- `npm run test`: pass with 47 files and 327 tests
- `npm run build`: pass
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`: pass with 50 backend tests

## Focused checks
- Existing duration-based and session-count-based sankalpa regressions: pass
- Observance sankalpa creation with required label and scheduled-day target: pass
- Per-date observance status normalization and local round-trip: pass
- Future-date observance controls stay non-editable in Goals UI: pass
- Observance progress across observed, missed, pending, active, and archived paths: pass
- Home snapshot rendering for an observance-based top active sankalpa: pass
- Backend persistence and validation for observance records within the goal window: pass

## Residual risk
- A manual browser check in a non-default time zone would add confidence that the observance date-window presentation remains intuitive when the browser zone differs from the machine default used in automated tests.
