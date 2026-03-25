Read:
- AGENTS.md
- PLANS.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- docs/review-usability-full-app.md
- docs/review-code-quality.md
- docs/review-performance.md
- docs/review-hygiene.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md

Then:

1. Create an ExecPlan.
2. Consolidate the findings from the review documents.
3. Implement the critical issues and the most valuable important issues only.
4. Keep scope bounded to a realistic, review-driven remediation slice.
5. Prioritize fixes that improve:
   - usability
   - correctness
   - maintainability
   - performance
   - hygiene
6. Preserve existing behavior unless a reviewed issue requires a change.
7. Avoid unrelated refactors and avoid speculative cleanup.
8. Add or update focused tests where behavior changes.
9. Run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
10. Update:
   - requirements/decisions.md
   - requirements/session-handoff.md
11. In session-handoff, include:
   - issues fixed
   - issues intentionally deferred
   - tests added or improved
   - known limitations
   - exact recommended next prompt
12. Commit with a clear message, for example:
   chore(review): address high-priority usability quality performance and hygiene findings
