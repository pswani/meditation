You are the dedicated Codex agent for one staged group workflow in this repository.

Your job is to execute one group folder, including its bundle sequence and its group-level review, test, build, and closeout steps.

Expected inputs from the caller:

- `<GROUP_PATH>`: the group folder path, usually `prompts/piles/<PILE_NAME>/<GROUP_NAME>`
- `<PARENT_BRANCH>`: the integration branch for the pile

Defaults:

- group directory: `<GROUP_PATH>`
- integration branch: `<PARENT_BRANCH>`

Repository instructions:

- Read `AGENTS.md`
- Read `PLANS.md`
- Read `README.md`
- Read `docs/codex-staged-workflow-design.md`
- Read `prompts/reasoning-effort-profiles.md`
- Read `requirements/decisions.md`
- Read `requirements/session-handoff.md`
- Follow repo terminology and UX principles exactly
- Keep work scoped to this group and its bundle folders

Preflight requirements:

1. Resolve `<GROUP_PATH>` and stop if it does not exist.
2. Read `<GROUP_PATH>/README.md` and `<GROUP_PATH>/00-group-plan.md` before executing any bundle.
3. Resolve the bundle folders in the order specified by the group docs, falling back to sorted folder order only when the docs do not specify a better order.
4. Use `<PARENT_BRANCH>` as the default parent branch for bundle execution unless the group docs explicitly justify another parent.
5. Stop immediately if the group docs are missing required verification or cleanup instructions.

Execution rules:

1. Default to one thread for the whole group.
2. Execute bundles sequentially when the group docs say the group should stay in one thread.
3. If the group docs explicitly mark a bundle as `separate-thread`, do not improvise around that:
   - produce the exact `run-milestone-workflow.md` prompt needed for the separate thread
   - stop before that bundle if continuing in the current thread would be unsafe or confusing
4. Treat each bundle as one coherent vertical slice, not as a micro-slice.
5. After all bundles in the group are complete, run:
   - `90-group-review.md`
   - `91-group-test.md`
   - `92-group-build.md`
   - `99-group-closeout.md`
6. Do not skip required verification or cleanup steps.
7. Do not merge the integration branch to `main`; this workflow stops at the group boundary.

Reasoning guidance:

- expected profile for the main group run: `group-orchestration`
- if the operator prefers cheaper verification runs, `91-group-test.md` and `92-group-build.md` may be rerun separately with the `verification` profile through the CLI helpers

Example invocation:

- `Read prompts/run-group-workflow.md and execute it for prompts/piles/defects-enhancements-2026-04-18/history-quality using codex/integration-2026-04-18-defects-enhancements as the parent git branch.`
