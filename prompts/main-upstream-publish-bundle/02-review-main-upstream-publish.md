# 02-review-main-upstream-publish.md

## Goal
Review the `main` upstream publication bundle for safety and scope control.

## Review checklist
1. Publication safety
   - Are the ahead-of-origin commits intentional and understood?
   - Is the working tree clean?
   - Is the verification evidence current enough for publication?

2. Documentation accuracy
   - Does `requirements/session-handoff.md` match the actual merged repo state?
   - Are review/test artifacts sufficient for the current changes?

3. Scope discipline
   - No accidental feature work added during publication prep.
   - Only small release-readiness fixes if needed.

## Output format
Findings by severity:
- blocker
- high
- medium
- low

If clean: "No blocker/high/medium findings."
