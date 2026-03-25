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

1. Perform a thorough repository hygiene and engineering-discipline review.
2. Evaluate:
   - folder structure consistency
   - naming conventions
   - stale files and docs drift
   - .gitignore quality
   - tracked generated artifacts
   - local-only or secret-bearing files
   - README/setup clarity
   - script quality
   - prompt/doc consistency
   - route naming consistency
   - REST endpoint naming consistency if present
   - H2/config file handling if present
   - storage directory conventions for sound/media files
   - build/test script hygiene
3. Identify:
   - critical hygiene issues
   - important cleanup opportunities
   - minor polish opportunities
4. For each issue include:
   - affected files/areas
   - why it matters
   - recommended cleanup
5. Do not implement code changes in this step.
6. Write findings into:
   - docs/review-hygiene.md
   - requirements/session-handoff.md
7. In session-handoff, include:
   - concise summary of top hygiene findings
   - exact recommended next prompt
8. Do not commit code in this review-only step.
