# 03-test-main-upstream-publish.md

## Goal
Verify that `main` is ready for upstream publication.

## Required checks
Run and report:
- `git status --short --branch`
- `git log --oneline origin/main..main`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/` if full-stack release confidence is required

## Output format
For every check:
- status (pass/fail/warn)
- exact command/check
- concise result

Capture any environment or permission limitations explicitly.
