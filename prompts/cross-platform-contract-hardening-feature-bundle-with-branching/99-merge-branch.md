# Merge: Cross-Platform Contract Hardening

Merge only if all prior prompts completed safely.

Pre-merge checklist:
1. review `git status` and `git diff --stat`
2. confirm only in-scope files changed
3. confirm `docs/execplan-cross-platform-contract-hardening-feature.md` exists and is current
4. confirm `docs/review-cross-platform-contract-hardening-feature.md` exists
5. confirm `docs/test-cross-platform-contract-hardening-feature.md` exists
6. confirm durable docs were updated where required

Commit guidance:
- prefer a message like `feat(sync): harden shared contract semantics`

Merge guidance:
- use non-interactive git commands only
- do not merge if review findings remain unresolved without explicit sign-off

Final handoff should include:
- commit id
- merge target branch
- the canonical contract location
- the main stale-write, reference-data, and transaction changes
- any compatibility caveats that remain
