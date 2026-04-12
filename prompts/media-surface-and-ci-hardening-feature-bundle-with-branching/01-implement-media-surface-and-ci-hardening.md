# Implement: Media Surface And CI Hardening

Objective:
- reduce security, reliability, and silent-breakage risk around media delivery and multi-platform verification

Primary outcomes:
1. Backend media serving is limited to the intended subtree with validated configuration rather than a broad file-system exposure surface.
2. Service-worker media handling avoids risky full-buffer partial-response emulation for larger assets and uses bounded cache policy.
3. CI visibly enforces core web, backend, and iOS quality gates.
4. CI or repo checks fail when generated or runtime artifacts appear in diffs.

Read before implementation:
- `prompts/expert-review-remediation-phased-plan.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- backend media config code
- service-worker and offline-cache code
- any current pipeline or workflow scripts you touch

In scope:
- backend media-serving validation and narrowing
- service-worker media-cache policy hardening
- CI workflows for web, backend, and iOS
- diff-time hygiene checks for generated or runtime artifacts
- durable docs describing the new media and CI behavior

Explicitly out of scope:
- broad repo-hygiene cleanup already handled by the hygiene bundle
- sync-contract redesign
- large runtime decomposition
- unrelated deployment-platform changes

Implementation guidance:
1. Re-verify the current media and CI surfaces first. Some prior cache and pipeline hardening already exists, so only close the remaining gap.
2. Prefer serving only the exact intended media subtree. If broader file serving is still necessary locally, document and validate it explicitly.
3. Keep offline behavior calm and trustworthy. Do not pretend unsupported range semantics are fully correct.
4. CI should use the repo's real verification commands instead of parallel shadow scripts.
5. Keep hygiene checks focused on artifact classes the repo has already decided should stay untracked.

Quality expectations:
- media-serving validation should fail clearly on unsafe configuration
- cache policy should be bounded and understandable
- CI should be readable, incremental, and easy to extend

Verification expectations:
- run the local verification commands mirrored by CI when possible
- run focused backend or service-worker checks for the changed media behavior
- validate workflow syntax or dry-run logic where feasible, while documenting any local limitations

Documentation updates required:
- `docs/architecture.md` if the durable media-serving model changes
- `README.md` if contributor verification workflow changes visibly
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/execplan-media-surface-and-ci-hardening-feature.md`

Before handing off to review:
- summarize the final backend media boundary, service-worker cache policy, and CI gates
- note any intentional local-only exceptions that remain
- then continue to `02-review-media-surface-and-ci-hardening.md`
