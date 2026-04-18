You are the dedicated Codex agent for one bundle folder in this repository.

Operate only within that bundle's scope and follow the prompt files in strict sequence.

Expected inputs from the caller:

- `<BUNDLE_PATH>`: the bundle folder path, usually under `prompts/piles/<PILE_NAME>/<GROUP_NAME>/<BUNDLE_NAME>`
- `<PARENT_BRANCH>`: the integration branch that owns this bundle

The bundle folder should normally be named as a domain use case in the form `<domain>-<use-case>`, for example `custom-play-start-session` or `sankalpa-track-observance`.

Defaults:

- bundle directory: `<BUNDLE_PATH>`
- default feature branch: `codex/<BUNDLE_NAME>`

Repository instructions:

- Read `AGENTS.md`
- Read `PLANS.md`
- Read `README.md`
- Read `docs/codex-staged-workflow-design.md`
- Read `prompts/reasoning-effort-profiles.md`
- Read `requirements/decisions.md`
- Read `requirements/session-handoff.md`
- Follow repo terminology and UX principles exactly
- If the bundle lives under a group folder, also read the enclosing group `README.md` and `00-group-plan.md` before continuing
- Keep work scoped to this bundle
- Avoid unrelated refactors
- Keep the app calm, minimal, and responsive across mobile, tablet, and desktop
- Preserve clean boundaries between UI, state, persistence, and backend integration

Preflight requirements:

1. Resolve the bundle directory as `<BUNDLE_PATH>`.
2. Stop immediately if that directory does not exist or does not contain prompt files.
3. Use `<PARENT_BRANCH>` as the default parent branch unless the prompt files explicitly justify a different parent from the current repo state.
4. Use `codex/<BUNDLE_NAME>` as the default feature branch unless the prompt files explicitly choose a different branch name.
5. Before continuing past setup, inspect the prompt files and confirm any prerequisite docs or prior outputs they depend on.
6. Carry forward the parent branch name, feature branch name, review-doc paths, test-doc paths, and exact recommended next prompt across steps.
7. Stop immediately if a prompt fails in a way that makes continuing unsafe or would invalidate later prompts.

Prompt sequence:

1. Read and follow `<BUNDLE_PATH>/00-create-branch.md` first if it exists.
2. Then read and follow the remaining prompt files in sorted order, excluding `99-merge-branch.md`.
3. Expect the standard flow to group 2-4 implementation prompts before one consolidated review, test, and fix sequence unless the prompt files intentionally justify a different cadence.
4. Treat the implementation prompts as one coherent vertical slice, not as isolated micro-slices.
5. Only after the prior prompts complete safely, read and follow `<BUNDLE_PATH>/99-merge-branch.md` if it exists.
6. If the bundle folder does not use `00-create-branch.md` and `99-merge-branch.md`, adapt to the actual sorted prompt-file sequence while preserving the same safety rules.

Execution rules:

- Treat each prompt file as authoritative for that step.
- Keep each step bounded to the scope defined by that prompt.
- Do not skip verification steps required by the prompt files.
- Do not merge if the working tree is not in a safe state or if required verification is incomplete.
- Prefer repo scripts and documented commands when verification or local runtime checks are needed.
- Keep the production-first repo workflow intact while doing local development work.
- Expected reasoning profile: `bundle-implementation`
- If the operator wants a cheaper rerun of deterministic verification only, rerun the bundle's test or build commands separately with the `verification` profile rather than lowering the reasoning effort for the whole implementation run.

Usage:

- replace `<BUNDLE_PATH>` with the bundle-folder path
- replace `<PARENT_BRANCH>` with the integration branch name
- use the same name for:
  - the bundle folder under `prompts/`
  - the default feature branch name after the `codex/` prefix, unless the prompt files choose another name

Example invocation:

- `Read prompts/run-milestone-workflow.md and execute it for prompts/piles/defects-enhancements-2026-04-18/history-quality/session-log-edit-manual-entry using codex/integration-2026-04-18-defects-enhancements as the parent git branch.`
