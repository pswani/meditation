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

1. Review the implemented open-ended timer feature from:
   - UX/usability
   - timer clarity
   - data-model cleanliness
   - code quality
   - responsive behavior
   - consistency with the rest of the timer flow

2. Evaluate specifically:
   - whether the open-ended mode is easy to discover
   - whether it is clearly differentiated from fixed-duration mode
   - whether the active timer feels calm and understandable
   - whether elapsed time is clearly presented
   - whether pause/resume/end behavior is intuitive
   - whether history/session-log representation is understandable
   - whether mobile, tablet, and desktop layouts remain clean

3. Identify:
   - critical issues
   - important issues
   - nice-to-have improvements

4. For each issue, explain:
   - where it appears
   - why it is a problem
   - recommended fix

5. Do not implement code changes in this step.

6. Write findings into:
   - docs/review-open-ended-timer.md
   - requirements/session-handoff.md

7. In session-handoff, include:
   - top findings
   - exact recommended next prompt

8. If only review documentation is changed and you choose to commit it, use:
   docs(timer): review open-ended timer experience
