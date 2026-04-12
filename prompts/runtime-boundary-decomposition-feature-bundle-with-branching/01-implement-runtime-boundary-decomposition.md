# Implement: Runtime Boundary Decomposition

Objective:
- reduce regression and merge-pressure risk by turning the biggest orchestration files into clearer, smaller collaboration boundaries without changing the product behavior

Primary outcomes:
1. `TimerContext.tsx` becomes a stable coordination boundary with extracted runtime, persistence, sync, and presentation helpers where they improve testability and clarity.
2. `ShellViewModel.swift` becomes a stable shell-facing boundary with extracted collaborators for persistence, sync orchestration, runtime state shaping, or presentation copy as needed.
3. Feature boundaries are explicit enough that future work can change one concern without editing the entire orchestrator.
4. Focused tests cover the extracted behavior rather than only the old monolith paths.

Read before implementation:
- `prompts/expert-review-remediation-phased-plan.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- current web timer runtime files
- current iOS shell runtime files

In scope:
- focused decomposition of the two oversized orchestration boundaries
- helper, hook, service, or presentation extraction where it reduces responsibility mixing
- tests for extracted seams
- durable docs describing the new responsibility boundaries

Explicitly out of scope:
- changing the canonical sync contract except where already settled by prior bundles
- repo-hygiene cleanup
- large screen redesign
- backend media or CI work

Implementation guidance:
1. Re-verify the current file sizes and responsibilities first. The repo already contains some prior decomposition work, so continue from the real current state instead of the older review snapshot.
2. Preserve public behavior and route-level wiring unless a small cleanup is required to make the new boundary coherent.
3. Prefer extraction by responsibility, not by arbitrary file size quotas.
4. Keep business logic out of large render trees and keep persistence or sync side effects out of presentation helpers.
5. Introduce comments only where a non-obvious coordination seam needs a short explanation.

Quality expectations:
- each extracted module should have one clear reason to change
- feature boundaries should be understandable from filenames and imports
- the remaining top-level orchestrators should read as composition and coordination layers, not catch-all implementations

Verification expectations:
- run the relevant frontend and iOS tests for the touched runtime flows
- add targeted tests around extracted helpers or services where practical
- confirm no user-facing behavior regressions in the main timer and shell flows

Documentation updates required:
- `docs/architecture.md` if the durable boundary description changes
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/execplan-runtime-boundary-decomposition-feature.md`

Before handing off to review:
- summarize the new boundary map for web and iOS
- identify any intentionally deferred extractions and why they stayed out of scope
- then continue to `02-review-runtime-boundary-decomposition.md`
