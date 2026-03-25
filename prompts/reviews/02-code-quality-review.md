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

1. Perform a thorough code quality and maintainability review of the entire application.
2. Review both front-end and back-end code if present, including REST integration boundaries, persistence layer boundaries, H2 usage, API design, domain modeling, validation placement, and file-storage handling for sound/media paths.
3. Evaluate:
   - architecture consistency with the documented design
   - separation of concerns
   - component size and cohesion
   - hook/state management quality
   - REST client / API contract clarity
   - server controller/service/repository boundaries if present
   - H2 schema/model alignment if present
   - file-path storage approach for media assets
   - naming consistency
   - duplication
   - dead code / placeholder code
   - error handling quality
   - validation placement and readability
   - test quality and missing tests
   - readability and change safety
4. Identify:
   - critical code-quality issues
   - important maintainability issues
   - hygiene/cleanup issues
5. For each issue include:
   - affected area/files
   - why it matters
   - likely risk if left unchanged
   - recommended remediation
6. Produce a prioritized remediation plan:
   - architecture / correctness
   - maintainability
   - cleanup / polish
7. Do not implement code changes in this step.
8. Write findings into:
   - docs/review-code-quality.md
   - requirements/session-handoff.md
9. In session-handoff, include:
   - concise summary of top code-quality findings
   - exact recommended next prompt
10. Do not commit code in this review-only step.
