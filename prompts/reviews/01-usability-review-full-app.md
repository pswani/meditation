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

1. Review the entire currently implemented application from a UX, usability, and responsive product-design perspective.
2. Act as a principal UX reviewer for a calm, minimal meditation app that must work well across:
   - mobile
   - tablet
   - desktop
3. Evaluate the full application experience, including:
   - app shell
   - navigation
   - Home
   - Practice / Timer Setup
   - Active Timer
   - History
   - Settings
   - any implemented Custom Plays screens
   - any implemented Playlist screens
   - any implemented Sankalpa / summary screens
   - all currently accessible routes and major flows
4. Review the product as an integrated user experience, not as isolated screens.
5. Assess in detail:
   - clarity of information architecture
   - discoverability of key actions
   - navigation consistency
   - terminology consistency
   - interaction friction
   - form usability
   - validation clarity
   - empty, error, and success states
   - feedback for user actions
   - visual hierarchy
   - scanability
   - spacing and density
   - calmness and focus of the design
   - responsiveness across breakpoints
   - mobile, tablet, and desktop usability
   - accessibility-minded usability issues visible from the implementation
   - whether the product feels like a functioning prototype with coherent user journeys
6. Identify and explain:
   - critical issues
   - important issues
   - nice-to-have improvements
7. For every major issue, include:
   - where it appears
   - why it is a problem
   - how it affects the user
   - recommended fix
   - whether it is primarily a mobile, tablet, desktop, or all-device issue
8. Provide a prioritized remediation plan:
   - Phase 1: must fix now
   - Phase 2: should fix soon
   - Phase 3: polish later
9. Do not implement code changes in this step.
10. Write findings into:
   - docs/review-usability-full-app.md
   - requirements/session-handoff.md
11. In session-handoff, include:
   - concise summary of top UX findings
   - highest-priority recommended next implementation slice
   - exact recommended next prompt
12. Do not commit application code in this review-only step.
