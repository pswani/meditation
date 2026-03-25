# ExecPlan: Milestone D Release Readiness

## 1. Objective
Prepare the repository for a clean release-candidate handoff by verifying setup and quality workflows, documenting the current app baseline, and identifying the remaining product gaps that still stand between the current build and a fuller v1 candidate.

## 2. Why
Milestone D should end with an honest, easy-to-pick-up handoff state. A release-readiness pass reduces ambiguity for the next contributor by confirming what works today, how to verify it locally, and what still remains intentionally unfinished.

## 3. Scope
Included:
- Verify repository setup and local run instructions against current scripts and workspace structure
- Confirm the release baseline for typecheck, lint, test, and build
- Audit the implemented app surface against the documented product requirements
- Document release-candidate status and remaining v1 gaps in README and requirements docs
- Produce a concise release-readiness summary for handoff

Excluded:
- New feature implementation
- Backend/service introduction
- Broad refactors
- Release packaging or deployment automation

## 4. Source documents
- AGENTS.md
- PLANS.md
- README.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md
- requirements/prompts.md
- prompts/milestone-d-production-readiness/04-release-readiness.md

## 5. Affected files and modules
- `README.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `requirements/execplan-milestone-d-release-readiness.md`

## 6. UX behavior
No intended product behavior changes. This slice should only improve release clarity by documenting:
- what flows are already present
- how to run and verify the app
- which user-facing gaps still remain before a fuller v1 candidate

## 7. Data and state model
No data-model changes intended. The audit should explicitly preserve and document that the current baseline remains:
- front-end only in this repository
- local-first for persistence
- routed through API-style boundaries in selected areas where future backend work is expected

## 8. Risks
- Release docs can accidentally overstate completeness if they do not reflect the real implementation.
- Remaining-gap notes can become misleading if they treat intentional v1 choices as defects.
- Handoff quality suffers if setup and verification guidance diverges from actual package scripts.

## 9. Milestones
1. Audit the prompt, current docs, scripts, and implemented app surface.
2. Write the release-readiness ExecPlan and update README/requirements docs with current status and remaining gaps.
3. Run the full verification suite and confirm the repo is in a clean handoff state.
4. Review the diff and commit the release-candidate handoff slice.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual audit of setup instructions, package scripts, and documented feature surface

## 11. Decision log
- Keep this slice documentation-first and avoid changing product behavior during release handoff.
- Treat the local-first front-end-only architecture as the current baseline, not as a release-blocking defect by itself.
- Call out only concrete remaining product gaps that are still visible from the documented requirements and implementation audit.

## 12. Progress log
- Completed: reviewed prompt 04 and required planning/product docs.
- Completed: audited package scripts, current screen/module surface, and current handoff docs.
- Completed: updated release-readiness docs and remaining-gap inventory.
- Completed: required verification run (`typecheck`, `lint`, `test`, `build`) with all checks passing.
- Pending: review diff and create the release-candidate handoff commit.
