# 01 Implement Backend Test H2 Isolation

Implement a bounded test-runtime hardening slice so verification does not write to the production H2 database.

Execution requirements:
- Keep one active ExecPlan at `docs/execplan-backend-test-h2-isolation-feature.md`.
- Audit the current backend test profile, quality-gate scripts, and any live integration paths that could write to a persistent H2 location.
- Prefer in-memory H2 for tests and disposable temp directories for smoke checks and local verification.
- Preserve production runtime defaults in `backend/src/main/resources/application.yml` unless the repo docs clearly justify a safe change.

Likely files:
- `backend/src/main/resources/application.yml`
- `backend/src/test/resources/application-test.yml`
- `backend/pom.xml`
- `scripts/pipeline.sh`
- `scripts/common.sh`
- `README.md`
- `docs/ios-native/README.md`
- focused backend configuration tests under `backend/src/test/java/com/meditation/backend/config/`

Acceptance targets:
- Automated tests default to isolated in-memory or disposable H2 storage rather than the production-like file-backed database.
- The main repo verify path documents and enforces safe disposable runtime directories.
- Any opt-in live integration path requires explicit non-production configuration or clearly skips when that safety is absent.
- Contributor docs clearly explain the safe testing flow.

Required follow-through:
- Add or update focused configuration tests where practical.
- Update durable docs, including `requirements/session-handoff.md`.
- Update `requirements/decisions.md` if a long-lived testing-policy decision changes.

Do not absorb:
- feature work unrelated to test isolation
- native UI defect fixes
- broader production deployment refactors

When implementation is stable, continue with `02-review-backend-test-h2-isolation.md`.
