# 02 Review Native Home And Practice Navigation Defects

Review the branch with a code-review mindset and create `docs/review-ios-native-home-practice-navigation-defects-feature.md`.

Review focus:
- duplicate-title regressions on Home and Practice
- favorite shortcut enablement when local media is available but the backend is offline
- missing or misplaced `Start` actions on Practice `custom play` surfaces
- broken or fragile back navigation from the `custom play` library
- test coverage for the new presentation and enablement rules

Review rules:
- Findings come first, ordered by severity, with file references.
- Keep summaries brief.
- If there are no findings, say that explicitly and note any residual manual-device risks.
- Do not fix issues in this prompt unless a trivial typo blocks the review itself.

When the review doc is written, recommend `03-test-ios-native-home-practice-navigation-defects.md`.
