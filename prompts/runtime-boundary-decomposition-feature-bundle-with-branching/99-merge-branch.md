# Merge: Runtime Boundary Decomposition

Merge only if all prior prompts completed safely.

Pre-merge checklist:
1. review `git status` and `git diff --stat`
2. confirm only in-scope files changed
3. confirm `docs/execplan-runtime-boundary-decomposition-feature.md` exists and is current
4. confirm `docs/review-runtime-boundary-decomposition-feature.md` exists
5. confirm `docs/test-runtime-boundary-decomposition-feature.md` exists
6. confirm durable docs were updated where required

Commit guidance:
- prefer a message like `refactor(runtime): decompose web and ios boundaries`

Merge guidance:
- use non-interactive git commands only
- do not merge if review findings remain unresolved without explicit sign-off

Final handoff should include:
- commit id
- merge target branch
- the major extracted web and iOS boundary seams
- any intentionally deferred decomposition still left for later
