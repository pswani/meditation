# 00-create-branch.md

## Goal
Create an isolated branch for the iOS Safari lock-screen timer end-bell defect fix.

## Required reading
Review before changes:
- README.md
- AGENTS.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- requirements/decisions.md
- requirements/session-handoff.md
- PLANS.md

## Actions
1. Ensure working tree is clean.
2. Create a new branch from the current integration branch:
   - `fix/ios-lock-screen-end-bell`
3. Record the branch name in your session notes.

## Output
- Branch created and checked out.
- One-paragraph summary of current behavior reproduced:
  - End bell does not play while iPhone Safari is locked.
  - Bell plays immediately on unlock.
