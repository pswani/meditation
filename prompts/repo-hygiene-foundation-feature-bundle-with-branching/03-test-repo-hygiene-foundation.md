# Test: Repo Hygiene Foundation

Goal:
- verify that the repo cleanup is real, reproducible, and does not break the existing verification workflow

Minimum verification:
1. Run the required repo checks for the touched surfaces, including `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` when applicable.
2. Verify the targeted generated/runtime artifacts are no longer tracked by git.
3. Verify any new or updated setup/reset scripts actually recreate the expected local-only state.
4. Verify the canonical config surface is unambiguous, especially for Vitest and tsbuild outputs.

Suggested command ideas when applicable:
- `git ls-files`
- `git diff --stat`
- `rg --files`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- any repo setup or reset scripts added in this bundle

Record results in:
- `docs/test-repo-hygiene-foundation-feature.md`

The test doc should include:
- commands run
- pass or fail status
- which previously tracked artifact classes were confirmed removed from git
- any local-only setup steps that still require manual operator discipline

When complete:
- summarize the most important verification result
- then continue to `04-fix-repo-hygiene-foundation.md`
