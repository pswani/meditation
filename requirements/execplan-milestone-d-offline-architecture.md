# ExecPlan: Milestone D Offline Architecture

## 1. Objective
Establish the minimum offline-first architecture for the current full-stack app so implemented domains can keep working locally, track pending sync work, and reconcile through clean REST boundaries in later prompts.

## 2. Why
The app already has backend-backed persistence for core domains, but current write behavior still assumes live connectivity. Without a shared offline/sync foundation, each feature would need its own ad hoc fallback logic, making the UX noisy and the code harder to trust.

## 3. Scope
Included:
- shared sync domain types for offline queue items and queue state
- queue persistence and queue-reduction helpers with dedupe-friendly behavior
- app-level sync status provider for connection state and pending queue visibility
- calm shell-level sync/offline status messaging
- focused tests for queue persistence and sync-status behavior
- architecture, README, decision, and session-handoff updates

Excluded:
- domain-specific offline queueing for every implemented feature
- backend reconciliation endpoints
- new screen flows or visual redesign
- unrelated `TimerContext` decomposition beyond the sync foundation

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/architecture.md`
- `docs/product-requirements.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/milestone-d-offline-sync-fullstack/01-offline-architecture.md`

## 5. Affected files and modules
- `src/types/sync.ts`
- `src/utils/syncQueue.ts`
- `src/utils/syncQueue.test.ts`
- `src/features/sync/*`
- `src/App.tsx`
- `src/app/AppShell.tsx`
- `README.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- The app shell should calmly tell the user when the device is offline.
- The shell should also surface when pending sync work exists, without turning the app into a dashboard.
- Messaging should stay lightweight and local to the shell, not block meditation flows.
- No core route structure changes are introduced in this prompt.

## 7. Data and state model
- Add a shared sync queue item model with:
  - stable queue id
  - entity type
  - operation type
  - record id
  - queued-at timestamp
  - retry metadata
  - payload snapshot
- Persist the sync queue in browser storage so pending work survives reloads.
- Add an app-level sync status provider that owns:
  - online/offline state
  - queue state
  - queue summary counts
  - storage updates for same-tab and cross-tab visibility

## 8. Risks
- Over-designing the queue too early could make later feature wiring heavier than needed.
- Under-designing the queue could force churn when backend reconciliation arrives.
- Shell messaging must stay calm and not compete with active timer or playlist status banners.

## 9. Milestones
1. Define shared sync types and queue helpers with persistence and dedupe behavior.
2. Add a sync status provider and hook for app-wide online/queue visibility.
3. Integrate calm shell messaging for offline and pending-sync states.
4. Add focused tests.
5. Update docs, handoff, and decisions, then verify and commit.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 11. Decision log
- Keep the first offline foundation frontend-only so the queue model can stabilize before backend reconciliation rules are introduced.
- Use one shared app-level sync provider instead of threading queue state through `TimerContext`, because multiple domains will need the same connection and queue summary later.
- Store full payload snapshots on queue items so later reconciliation can replay the exact intended write without recomputing it from current UI state.

## 12. Progress log
- Completed: source-doc review and milestone prompt alignment.
- In progress: define shared sync queue model and provider foundations.
