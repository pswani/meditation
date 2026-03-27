# Review: Release Hardening

## Scope reviewed
- usability across the implemented app shell and primary flows
- frontend code quality, maintainability, and performance-sensitive patterns
- backend hygiene and REST boundary quality
- testing quality and verification coverage
- deployment and README clarity for local release-candidate use

## Critical issues
- None identified in this review pass.

## Important issues
- `TimerContext` has become the main change-risk hotspot and now carries avoidable performance overhead in the same file.
  - Affected files:
    - `src/features/timer/TimerContext.tsx`
  - Why it matters:
    - the file is now roughly 1800 lines and owns timer runtime, playlist runtime, timer settings hydration, `session log` hydration, `custom play` CRUD/sync, playlist CRUD/sync, offline queue replay, and recovery messaging in one place
    - the per-entity hydration flows are near-duplicates, which raises regression risk whenever one branch changes and the others need to stay behaviorally aligned
    - the current implementation repeatedly builds JSON-stringified hydration keys and uses `JSON.stringify` collection equality checks for `session log`, `custom play`, and playlist state, which adds unnecessary serialization work on every hydration/sync cycle
- Local media setup guidance is inconsistent with the helper scripts and backend defaults, which makes release verification harder than it should be.
  - Affected files:
    - `README.md`
    - `scripts/common.sh`
    - `backend/src/main/resources/application.yml`
  - Why it matters:
    - the README says `npm run media:setup` prepares `public/media/custom-plays/`
    - the backend serves media from `../local-data/media/custom-plays` by default
    - an operator following only the README can place media files in the wrong directory, then see missing backend-served files during full-stack or LAN verification even though setup appeared to succeed

## Nice-to-have issues
- Release verification still depends almost entirely on unit/integration coverage; there is no browser-level smoke or end-to-end harness checked into the repo yet.
  - Affected files:
    - `package.json`
  - Why it matters:
    - current tests give good load-bearing coverage for domain helpers, route flows, and backend controllers
    - but there is still no single automated path that proves router navigation, frontend/backend connectivity, media paths, and calm degraded states together in a browser session
- Backend verification is clean but still noisy because Maven logs emit a Flyway warning about the current H2 version during `test` and `verify`.
  - Affected files:
    - `backend/pom.xml`
  - Why it matters:
    - the build passes today, so this is not a blocker
    - but repeated version-compatibility warnings reduce operator confidence during release-candidate verification and make real startup issues easier to miss in logs

## Overall assessment
The application is close to release-candidate quality for local full-stack use:

- `npm run typecheck` passed
- `npm run lint` passed
- `npm run test` passed
- `npm run build` passed
- `mvn -Dmaven.repo.local=../local-data/m2 test` passed
- `mvn -Dmaven.repo.local=../local-data/m2 verify` passed

The next remediation pass should stay tightly focused on the two important issues above so the milestone reduces change risk and setup ambiguity before deeper accessibility and end-to-end verification work.

## Recommended next prompt
- `prompts/milestone-e-hardening-release/02-remediate-code-quality-performance-hygiene.md`
