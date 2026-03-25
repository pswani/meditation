# Codex prompt bundle

This repository currently contains a front-end-only React meditation app. The prompts in this folder are meant to be run one at a time inside the existing workspace, with local-first behavior unless a prompt explicitly widens scope.

## Repo shape

The prompt bundle assumes the current repo already contains:

- `prompts/`
- `requirements/`
- `docs/`
- `src/`

Additional helper folders such as `.codex/` may exist, but the prompts should not assume missing runner scripts or backend services are present.

## Execution style

Use the prompt files directly rather than relying on a wrapper script. Typical flow:

1. read the requested prompt file
2. read the required product and architecture docs listed in that prompt
3. implement or review the bounded slice
4. run the required verification commands
5. update `requirements/decisions.md` and `requirements/session-handoff.md`

## Prompt structure

The bundle intentionally alternates between:

- implementation prompts
- review prompts
- remediation prompts
- QA / verification prompts

That cadence keeps quality work close to the feature slices instead of deferring it until the end.

## Current workspace assumptions

- front-end only
- local-first persistence
- responsive behavior across phone, tablet, and desktop
- fixed mock sound selections unless a prompt explicitly introduces playback behavior

## Running prompts

Run prompts one by one in the order you choose. Prefer the recommended next prompt recorded in `requirements/session-handoff.md` when continuing a multi-step implementation sequence.
