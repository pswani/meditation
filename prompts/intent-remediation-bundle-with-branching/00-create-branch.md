Read AGENTS.md, PLANS.md, README.md, requirements/intent.md, docs/product-requirements.md, docs/architecture.md, docs/ux-spec.md, docs/screen-inventory.md, requirements/roadmap.md, requirements/decisions.md, and requirements/session-handoff.md.

Then:
1. inspect the current git state, current branch, and working tree
2. confirm prompts 1 and 2 were already completed and produced:
   - a requirement-audit document
   - a pending-work inventory document
3. if those documents are not at the default paths below, locate the actual generated files and record their exact paths for the rest of the bundle:
   - docs/review-intent-compliance-full-app.md
   - docs/pending-work-inventory.md
4. create a new feature branch from the appropriate parent branch for this bundle, preferably `main`, with a clear name such as `codex/intent-remediation-bundle`
5. do not implement product code changes in this step
6. update requirements/session-handoff.md with:
   - the parent branch
   - the feature branch
   - the resolved audit and pending-work document paths
   - the exact recommended next prompt
7. commit only the branch-setup and handoff updates with a clear message such as `chore(branch): start intent remediation bundle`

