Read before testing:
- `AGENTS.md`
- `README.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/session-handoff.md`
- `docs/execplan-screen-decomposition-hardening-feature.md`

Goal:
- Verify the remaining screen and manager decomposition phase thoroughly without widening scope.

Required automated verification:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- run relevant backend verification only if backend code or contracts changed

Required focused checks:
1. Confirm Home still supports quick start, favorites, recent activity, and last-used behavior correctly.
2. Confirm Practice still supports timer setup, `custom play`, playlist, and sound flows correctly.
3. Confirm Goals still supports summary, sankalpa creation or editing, archive handling, and calm fallback messaging correctly.
4. Confirm Settings still supports timer defaults and notification capability or permission messaging correctly.
5. Confirm extracted components and hooks do not regress responsive behavior or key empty states.
6. Confirm no new console errors or broken route rendering appears during a local smoke test if practical.

Artifact requirement:
- Create or update `docs/test-screen-decomposition-hardening-feature.md` with concise verification results.

Output requirements:
- Report pass or fail for each required command.
- Report pass or fail for each focused screen or manager check.
- Call out any residual risk that still needs manual validation.

