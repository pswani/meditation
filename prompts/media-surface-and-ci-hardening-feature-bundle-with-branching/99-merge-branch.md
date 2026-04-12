# Merge: Media Surface And CI Hardening

Merge only if all prior prompts completed safely.

Pre-merge checklist:
1. review `git status` and `git diff --stat`
2. confirm only in-scope files changed
3. confirm `docs/execplan-media-surface-and-ci-hardening-feature.md` exists and is current
4. confirm `docs/review-media-surface-and-ci-hardening-feature.md` exists
5. confirm `docs/test-media-surface-and-ci-hardening-feature.md` exists
6. confirm durable docs were updated where required

Commit guidance:
- prefer a message like `chore(ci): harden media and verification surfaces`

Merge guidance:
- use non-interactive git commands only
- do not merge if review findings remain unresolved without explicit sign-off

Final handoff should include:
- commit id
- merge target branch
- the main media-serving, cache-policy, and CI changes
- any remaining platform-specific follow-up still needed
