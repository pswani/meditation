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

1. Create an ExecPlan for locking the current UX baseline before milestone execution.
2. Review the currently implemented application and align the UX specification docs with the actual intended product direction.
3. Update and normalize:
   - docs/ux-spec.md
   - docs/screen-inventory.md
   - docs/architecture.md
4. Ensure the docs clearly define:
   - supported device classes: mobile, tablet, desktop
   - route map
   - screen purposes
   - navigation model
   - major user journeys
   - validation expectations
   - empty/error/success states
   - responsive behavior expectations by breakpoint
5. Resolve inconsistencies in terminology across docs.
6. Do not perform major feature implementation in this step.
7. Only make small code adjustments if needed to align route names or labels with the locked UX baseline.
8. Run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
9. Update:
   - requirements/decisions.md
   - requirements/session-handoff.md
10. In session-handoff, include:
   - what was locked down in the UX baseline
   - any unresolved UX questions
   - exact recommended next prompt
11. Commit with a clear message:
   docs(ux): lock baseline routes screens and responsive UX expectations
