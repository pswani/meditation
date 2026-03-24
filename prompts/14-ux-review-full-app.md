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

5. Assess the following dimensions in detail:
   - clarity of information architecture
   - discoverability of key actions
   - navigation consistency
   - route naming and user understanding
   - terminology consistency
   - interaction friction
   - form usability
   - validation clarity
   - empty states
   - error states
   - success states
   - feedback for user actions
   - visual hierarchy
   - scanability
   - spacing and density
   - calmness and focus of the design
   - consistency with a meditation product
   - responsiveness across breakpoints
   - tablet usability
   - desktop usability
   - mobile usability
   - accessibility-minded usability issues that are visible from the implementation
   - whether the product feels like a functioning prototype with coherent user journeys

6. Specifically review the major user journeys that are currently possible in the app, such as:
   - entering the app and understanding where to go
   - starting a meditation
   - configuring timer options
   - running, pausing, resuming, and ending a session
   - seeing a session reflected in history
   - using Home as a meaningful launch surface
   - using Settings effectively
   - navigating between screens across device sizes

7. Identify and explain:
   - critical UX/usability issues
   - important UX/usability issues
   - nice-to-have improvements

8. For every major issue, include:
   - where it appears
   - why it is a problem
   - how it affects the user
   - recommended fix
   - whether it is primarily a mobile, tablet, desktop, or all-device issue

9. Provide a prioritized remediation plan:
   - Phase 1: must fix now
   - Phase 2: should fix soon
   - Phase 3: polish later

10. Keep recommendations aligned with the product principles:
   - calm
   - minimal
   - serious
   - focused
   - not bulky
   - not over-gamified
   - not cluttered

11. Do not implement code changes in this step.

12. Write findings into:
   - docs/ux-review-full-app.md
   - requirements/session-handoff.md

13. In session-handoff, include:
   - a concise summary of the top UX findings
   - the highest-priority recommended next implementation slice
   - the exact recommended next prompt to fix the most important UX/usability issues

14. Do not commit application code in this review-only step.
    If you choose to commit documentation-only review artifacts, use:
    docs(ux): review full application usability and experience