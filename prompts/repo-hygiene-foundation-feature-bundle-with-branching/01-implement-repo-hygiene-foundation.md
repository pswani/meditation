# Implement: Repo Hygiene Foundation

Objective:
- remove wrong-edit and nondeterminism risk from the workspace by cleaning tracked generated and runtime artifacts without deleting intentional source, tests, docs, or config

Primary outcomes:
1. Tracked generated, built, deployed, cache, and OS-noise content is removed from source control or relocated out of the repo surface.
2. Ignore rules clearly protect the repo from reintroducing those artifacts.
3. `local-data/` is treated as reproducible local runtime state rather than committed mutable state.
4. The build and test config surface is unambiguous, including one canonical Vitest config and no tracked tsbuild or generated declaration output.

Read before implementation:
- `prompts/expert-review-remediation-phased-plan.md`
- `prompts/README.md`
- `README.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- any setup, reset, pipeline, or local-data docs you touch

In scope:
- tracked generated artifact audit
- ignore-rule tightening
- cleanup of tracked build metadata and generated config output
- cleanup or replacement of committed mutable runtime state under `local-data/`
- reproducible setup or reset scripts and docs needed to replace removed state
- focused verification helpers or hygiene checks that prove the repo stays clean after the cleanup
- durable documentation of the new hygiene boundary

Explicitly out of scope:
- large CI workflow authoring beyond the minimal local hygiene support needed here
- sync-contract redesign
- backend media-serving security changes
- large frontend or iOS runtime refactors

Implementation guidance:
1. Treat the expert-review evidence as hypotheses. Re-verify which artifacts are actually tracked before editing.
2. Preserve intentionally versioned source, fixtures, templates, examples, and operator docs. Do not use cleanup as an excuse to delete durable inputs.
3. If a generated file is currently tracked because a build script still emits into the repo root, fix the output path or ignore strategy as part of the same slice.
4. Prefer repo-managed setup and reset scripts over hand-written cleanup instructions that depend on implicit local knowledge.
5. Keep the cleanup mechanical and reviewable. Avoid unrelated restructuring.

Code quality expectations:
- ignore patterns should be strict enough to block junk without hiding real source
- local-data setup should be reproducible from docs and scripts
- config ownership should be obvious from filenames and docs

Verification expectations:
- run the required frontend checks when applicable
- run any relevant backend or iOS checks if the cleanup touches their config or generated outputs
- add a verification step that demonstrates the repo no longer tracks the targeted junk surfaces

Documentation updates required:
- `README.md` only if the cleanup changes visible repo structure or setup expectations
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/execplan-repo-hygiene-foundation-feature.md`

Before handing off to review:
- summarize exactly which tracked artifact classes were removed or reclassified
- note any intentional exceptions that remain tracked and why
- then continue to `02-review-repo-hygiene-foundation.md`
