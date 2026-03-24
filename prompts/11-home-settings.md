Read:
- AGENTS.md
- PLANS.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md

Then:

1. Create an ExecPlan for a bounded vertical slice to make the Home and Settings screens fully functional in the current prototype.

2. Scope:
   Included:
   - make Home screen functional and meaningful
   - make Settings screen functional and meaningful
   - ensure both routes are wired correctly
   - ensure navigation to Home and Settings works on mobile, tablet, and desktop
   - ensure these screens work within the current responsive app shell
   - implement realistic placeholder functionality, not just static copy
   - persist relevant settings locally for the prototype
   - keep the UX calm, minimal, and consistent with the meditation app

   Excluded:
   - backend
   - cloud sync
   - notifications
   - auth/accounts
   - unrelated refactors
   - large new feature areas outside Home and Settings

3. Home screen requirements:
   - quick start entry to timer
   - clear summary of today’s activity using available app data
   - recent activity or recent session logs if available
   - favorites/recent shortcuts where supported by the current app state
   - useful empty states if no sessions/settings data exists
   - clear navigation to the most important next actions

4. Settings screen requirements:
   - functional settings UI, not just placeholders
   - support realistic prototype settings such as:
     - default meditation duration
     - default meditation type
     - default start sound
     - default end sound
     - interval sound preference if appropriate
     - local persistence for settings
   - clear save/apply behavior or immediate-save behavior
   - good empty/default states
   - responsive layout

5. Ensure terminology matches the repo docs exactly.

6. Add focused tests for:
   - Home screen derived display logic where practical
   - Settings persistence and defaults behavior
   - route/navigation behavior for Home and Settings if practical
   - any key validation or helper logic introduced

7. Run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build

8. Update:
   - requirements/decisions.md
   - requirements/session-handoff.md

9. In session-handoff, include:
   - what was implemented for Home
   - what was implemented for Settings
   - known limitations
   - exact recommended next prompt

10. Commit with a clear message:
   feat(shell): implement functional home and settings screens