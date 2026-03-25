# ExecPlan: Release Readiness

## 1. Objective
Prepare the meditation app repository for a clean release-candidate handoff by validating setup and verification instructions, auditing current behavior against documented requirements, and updating release-facing documentation with an honest readiness summary.

## 2. Why
Milestone D is the final production-readiness pass. The app now has functional vertical slices, hardening, accessibility work, and bounded performance cleanup, so the next high-value step is to make the repository easy to hand off:
- setup instructions should match the actual scripts
- verification steps should be explicit and current
- the current feature set should be compared against the documented product requirements
- remaining gaps should be called out clearly so release expectations stay realistic

## 3. Scope
Included:
- release-readiness audit of setup, run, build, test, and current feature coverage
- concise documentation updates for release handoff
- explicit summary of remaining release-candidate gaps
- verification through the standard quality commands

Excluded:
- new feature implementation
- broad refactors
- backend/service setup beyond documenting current front-end-only status
- speculative polish unrelated to release handoff clarity

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/milestone-d-production-readiness/04-release-readiness.md`

## 5. Affected files and modules
- `README.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- this ExecPlan

## 6. UX behavior
- No user-facing product behavior changes are planned in this slice.
- Release documentation should clearly describe what users and teammates can expect from the current app:
  - functional core flows
  - current local-first assumptions
  - remaining requirement gaps

## 7. Data and state model
- No runtime data-model changes are expected.
- This slice documents the current local-first model:
  - React front end only
  - localStorage persistence
  - mock/local API boundaries for future backend integration

## 8. Risks
- Release docs can drift from actual behavior if the audit is too shallow.
- Overstating readiness would create handoff risk, especially where requirements still exceed implementation.
- Generated verification artifacts in `dist/` and `tsconfig.app.tsbuildinfo` must remain out of the commit.

## 9. Milestones
1. Review scripts, docs, and current repo state.
2. Audit current feature coverage against documented requirements and identify remaining gaps.
3. Update release-facing docs and handoff summary.
4. Run verification commands and confirm current repo instructions remain accurate.
5. Review staged changes and commit the release-readiness handoff.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- manual confirmation that `npm run dev` starts and prints a local URL
- doc review for consistency between requirements, roadmap, and README

## 11. Decision log
- Prefer honest release-candidate documentation over broadening scope with additional implementation.
- Treat missing requirement coverage as release-handoff information, not as work to silently absorb into this prompt.

## 12. Progress log
- 2026-03-24: Reviewed prompt, required docs, package scripts, and current worktree state.
- 2026-03-24: Began release-readiness audit of setup instructions and current feature coverage.
- 2026-03-24: Confirmed current requirement gaps are concentrated in advanced summaries and optional playlist inter-item gaps.
- 2026-03-24: Verified `npm run dev` starts Vite successfully and observed local URL output at `http://localhost:5173/`.
- 2026-03-24: Updated README, roadmap, decisions, and session handoff with release-readiness guidance and gap summary.
- 2026-03-24: Verified with `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.
