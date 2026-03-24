# ExecPlan: Full-App UX Phase 1 Remediation

## 1. Objective
Implement the highest-priority UX/usability improvements from `docs/ux-review-full-app.md` with bounded scope and no broad redesign.

## 2. Why
The app is functional, but key user flows still have avoidable friction:
- Practice is overloaded for quick-start intent.
- Active session continuity is not visible globally.
- History prioritizes manual-entry UI over recent log review.

Addressing these improves calmness, flow continuity, and confidence across mobile/tablet/desktop.

## 3. Scope
Included:
- Global shell-level active-state resume affordance for timer and playlist run.
- Practice IA rebalance via progressive disclosure for management-heavy sections.
- History content priority change to lead with recent `session log` items and move `manual log` into secondary collapsible section.
- Focused completion-duration copy precision (`mm:ss`) for short-session trust.
- Focused UX tests for changed behavior.

Excluded:
- broad visual redesign
- route-level architecture overhauls beyond this slice
- phase-2/phase-3 polish from full review (relative time, dialog focus trap, reactive sankalpa snapshot, etc.)
- new dependencies

## 4. Source documents
- AGENTS.md
- PLANS.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- docs/ux-review-full-app.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md
- prompts/15-fix-ux-full-app-and-test.md

## 5. Affected files and modules
- `src/app/AppShell.tsx`
- `src/pages/PracticePage.tsx`
- `src/pages/HistoryPage.tsx`
- `src/pages/ActiveTimerPage.tsx`
- `src/index.css`
- `src/App.test.tsx`
- `src/pages/PracticePage.test.tsx`
- `src/pages/HistoryPage.test.tsx`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Shell shows active-state continuity banner with direct resume action when a timer or playlist run is in progress.
- Practice keeps timer setup primary and easy to scan; heavy management tools are available on demand via progressive disclosure.
- History leads with recent logs, then offers manual logging as secondary/collapsible action.
- Completion messages present precise duration text for better trust on short ended-early sessions.

## 7. Data and state model
- Reuse existing timer context state:
  - `activeSession`
  - `activePlaylistRun`
  - `recentLogs`
  - manual log actions
- No persistence-model changes.
- UI state additions are local-only (disclosure/collapse state).

## 8. Risks
- History reorder may break existing tests relying on manual-log-first layout.
- Progressive disclosure could reduce discoverability if copy is unclear.
- Shell active-state UI must remain calm and not compete with primary page heading.

## 9. Milestones
1. Add global shell active-state resume affordance.
2. Rebalance Practice with progressive disclosure of management sections.
3. Reorder History and add secondary collapsible manual-log section.
4. Update completion copy precision.
5. Add/update focused tests.
6. Run verification and update docs.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 11. Decision log
- Implement phase-1 review items first to maximize usability impact while keeping slice bounded.
- Prefer progressive disclosure over major route restructuring in this iteration.
- Keep all changes local-first and avoid dependency additions.

## 12. Progress log
- Completed: prompt/doc review and bounded phase-1 implementation plan.
- Completed: shell active-state continuity banner for timer and playlist runs.
- Completed: Practice IA rebalance with collapsed `Practice Tools`.
- Completed: History logs-first layout with secondary collapsible `manual log` section.
- Completed: completion-copy precision update to `mm:ss`.
- Completed: focused test updates and reliability fixes in touched suites.
- Completed: verification pass (`typecheck`, `lint`, `test`, `build`).
