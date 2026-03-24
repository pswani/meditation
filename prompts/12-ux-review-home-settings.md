Read:
- AGENTS.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md

Then:

1. Review the currently implemented Home and Settings screens in the context of the full responsive app shell.

2. Act as a principal UX reviewer for a calm meditation app that must work well across:
   - mobile
   - tablet
   - desktop

3. Evaluate:
   - clarity of hierarchy
   - ease of navigation
   - usefulness of Home content
   - usefulness of Settings content
   - responsive behavior
   - spacing and scanability
   - information density
   - empty states
   - labels and terminology
   - whether primary actions are obvious
   - whether the screens feel like a functioning prototype rather than placeholders

4. Identify:
   - critical issues
   - important issues
   - nice-to-have improvements

5. Include specific review comments for:
   - Home
   - Settings
   - navigation/shell integration
   - mobile layout
   - tablet layout
   - desktop layout

6. Do not implement code changes in this step.

7. Write findings into:
   - docs/ux-review-home-settings.md
   - requirements/session-handoff.md

8. In session-handoff, include the exact recommended next prompt for implementing the approved UX fixes.

9. Do not commit code changes in this review-only step unless only documentation files changed and you determine the repo convention is to commit UX review artifacts. If you do commit, use:
   docs(ux): review home and settings experience