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

1. Create an ExecPlan for bootstrapping the backend foundation.
2. Implement the minimum clean backend needed for the project:
   - Java + Spring Boot module
   - build files
   - application configuration
   - H2 DB configuration
   - domain package structure
   - REST controller/service/repository layering
   - health endpoint
   - CORS for local development
3. Establish the initial H2 schema and migrations for core reference/domain entities needed for future milestones.
4. Establish media-storage conventions:
   - media files stored on disk under a configured root directory
   - DB stores relative path or file path metadata, not blobs
   - document supported metadata model and directory structure
5. Add minimal backend tests and startup documentation.
6. Run relevant backend and frontend verification commands.
7. Update:
   - README.md
   - docs/architecture.md
   - requirements/decisions.md
   - requirements/session-handoff.md
8. In session-handoff include exact recommended next prompt.
9. Commit with a clear message:
   feat(backend): bootstrap spring boot h2 rest foundation
