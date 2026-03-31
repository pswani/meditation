Read:
- AGENTS.md
- README.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md

Then:

1. Review the timer-related flows and surrounding implementation thoroughly after the defect-fix prompts have been completed.

2. Review across:
   - functional correctness
   - UX clarity
   - persistence and recovery behavior
   - offline/sync safety where timer settings or logs participate
   - code quality
   - state-model cleanliness
   - responsive behavior on mobile, tablet, and desktop

3. Evaluate specifically:
   - default timer ownership between Settings, Home, Practice, and custom play shortcuts
   - active timer runtime and recovery behavior
   - validation and session-log trustworthiness
   - timer-mode-related compatibility and migration safety
   - readability and maintainability of the timer state model

4. Identify:
   - critical issues
   - important issues
   - nice-to-have improvements

5. For each issue, explain:
   - where it appears
   - why it is a problem
   - recommended fix

6. Do not implement code changes in this step.

7. Write findings into:
   - docs/review-timer-defaults-and-runtime-defects.md
   - requirements/session-handoff.md

8. In session-handoff, include:
   - top findings
   - exact recommended next prompt

9. If only review documentation is changed and you choose to commit it, use:
   - `docs(timer): review defaults and runtime defect remediation`
