# Repo Hygiene Foundation ExecPlan

Date: 2026-04-11

## Objective

Reduce wrong-edit risk in the workspace by removing stale tracked generated config artifacts, making the `local-data/` runtime boundary reproducible, and adding a small hygiene check that proves those surfaces stay out of source control.

## Why

- The repo still tracks generated Vitest companion files even though `vitest.config.ts` is already the canonical config entrypoint.
- `local-data/` is intentionally ignored, but the repo does not yet have one small, explicit setup flow that recreates the expected local runtime directories for media, H2, deploy output, runtime logs, Maven cache, and node-side tsbuild output.
- The hygiene boundary is described across docs and scripts, but the repo lacks a focused check that quickly proves tracked generated and mutable runtime artifacts have not slipped back into Git.

## Scope

Included:
- audit the current tracked generated and runtime surfaces before changing them
- remove the stale tracked generated Vitest output files
- tighten ignore rules around generated config companions for canonical TypeScript config files
- add one reproducible local-data setup helper for the expected runtime directories
- add one focused hygiene check helper for tracked generated and runtime artifact classes
- update durable docs for the repo hygiene boundary and verification workflow

Excluded:
- large CI workflow authoring
- sync-contract or backend concurrency redesign
- backend media-serving security changes
- broad frontend or iOS runtime refactors
- deletion of user-owned local runtime files under ignored paths

## Source documents

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
- `prompts/README.md`
- `prompts/repo-hygiene-foundation-feature-bundle-with-branching/00-create-branch.md`
- `prompts/repo-hygiene-foundation-feature-bundle-with-branching/01-implement-repo-hygiene-foundation.md`

## Affected files and modules

- `.gitignore`
- `package.json`
- `scripts/common.sh`
- `scripts/setup-media-root.sh`
- `scripts/setup-local-data.sh`
- `scripts/check-repo-hygiene.sh`
- `README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/execplan-repo-hygiene-foundation-feature.md`
- `docs/review-repo-hygiene-foundation-feature.md`
- `docs/test-repo-hygiene-foundation-feature.md`
- `vitest.config.js`
- `vitest.config.d.ts`

## UX behavior

- No user-facing product flows should change.
- The repo workflow should become calmer and more trustworthy for contributors:
  - `vitest.config.ts` remains the one canonical Vitest config
  - local runtime directories can be recreated deliberately instead of relying on leftover ignored state
  - hygiene verification should be a small explicit check rather than implicit tribal knowledge

## Data and state model

- `local-data/` remains ignored local runtime state, not durable source.
- Setup should create directory scaffolding only; it must not delete or overwrite existing runtime data.
- The hygiene check should inspect tracked files through Git rather than walking ignored runtime content and treating local machine state as an error.

## Risks and tradeoffs

- Ignoring generated config companions must stay narrow so it does not hide legitimate source.
- A local-data setup helper must be non-destructive because the directory can contain operator-owned deploy bundles, media, H2 data, and logs.
- The current repo state already includes unrelated user-owned prompt and handoff edits, so this slice must avoid touching them unless required by the bundle docs.

## Milestones

1. Re-verify the current tracked generated and runtime artifact classes against the bundle brief.
2. Create the ExecPlan and confirm the narrowed scope for this branch.
3. Remove stale tracked generated Vitest artifacts and tighten ignore coverage for generated config companions.
4. Add reproducible local-data setup and hygiene-check helpers.
5. Update durable docs for the runtime boundary, commands, and current repo state.
6. Review the diff, run verification, and record results in review/test docs.

## Verification

- `./scripts/setup-local-data.sh`
- `./scripts/check-repo-hygiene.sh`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Focused checks:
- `git ls-files` no longer reports tracked `vitest.config.js` or `vitest.config.d.ts`
- the repo exposes one canonical Vitest config entrypoint
- the setup helper recreates the expected `local-data/` directory skeleton without deleting existing files
- the hygiene check fails if tracked generated config companions or tracked runtime directories reappear

## Decision log

- 2026-04-11: Use `codex/expert-review` as the parent because the user explicitly requested it and the repo state does not indicate a safer base.
- 2026-04-11: Narrow the bundle to the still-open hygiene gap instead of re-cleaning already-fixed areas such as `tsconfig.node.tsbuildinfo` tracking or broad `local-data/` gitignore coverage.
- 2026-04-11: Keep the setup helper non-destructive and directory-oriented so it supports both day-to-day development and operator workflows without wiping local runtime data.
- 2026-04-11: Add a small script-backed hygiene check rather than broadening this bundle into CI authoring.

## Progress log

- 2026-04-11: Read the milestone runner, the repo-hygiene bundle prompts, the remediation phased plan, and the required durable docs.
- 2026-04-11: Inspected the current repo state and confirmed the branch was dirty before bundle work:
  - modified `prompts/README.md`
  - modified `requirements/session-handoff.md`
  - untracked prompt-bundle directories and `Archive.zip`
- 2026-04-11: Created and switched to `codex/repo-hygiene-foundation-feature-bundle-with-branching` from `codex/expert-review` while preserving unrelated local changes.
- 2026-04-11: Re-verified the current hygiene surface:
  - `local-data/` is already ignored and currently untracked
  - node-side tsbuild output is already redirected into ignored `local-data/tsbuild/node/`
  - stale tracked generated files still remain at `vitest.config.js` and `vitest.config.d.ts`
  - the repo still benefits from an explicit local-data setup helper and a focused hygiene check
