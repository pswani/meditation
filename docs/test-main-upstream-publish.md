# Test Report: Main Upstream Publication Readiness

Date: 2026-04-03

## Required checks
- status: pass
  command/check: `git status --short --branch`
  result: Publication prep branch `chore/main-upstream-publish` was clean before merge and verification work.

- status: pass
  command/check: `git log --oneline origin/main..main`
  result: Local `main` was ahead of `origin/main` by `2c02280` only, which is the prompt-bundle commit and confirms `main` still needed the newer `pending-wrk` work merged in before publication.

- status: pass
  command/check: `git log --oneline origin/main..pending-wrk`
  result: The ahead-of-origin commits were intentional and understood: prompt bundles, the custom-play media library foundation, and the iPhone Safari real-device QA documentation.

- status: pass
  command/check: `npm run typecheck`
  result: TypeScript completed with no errors.

- status: pass
  command/check: `npm run lint`
  result: ESLint completed with no reported violations.

- status: pass
  command/check: `npm run test`
  result: Vitest completed with 44 files and 295 passing tests. The existing jsdom `HTMLMediaElement.prototype.pause` warnings still appeared during some tests, but the suite passed unchanged.

- status: warn
  command/check: `npm run build`
  result: Production build succeeded, and the pre-existing frontend large-chunk warning is still emitted for the main JavaScript bundle.

- status: pass
  command/check: `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`
  result: Maven verification completed successfully with 40 passing backend tests and a successful backend package build.

## Publication audit summary
- status: pass
  command/check: ahead-commit scope audit
  result: No stray or unrelated local commits were found in the `origin/main..pending-wrk` range.

- status: pass
  command/check: verification freshness
  result: Full frontend and backend verification was re-run on 2026-04-03 during this publication bundle, so release evidence is current for the work being prepared for publication.
