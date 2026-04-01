You are the dedicated Codex agent for the milestone bundle named `<MILESTONE_NAME>` in this repository.

Operate only within that milestone's scope and follow the milestone prompt files in strict sequence.

Interpret `<MILESTONE_NAME>` as:
- the prompt folder name under `prompts/`
- the default feature-branch name to use for the milestone

Defaults:
- milestone prompt directory: `prompts/<MILESTONE_NAME>`
- default milestone branch: `codex/<MILESTONE_NAME>`

If the milestone prompt files explicitly require a different branch name or determine a safer branch from the current repo state, follow the milestone prompt files and record the resolved branch in `requirements/session-handoff.md`.

Repository instructions:
- Read `AGENTS.md`
- Read `PLANS.md`
- Read `requirements/session-handoff.md`
- Read `requirements/decisions.md`
- Follow repo terminology and UX principles exactly
- Keep work scoped to this milestone
- Avoid unrelated refactors
- Keep the app calm, minimal, and responsive across mobile, tablet, and desktop
- Preserve clean REST boundaries and backend hygiene
- Use H2 for DB-backed milestone work where applicable
- Use media files on disk with DB path references where applicable

Preflight requirements:
1. Resolve the milestone prompt directory as `prompts/<MILESTONE_NAME>`.
2. Stop immediately if that directory does not exist or does not contain prompt files.
3. Treat `main` as the parent branch unless the milestone prompt determines a safer parent from the current repo state.
4. Use `codex/<MILESTONE_NAME>` as the default feature branch for the milestone unless the milestone prompt files explicitly choose a different branch name.
5. Before continuing past setup, inspect the milestone prompt files and confirm any prerequisite docs or prior prompts they depend on.
6. Resolve and record any prerequisite artifact paths from the repo state and `requirements/session-handoff.md` when the milestone depends on earlier outputs.
7. Do not restore or modify already-deleted legacy files unless a later milestone prompt explicitly requires reconciling them.
8. Stop immediately if a prompt fails in a way that makes continuing unsafe or would invalidate later prompts.

Prompt sequence:
1. Read and follow `prompts/<MILESTONE_NAME>/00-create-branch.md` first if it exists.
2. Then read and follow the remaining prompt files in sorted order, excluding `99-merge-branch.md`.
3. Only after the prior prompts complete safely, read and follow `prompts/<MILESTONE_NAME>/99-merge-branch.md` if it exists.
4. If the milestone folder does not use `00-create-branch.md` and `99-merge-branch.md`, adapt to the actual sorted prompt-file sequence while preserving the same safety rules.

Execution rules:
- Treat each prompt file as authoritative for that step.
- Carry forward the branch name, prerequisite artifact paths, decisions, and handoff updates across steps.
- Keep each step bounded to the scope defined by that prompt.
- Do not skip verification steps required by the prompt files.
- Do not merge if the working tree is not in a safe state or if required verification is incomplete.

You have permission to run local development commands required for this task, including:
- `curl` against `localhost`, `127.0.0.1`, and the developer machine's local LAN IP for local API and app verification
- start, restart, and stop npm servers for the front end
- start, restart, and stop local backend and H2-related app processes
- run local build, test, lint, typecheck, migration, seed, and reset commands that belong to this repo
- run Maven commands required for this repo, including build, test, package, verify, `spring-boot:run`, migration-related commands, and other local development lifecycle commands
- run local Git operations required for this repo, including status, diff, add, restore, `rm --cached`, branch creation and switching, merge, and commit
- use the Playwright MCP server, if configured and available, to open the local app in a browser and verify localhost, `127.0.0.1`, or LAN-accessible UI flows, including front end to backend interactions

Playwright MCP tool permissions for this task:
- You may use Playwright MCP tools including:
  - `browser_navigate`
  - `browser_click`
  - `browser_fill_form`
  - `browser_select_option`
  - `browser_type`
  - `browser_press_key`
  - `browser_wait_for`
  - `browser_take_screenshot`
  - `browser_snapshot`
- You may use those tools to:
  - load the local app
  - navigate through local routes
  - fill forms
  - select options
  - click buttons and links
  - verify front end to backend flows locally
  - validate local UI states on `localhost`, `127.0.0.1`, or LAN IP URLs

Constraints:
- local development only
- no external production services
- no destructive Git actions such as history rewriting, force-push, or deleting branches unless explicitly requested
- no destructive actions outside documented local reset flows
- prefer repo scripts and documented commands when available
- use Playwright MCP only for local development URLs unless explicitly told otherwise
- Git operations are limited to the local repository for this project
- Maven operations are limited to local build, test, run, packaging, migration, and verification flows for this project
- record the key host and port used for verification where practical
- clean up temporary processes when done

Usage:
- replace `<MILESTONE_NAME>` with the milestone name
- use the same name for:
  - the prompt folder under `prompts/`
  - the default feature branch name after the `codex/` prefix
- example milestone name: `intent-remediation-bundle-with-branching`
- example resulting defaults:
  - prompt folder: `prompts/intent-remediation-bundle-with-branching`
  - branch: `codex/intent-remediation-bundle-with-branching`

Example invocation:
- `Read prompts/run-milestone-bundle.md and execute it for intent-remediation-bundle-with-branching.`
