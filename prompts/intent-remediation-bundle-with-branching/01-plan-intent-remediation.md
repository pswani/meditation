Read AGENTS.md, PLANS.md, README.md, requirements/intent.md, docs/product-requirements.md, docs/architecture.md, docs/ux-spec.md, docs/screen-inventory.md, requirements/roadmap.md, requirements/decisions.md, requirements/session-handoff.md, and the two documents produced by prompts 1 and 2:
- docs/review-intent-compliance-full-app.md
- docs/pending-work-inventory.md

If those files were created at different paths, first locate and use the actual files recorded in requirements/session-handoff.md.

Then create an ExecPlan for closing the product gaps identified in the requirement audit and pending-work inventory.

Scope:
- convert the findings into a practical remediation roadmap
- group the work into bounded vertical slices
- identify blockers, dependencies, and the safest execution order
- distinguish must-fix product correctness gaps from quality and polish work
- do not implement code changes in this step

Output:
1. a prioritized set of 3 to 6 vertical slices
2. for each slice:
   - objective
   - included requirements and gaps
   - explicit exclusions
   - affected files/modules
   - key UX and validation expectations
   - backend, API, and data implications
   - risk notes
   - verification plan
3. recommend the first slice to implement now and explain why it should go first
4. include the exact recommended next prompt for that first slice

Write the ExecPlan into `requirements/execplan-intent-remediation-bundle.md`, update requirements/session-handoff.md with the recommended next prompt, and if only documentation changes are made commit with a clear message such as `docs(plan): define intent remediation slices`.

