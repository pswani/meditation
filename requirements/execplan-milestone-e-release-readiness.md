# ExecPlan: Milestone E Release Readiness

## 1. Objective
Prepare the repository for a release-candidate handoff by verifying that the documented local setup, media, backend/H2, LAN, offline/sync, and release-helper instructions match the current working repository behavior.

## 2. Why
Milestone E should end with a trustworthy handoff state. A release candidate is not just passing code; it also needs operator-facing instructions that are accurate, calm, and grounded in the real helper commands and runtime behavior available in this repo today.

## 3. Scope
Included:
- create a prompt-specific release-readiness ExecPlan
- audit `README.md` against the current helper scripts and runtime configuration
- tighten any inaccurate or ambiguous release-hand-off guidance
- verify the documented helper commands and startup flows that matter for local release readiness
- rerun the relevant verification suite
- update `requirements/decisions.md` and `requirements/session-handoff.md`
- commit the prompt

Excluded:
- new feature work
- broad UX changes
- CI or deployment platform automation
- production infrastructure changes outside the repo

## 4. Source documents
- AGENTS.md
- PLANS.md
- README.md
- docs/architecture.md
- docs/product-requirements.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md
- prompts/milestone-e-hardening-release/05-release-readiness.md

## 5. Areas to verify
- local install and media setup commands
- frontend and backend local run instructions
- H2 and backend helper-command expectations
- LAN and Wi-Fi guidance if present
- offline and sync guidance if present
- build and preview guidance for release-candidate handoff
- remaining release blockers versus known non-blocking limitations

## 6. Risks
- README can drift into contradictory stories when dev and preview behavior differ
- helper commands can look correct while hiding subtle environment assumptions
- release-readiness notes can understate residual product limitations if blockers and non-blockers are not separated clearly

## 7. Milestones
1. Audit the current README and helper scripts for setup and runtime accuracy.
2. Create the prompt 05 ExecPlan and patch any release-readiness documentation gaps.
3. Verify helper commands and rerun the full relevant verification suite.
4. Record the release-readiness outcome, blockers, and next step in handoff docs.
5. Commit with the required release-readiness message.

## 8. Verification plan
- `npm run media:setup`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run build:app`
- `mvn -Dmaven.repo.local=../local-data/m2 test`
- `mvn -Dmaven.repo.local=../local-data/m2 verify`
- local startup smoke for documented frontend, backend, and preview helper flows
- `curl` checks against the started local endpoints where practical

## 9. Decision log
- Prefer clarifying documentation over changing helper scripts unless the scripts themselves contradict the verified runtime behavior.
- Treat release-readiness as local release-candidate handoff quality, not a claim of full production completeness.
- Clarify early in the README that Vite preview is network-accessible but does not proxy `/api`, so connected preview verification requires a build produced with `VITE_API_BASE_URL` unless the backend is served from the same origin.
- Treat the remaining known limitations as non-blocking for this local release-candidate handoff because the core local full-stack workflow, helper commands, media setup, LAN reachability, and offline/sync guidance are now verified and internally consistent.

## 10. Progress log
- Completed: reviewed the release-readiness prompt and audited the current README, Vite config, helper scripts, and backend runtime config.
- Completed: tightened README guidance where preview and connected-backend behavior needed clearer wording.
- Completed: verified helper and quality commands successfully:
  - `npm run media:setup`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `npm run build:app`
  - `mvn -Dmaven.repo.local=../local-data/m2 test`
  - `mvn -Dmaven.repo.local=../local-data/m2 verify`
- Completed: smoke-tested default local helper startup flows:
  - `npm run dev:backend`
  - `npm run dev:frontend`
  - `npm run preview:app`
- Completed: verified reachable local URLs for release handoff:
  - localhost backend health `http://localhost:8080/api/health`
  - localhost dev frontend `http://localhost:5173/`
  - localhost dev proxy health `http://localhost:5173/api/health`
  - localhost preview frontend `http://localhost:4173/`
  - LAN backend health `http://192.168.68.76:8080/api/health`
  - LAN dev frontend `http://192.168.68.76:5173/`
  - LAN preview frontend `http://192.168.68.76:4173/`
- Completed: confirmed no new release blockers for the local release-candidate handoff beyond already documented non-blocking product limitations and the existing Flyway/H2 compatibility warning.
