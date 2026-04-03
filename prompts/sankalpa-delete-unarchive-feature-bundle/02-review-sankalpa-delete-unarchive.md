# 02-review-sankalpa-delete-unarchive.md

## Goal
Review the `sankalpa` delete and unarchive slice for correctness, trust, and scope.

## Review checklist
1. Product UX
   - Are delete actions explicit and safely confirmed?
   - Is unarchive wording calm and clear?
   - Are restored states understandable to the user?

2. Technical correctness
   - Do restored `sankalpa` states follow existing goal-window rules?
   - Do local-first persistence and backend persistence stay aligned?
   - Any risk of duplicate queue replay or stale state resurrection?

3. Scope discipline
   - No unrelated refactors.
   - Changes limited to `sankalpa` delete/unarchive behavior, tests, and docs.

4. Tests and docs
   - Focused tests cover the load-bearing rules.
   - Durable docs and session handoff are updated.

## Output format
Findings by severity:
- blocker
- high
- medium
- low

If clean: "No blocker/high/medium findings."
