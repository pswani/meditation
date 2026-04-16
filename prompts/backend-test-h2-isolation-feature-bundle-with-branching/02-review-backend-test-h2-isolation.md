# 02 Review Backend Test H2 Isolation

Review the branch and create `docs/review-backend-test-h2-isolation-feature.md`.

Review focus:
- whether any test or verification path can still write to the production-like H2 location
- whether the chosen isolation approach preserves production runtime defaults
- script cleanup safety for temp runtime directories
- documentation accuracy for the new testing path
- focused configuration test coverage

Rules:
- Findings first, with file references.
- If the branch is clean, say that explicitly and mention any residual opt-in live-test risk.
- Do not fix issues in this prompt.

Next prompt: `03-test-backend-test-h2-isolation.md`.
