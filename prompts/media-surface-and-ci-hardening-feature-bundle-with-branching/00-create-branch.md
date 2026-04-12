# Create Branch: Media Surface And CI Hardening

Objective:
- prepare a safe feature branch for a bounded hardening slice covering backend media exposure, service-worker media caching, and enforceable CI gates

Read before doing any work:
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `requirements/intent.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/expert-review-remediation-phased-plan.md`
- `docs/execplan-media-cache-hygiene-feature.md`
- `docs/review-media-cache-hygiene-feature.md`
- `docs/test-media-cache-hygiene-feature.md`
- `docs/build-deploy-pipeline-review.md`

Branching instructions:
1. Inspect the current branch and working tree with non-destructive git commands.
2. Use the current branch as the default parent unless repo state clearly indicates a safer base.
3. Create and switch to `codex/media-surface-and-ci-hardening-feature-bundle-with-branching`.
4. Preserve unrelated local changes.

Planning outputs to establish up front:
- ExecPlan: `docs/execplan-media-surface-and-ci-hardening-feature.md`
- Review doc: `docs/review-media-surface-and-ci-hardening-feature.md`
- Test doc: `docs/test-media-surface-and-ci-hardening-feature.md`

Bundle scope reminder:
- narrow backend static media exposure to the intended subtree and validate configured roots
- harden service-worker media caching so large media is not buffered wholesale in memory and cache growth is bounded
- add visible CI gates for web, backend, and iOS
- add a repo-hygiene check that rejects generated or runtime artifacts in diffs

Stop and escalate if:
- the backend media change would break a documented production path without a clear replacement
- CI requires external secrets, hosted services, or unsupported infrastructure choices not justified by the repo
- the cache change would make existing offline runtime guarantees materially worse without a documented tradeoff

When complete:
- report the parent branch, feature branch, and the three planned doc paths above
- then continue to `01-implement-media-surface-and-ci-hardening.md`
