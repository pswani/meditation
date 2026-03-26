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

1. Create an ExecPlan for release readiness.
2. Prepare the repo for a release-candidate handoff:
   - verify setup instructions
   - verify media setup instructions
   - verify backend/H2/local run instructions
   - verify LAN/Wi-Fi access instructions if present
   - verify offline/sync instructions if present
   - identify any remaining release blockers
3. Update docs as needed.
4. Run the full relevant verification suite.
5. Produce a concise release-readiness summary in session-handoff.
6. Commit with a clear message:
   chore(release): prepare full-stack repo for release candidate handoff
