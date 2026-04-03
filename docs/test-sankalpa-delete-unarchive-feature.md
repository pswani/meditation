# Test Report: Sankalpa Delete And Unarchive

Date: 2026-04-03

## Automated checks
- status: pass
  command/check: `npm run typecheck`
  result: TypeScript completed with no errors.

- status: pass
  command/check: `npm run lint`
  result: ESLint completed with no reported violations.

- status: pass
  command/check: `npm run test`
  result: Vitest completed with 44 files and 301 passing tests, including the expanded sankalpa delete/unarchive UI, replay, and API coverage.

- status: warn
  command/check: `npm run build`
  result: Production build succeeded, and the pre-existing frontend large-chunk warning is still emitted for the main JavaScript bundle.

- status: pass
  command/check: `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`
  result: Maven verification completed successfully with 43 passing backend tests, including the expanded sankalpa controller coverage.

## Focused behavior checks
- status: pass
  command/check: delete flow
  result: Archived-only delete now requires explicit confirmation in the goals UI, removes the goal from local and backend-backed views, and preserves local removal while offline.

- status: pass
  command/check: unarchive flow
  result: Archived goals can now be restored from the archived section, and the restored entry re-enters the correct derived `active`, `completed`, or `expired` section without changing its original goal window.

- status: pass
  command/check: persistence and sync
  result: Queue-backed replay now applies queued sankalpa deletes during hydration, delete requests are stale-protected through the backend, and stale queued deletes restore the current backend-backed sankalpa with explicit warning copy.

## Remaining risks
- Browser-automation coverage for goals-screen delete/unarchive confirmation behavior is still absent, so responsive interaction confidence still comes from React and backend tests.
- The frontend production build still emits the existing large-chunk warning; this slice did not change bundling strategy.
