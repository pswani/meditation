You are the dedicated Codex agent for the prompt bundle named `<MILESTONE_NAME>` in this repository.

Operate only within that bundle's scope and follow the prompt files in strict sequence.

Interpret `<MILESTONE_NAME>` as:

- the prompt folder name under `prompts/`
- the default feature-branch suffix for the bundle

Defaults:

- bundle prompt directory: `prompts/<MILESTONE_NAME>`
- default feature branch: `codex/<MILESTONE_NAME>`

Repository instructions:

- Read `AGENTS.md`
- Read `PLANS.md`
- Read `README.md`
- Read `requirements/decisions.md`
- Read `requirements/session-handoff.md`
- Follow repo terminology and UX principles exactly
- Keep work scoped to this bundle
- Avoid unrelated refactors
- Keep the app calm, minimal, and responsive across mobile, tablet, and desktop
- Preserve clean boundaries between UI, state, persistence, and backend integration

Preflight requirements:

1. Resolve the bundle prompt directory as `prompts/<MILESTONE_NAME>`.
2. Stop immediately if that directory does not exist or does not contain prompt files.
3. Treat the current branch as the default parent branch unless the bundle prompt files determine a safer parent from the current repo state.
4. Use `codex/<MILESTONE_NAME>` as the default feature branch unless the bundle prompt files explicitly choose a different branch name.
5. Before continuing past setup, inspect the bundle prompt files and confirm any prerequisite docs or prior outputs they depend on.
6. Carry forward the parent branch name, feature branch name, review-doc paths, test-doc paths, and exact recommended next prompt across steps.
7. Stop immediately if a prompt fails in a way that makes continuing unsafe or would invalidate later prompts.

Prompt sequence:

1. Read and follow `prompts/<MILESTONE_NAME>/00-create-branch.md` first if it exists.
2. Then read and follow the remaining prompt files in sorted order, excluding `99-merge-branch.md`.
3. Only after the prior prompts complete safely, read and follow `prompts/<MILESTONE_NAME>/99-merge-branch.md` if it exists.
4. If the bundle folder does not use `00-create-branch.md` and `99-merge-branch.md`, adapt to the actual sorted prompt-file sequence while preserving the same safety rules.

Execution rules:

- Treat each prompt file as authoritative for that step.
- Keep each step bounded to the scope defined by that prompt.
- Do not skip verification steps required by the prompt files.
- Do not merge if the working tree is not in a safe state or if required verification is incomplete.
- Prefer repo scripts and documented commands when verification or local runtime checks are needed.
- Keep the production-first repo workflow intact while doing local development work.

Usage:

- replace `<MILESTONE_NAME>` with the bundle name
- use the same name for:
  - the prompt folder under `prompts/`
  - the default feature branch name after the `codex/` prefix

Example invocation:

- `Read prompts/run-milestone-bundle.md and execute it for custom-play-runtime-feature-bundle-with-branching.`

