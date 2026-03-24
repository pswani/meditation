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

1. Create an ExecPlan for solidifying the full-stack application architecture for milestone implementation.

2. Define and implement the minimum architecture needed for clean end-to-end development across front end and back end:
   - shared domain models and DTO boundaries
   - feature-oriented folder structure where needed
   - persistence utilities
   - validation utilities
   - reusable route/screen scaffolding where needed
   - common storage keys and local data helpers on the front end
   - clear REST API conventions between front end and back end
   - server-side media storage conventions for sound/session files
   - H2 database integration plan for local and development use

3. Formalize domain models and contracts for:
   - meditation type
   - timer session
   - session log
   - manual log
   - custom play
   - playlist
   - sankalpa
   - summary inputs/outputs
   - settings/preferences
   - media asset metadata, including filesystem path references stored in the database

4. Back-end architecture expectations:
   - use H2 DB
   - store sound and related media files in a directory on disk
   - store file path references and metadata in the database rather than binary blobs if practical
   - define clean REST-style API contracts suitable for a React front end
   - keep the back end modular and production-extensible
   - document the chosen package/module structure

5. Keep scope bounded:
   - no major new feature implementation
   - no cloud sync
   - no unrelated refactors

6. Prefer small, maintainable abstractions over over-engineering.
7. Add focused tests for any shared helpers introduced.
8. Update architecture docs to reflect the front-end/back-end split and REST boundaries.
9. Run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
10. Update:
   - docs/architecture.md
   - requirements/decisions.md
   - requirements/session-handoff.md
11. In session-handoff, include:
   - what architecture foundations are now in place
   - what milestone work is unblocked
   - exact recommended next prompt
12. Commit with a clear message:
   refactor(architecture): establish shared domain models rest contracts and h2-backed foundations
