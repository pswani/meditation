# Merge: Repo Hygiene Foundation

Merge only if all prior prompts completed safely.

Pre-merge checklist:
1. review `git status` and `git diff --stat`
2. confirm only in-scope files changed
3. confirm `docs/execplan-repo-hygiene-foundation-feature.md` exists and is current
4. confirm `docs/review-repo-hygiene-foundation-feature.md` exists
5. confirm `docs/test-repo-hygiene-foundation-feature.md` exists
6. confirm durable docs were updated where required

Commit guidance:
- prefer a message like `chore(repo): tighten hygiene foundations`

Merge guidance:
- use non-interactive git commands only
- do not merge if review findings remain unresolved without explicit sign-off

Final handoff should include:
- commit id
- merge target branch
- the main tracked-artifact classes cleaned up
- any intentionally retained tracked fixtures or setup assets
