Read AGENTS.md, README.md, PLANS.md, requirements/intent.md, docs/product-requirements.md, docs/architecture.md, docs/ux-spec.md, docs/screen-inventory.md, `docs/review-intent-compliance-final-pass.md`, requirements/roadmap.md, requirements/decisions.md, and requirements/session-handoff.md. Inspect the current repository for prompt files, review files, execplans, session-handoff artifacts, decisions logs, milestone tracking docs, branch choreography files, and non-functional scripts that exist primarily for feature tracking, tracing, or handoff rather than product functionality.

Then create an ExecPlan and implement a repository cleanup pass whose goal is to keep only:
- functional application code
- meaningful tests
- durable product and developer documentation
- operational scripts still needed to run, verify, build, deploy, or maintain the app

Rules:
1. classify each candidate as delete, keep, or keep but rewrite
2. preserve durable docs such as README, product requirements, architecture, UX, screen inventory, and production runbooks if still useful
3. update AGENTS.md and any surviving docs so they no longer require deleted tracking artifacts
4. reconcile any already-deleted files in the working tree without restoring obsolete tracking artifacts
5. do not remove tests, runtime scripts, or docs that still serve real maintenance value

Verification:
- run `npm run typecheck`
- run `npm run lint`
- run `npm run test`
- run `npm run build`
- run relevant backend verification if cleanup touches backend scripts or setup docs

After completion:
1. provide a deletion summary grouped by category
2. list intentionally retained non-code files and why
3. update remaining docs for internal consistency
4. commit with a clear message such as `chore(repo): remove feature-tracking and handoff artifacts`

