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

1. Perform a thorough performance review of the application.
2. Evaluate both front-end and back-end performance risks if present.
3. Focus on practical issues, not speculative micro-optimizations.
4. Review:
   - unnecessary re-renders
   - repeated expensive derived computations
   - overly large route-level renders
   - wasteful state updates
   - local persistence frequency / serialization issues
   - history/log summary derivation efficiency
   - list rendering quality
   - navigation-induced rework
   - REST request patterns if present
   - API payload shape and over-fetching if present
   - H2 access patterns if present
   - media path lookup / file-loading approach if present
   - bundle-size concerns visible from the repo structure
5. Identify:
   - critical performance issues
   - important efficiency issues
   - low-priority polish opportunities
6. For each issue include:
   - where it appears
   - user impact
   - likely root cause
   - recommended fix
7. Do not implement code changes in this step.
8. Write findings into:
   - docs/review-performance.md
   - requirements/session-handoff.md
9. In session-handoff, include:
   - concise summary of top performance findings
   - exact recommended next prompt
10. Do not commit code in this review-only step.
