# Prompt Bundles

This folder contains reusable Codex prompt bundles for the next major product slices in this repository.

Use these bundles when you want a bounded feature sequence that follows the same local workflow pattern:

1. create a feature branch from the current parent branch
2. implement one focused feature slice
3. review the slice without changing code
4. test the slice and strengthen coverage
5. fix important findings from review and test
6. merge the completed feature branch back into the parent branch

Current bundles:

- `custom-play-runtime-feature-bundle-with-branching`
- `playlist-runtime-audio-feature-bundle-with-branching`
- `sankalpa-edit-archive-feature-bundle-with-branching`

Reusable runner:

- `run-milestone-bundle.md`

Typical usage:

1. read `prompts/run-milestone-bundle.md`
2. replace `<MILESTONE_NAME>` with one of the bundle folder names above
3. execute the bundle prompts in sorted order

The bundle prompts are intended to work with the repository guidance in:

- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

