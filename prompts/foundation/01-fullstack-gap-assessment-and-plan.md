Read:
- AGENTS.md
- PLANS.md
- README.md
- docs/architecture.md
- docs/product-requirements.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md

Then:

1. Create an ExecPlan for assessing the current repository and converting it into a fully functioning full-stack application.
2. Confirm the current gaps explicitly, including:
   - missing backend module
   - missing H2 configuration and schema
   - missing real REST persistence
   - front-end local-storage API shims
   - missing media-file management on disk
3. Produce a concrete plan for the full-stack implementation sequence using:
   - React front end
   - Java/Spring Boot backend
   - H2 database
   - media files stored in a directory with DB-referenced paths
   - clean REST integration between front end and backend
4. Update docs minimally so the plan is accurate:
   - README.md
   - docs/architecture.md
   - requirements/decisions.md
   - requirements/session-handoff.md
5. Do not implement major product features yet beyond planning and minimal scaffolding if needed.
6. Run any currently relevant verification commands for the existing repo.
7. In session-handoff include:
   - confirmed current-state assessment
   - chosen backend architecture
   - exact recommended next prompt
8. Commit with a clear message:
   docs(plan): assess full-stack gaps and define implementation sequence
