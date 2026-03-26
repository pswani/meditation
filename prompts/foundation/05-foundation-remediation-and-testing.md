Read:
- AGENTS.md
- PLANS.md
- README.md
- docs/architecture.md
- docs/product-requirements.md
- docs/ux-spec.md
- docs/screen-inventory.md
- docs/review-foundation-fullstack.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md

Then:

1. Create an ExecPlan.
2. Implement the critical and important findings from docs/review-foundation-fullstack.md.
3. Strengthen tests for the foundation layer:
   - backend startup/config
   - API client boundary
   - core schema/repository/service/controller pieces
4. Run the full relevant verification suite.
5. Update docs and session-handoff with exact recommended next prompt.
6. Commit with a clear message:
   feat(foundation): remediate backend and api foundations and strengthen tests
