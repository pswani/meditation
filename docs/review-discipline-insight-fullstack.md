# Review: Discipline Insight Full-Stack

## Scope reviewed
- UX and usability across the Milestone C `summary` and `sankalpa` full-stack work
- comprehension and calmness of fallback states
- code quality and maintainability
- REST design and backend hygiene
- performance and change-risk hotspots

## Critical
- None.

## Important
- `sankalpa` saves fall back to browser-only persistence for every API failure, not just network loss. In [useSankalpaProgress.ts](/Users/prashantwani/wrk/meditation/src/features/sankalpa/useSankalpaProgress.ts#L153), any rejected `PUT /api/sankalpas/{id}` path writes the goal into local storage anyway. That means a backend validation mismatch or transient server-side bug can leave the UI tracking a `sankalpa` that the H2-backed source of truth never accepted, which undercuts the milestone’s goal of keeping Home and Sankalpa aligned on backend-owned progress.
- Time-of-day bucketing in the new backend routes depends on the server machine’s timezone, while the frontend fallback paths still use the browser’s local timezone. [SummaryService.java](/Users/prashantwani/wrk/meditation/backend/src/main/java/com/meditation/backend/summary/SummaryService.java#L139), [SankalpaService.java](/Users/prashantwani/wrk/meditation/backend/src/main/java/com/meditation/backend/sankalpa/SankalpaService.java#L147), and the browser helper in [sankalpa.ts](/Users/prashantwani/wrk/meditation/src/utils/sankalpa.ts#L91) can therefore disagree on whether a session belongs to morning, afternoon, evening, or night. On a device whose timezone differs from the backend, the `summary` view and `sankalpa` time-of-day filters can silently change categories between backend-backed and fallback states.

## Nice-to-have
- Degraded `sankalpa` saves are visually presented as success. The fallback message from [useSankalpaProgress.ts](/Users/prashantwani/wrk/meditation/src/features/sankalpa/useSankalpaProgress.ts#L75) is rendered inside the green success banner in [SankalpaPage.tsx](/Users/prashantwani/wrk/meditation/src/pages/SankalpaPage.tsx#L528). The copy is truthful, but the styling makes a local-only fallback look like a clean backend save at a glance, which weakens trust in a feature that is supposed to feel disciplined and reliable.
