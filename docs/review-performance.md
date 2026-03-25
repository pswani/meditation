# Performance Review

## Scope reviewed
- app shell and route-level render paths
- timer and playlist ticking behavior
- shared context/state propagation
- local persistence frequency
- summary, history, and sankalpa derivation paths
- current dependency footprint and visible bundle-shape concerns

## Scope note
This workspace currently contains front-end code only. No backend request handlers, H2 access paths, or server-side media-loading logic are present here, so backend- and H2-specific performance review areas were not applicable in this pass.

## Review lens
- unnecessary re-renders
- wasteful state updates
- persistence frequency and serialization overhead
- repeated expensive derivations
- route-level render breadth
- practical list-rendering behavior
- visible bundle-size concerns

## Summary
The app’s current dependency footprint is lean and there are no obvious bundle-size red flags from the repo structure alone. The main performance risk is architectural rather than algorithmic: active timer and playlist runs update shared context on every 500ms tick, and those same ticks are also persisted to localStorage through effect chains. That means one active practice flow can trigger repeated storage writes and unnecessary rerenders outside the active screen itself.

The next tier of risk is derivation cost. Summary, sankalpa, and history filtering logic are all reasonable for small datasets, but several helpers repeatedly scan the full session-log array. That is acceptable in the current prototype, but it becomes a more practical issue once the app stops truncating history and begins preserving the full local `session log` set.

## What is working well
- Dependency footprint is small:
  - `react`
  - `react-dom`
  - `react-router-dom`
- History rendering is bounded in the UI with `visibleCount`, which avoids an immediate need for virtualization.
- Many derived values are already wrapped in `useMemo`, which keeps the current small-data prototype workable.
- There are no visible over-fetching or network waterfall issues because the current workspace remains local-first.

## Findings

### Critical

1. Active timer and playlist snapshots are persisted on every tick.
- Where it appears:
  - `src/features/timer/TimerContext.tsx`
- User impact:
  - avoidable main-thread work during active practice
  - higher battery use on mobile
  - increased risk of jank while browsing other screens during a running timer or playlist
- Likely root cause:
  - active timer and active playlist state are updated every 500ms
  - persistence effects depend on those changing objects and write snapshots to localStorage each time they change
- Recommended fix:
  - persist only on meaningful lifecycle transitions:
    - start
    - pause
    - resume
    - end
    - recovery-clear
  - if periodic persistence is still required for crash recovery, throttle it far more coarsely than the UI tick rate
  - keep countdown display updates ephemeral and separate from storage frequency

### Important

1. One ticking context causes unnecessary rerenders across unrelated screens.
- Where it appears:
  - `src/features/timer/TimerContext.tsx`
  - `src/features/timer/timerContextObject.ts`
  - `src/app/AppShell.tsx`
  - `src/pages/HistoryPage.tsx`
- User impact:
  - when a timer or playlist is active, screens like History still rerender every tick even if the user is not interacting with the timer itself
  - this wastes work and can make non-practice screens feel less stable on slower devices
- Likely root cause:
  - a single context value contains both fast-changing ticking state and slower-changing collections/settings
  - the context value object and callback set are recreated whenever the main timer state changes
- Recommended fix:
  - split fast-ticking runtime state from slower domain data
  - use smaller contexts or selector-style subscriptions so routes that only need `sessionLogs` or settings do not rerender on every countdown update

2. Timer and playlist interval effects are recreated every tick.
- Where it appears:
  - `src/features/timer/TimerContext.tsx`
- User impact:
  - avoidable timer setup/teardown churn during active practice
  - extra scheduling overhead on top of the render and persistence cost
- Likely root cause:
  - the effects depend on `state.activeSession` and `activePlaylistRun`, whose object identities change on every tick
  - each update tears down and recreates the interval instead of running one stable interval while the flow is active
- Recommended fix:
  - drive ticking from a stable active-session/run key plus pause state
  - keep mutable timing details in refs or reducer state that do not require interval recreation

3. Summary and sankalpa derivations scale with repeated full-array scans.
- Where it appears:
  - `src/utils/summary.ts`
  - `src/utils/sankalpa.ts`
  - `src/pages/SankalpaPage.tsx`
  - `src/pages/HistoryPage.tsx`
- User impact:
  - summary/goals screens will get slower as log history grows
  - filter changes and goal rendering will do more work than necessary once full history is retained
- Likely root cause:
  - summary helpers repeatedly filter and reduce the same session-log array for each grouping
  - sankalpa progress computes per-goal full-array scans
  - history filters recompute from the full log set whenever the page rerenders
- Recommended fix:
  - move toward single-pass aggregation for summaries
  - pre-group logs by relevant dimensions when building derived snapshots
  - consider memoized indexing by `endedAt`, `source`, `status`, and goal-relevant fields once the retention bug is fixed

### Low-Priority Polish

1. Home bypasses the shared sankalpa boundary and reloads persisted data on mount.
- Where it appears:
  - `src/pages/HomePage.tsx`
- User impact:
  - small avoidable work on mount
  - limited opportunity for shared caching or consistent derivation reuse
- Likely root cause:
  - Home reads `loadSankalpas()` directly instead of consuming a shared in-memory source
- Recommended fix:
  - route Home through the same shared sankalpa boundary/state used elsewhere

2. Route-level render trees are large enough that current context churn has a wider blast radius than necessary.
- Where it appears:
  - `src/pages/SankalpaPage.tsx`
  - `src/features/customPlays/CustomPlayManager.tsx`
  - `src/features/playlists/PlaylistManager.tsx`
- User impact:
  - more UI work per rerender than needed
  - slower incremental interaction scaling as features grow
- Likely root cause:
  - large route/manager components combine state, derivations, and view logic in one render path
- Recommended fix:
  - extract stable presentational sections once the next implementation slices touch these areas

3. No urgent bundle-size issue is visible from repo structure alone.
- Where it appears:
  - `package.json`
- User impact:
  - none at the moment
- Likely root cause:
  - dependency set is already minimal
- Recommended fix:
  - keep avoiding unnecessary dependencies
  - revisit only if richer media/audio or analytics packages are introduced

## Prioritized remediation plan

### Critical Performance
1. Stop persisting active timer and playlist snapshots on every 500ms tick.
2. Separate ticking display updates from persistence frequency.

### Important Efficiency
1. Split or narrow the shared timer context so unrelated routes do not rerender on every tick.
2. Refactor timer/playlist interval effects so they are not recreated every countdown update.
3. Prepare summary and sankalpa derivations for full-history datasets by reducing repeated full-array passes.

### Low-Priority Polish
1. Route Home through shared sankalpa state/boundaries instead of direct storage reads.
2. Extract stable render subsections from the largest route-level components as they evolve.
3. Continue holding the line on dependency count and bundle growth.

## Overall recommendation
Fix the ticking architecture before chasing smaller optimizations. The most meaningful performance win is to decouple countdown rendering from both localStorage writes and whole-app context churn. After that, the next practical improvement is making summary and sankalpa derivations more efficient ahead of full-history retention.
