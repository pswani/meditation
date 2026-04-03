# ExecPlan: Sankalpa Edit And Archive Verification

## Objective
Verify that sankalpa edit and archive behavior is trustworthy across UI state transitions, local persistence, offline-capable replay, and backend-backed progress responses.

## Scope
- edit supported goal fields and preserve original goal identity/window
- archive active, completed, and expired goals
- confirm archived goals render separately and read only
- cover local storage normalization plus backend API normalization for archived state
- rerun the standard frontend and backend verification commands

## Exclusions
- new sankalpa lifecycle actions such as delete or unarchive
- broader summary redesign or unrelated timer / playlist work

## Risks And Tradeoffs
- date-window behavior can become flaky if tests depend on absolute historical dates instead of relative active/completed fixtures
- archive state touches both frontend and backend contracts, so missing one normalization layer could silently regress offline recovery

## Verification Plan
- strengthen `src/pages/SankalpaPage.test.tsx` for edit-field coverage plus completed/expired archiving
- keep `src/utils/storage.test.ts` aligned with archived-state normalization
- run:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `mvn -Dmaven.repo.local=../local-data/m2 verify`

## Progress
- added focused goals-screen coverage for edit-field changes and archive flows across active, completed, and expired sections
- reran frontend and backend verification after the coverage updates
