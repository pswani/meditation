# Multi-agent orchestration prompts for Codex app

The Codex app supports multiple agents in parallel, each in isolated worktrees / threads.

## Recommended pattern
- create one Codex app agent per milestone manually in the app
- point each agent at the same repo/project
- let each agent work in its own isolated worktree
- give each agent the milestone-specific orchestration prompt below
- review and merge milestone branches after verification

Do not rely on one prompt to programmatically spawn other agents. Use the app UI to create the agents.

## Generic milestone-agent prompt

Replace:
- `milestone-a-core-fullstack`
- `prompts/milestone-a-core-fullstack`
- `codex/functioning`

```text
You are the dedicated Codex agent for milestone-a-core-fullstack in this repository.

Operate only within this milestone’s scope and execute the milestone prompt files in strict sequence.

Repository instructions:
- Read AGENTS.md
- Read PLANS.md
- Read requirements/session-handoff.md
- Read requirements/decisions.md
- Follow repo terminology and UX principles exactly
- Keep work scoped to this milestone
- Avoid unrelated refactors
- Keep the app calm, minimal, and responsive across mobile, tablet, and desktop
- Preserve clean REST boundaries and backend hygiene
- Use H2 for DB-backed milestone work where applicable
- Use media files on disk with DB path references where applicable

Branching instructions:
1. Treat `codex/functioning` as the parent branch.
2. Execute `prompts/milestone-a-core-fullstack/00-create-branch.md` first.
3. Then execute the remaining milestone prompt files in sorted order, excluding `99-merge-branch.md`.
4. Stop immediately if a prompt fails in a way that makes continuing unsafe.
5. At the end of the milestone, execute `prompts/milestone-a-core-fullstack/99-merge-branch.md`.
```
