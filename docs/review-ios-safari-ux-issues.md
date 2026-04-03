# iPhone Safari UX Review — Timer + Sound Behavior Risks

Date: 2026-04-03
Scope reviewed:
- `src/features/timer/TimerContext.tsx`
- `src/features/timer/timerSoundPlayback.ts`
- `src/pages/ActiveTimerPage.tsx`
- `src/utils/timerCompletionNotice.ts`
- related timer tests and docs

## Executive summary
The recent mitigation improves foreground catch-up after lock/unlock, but several Safari-specific UX gaps remain that can still create confusing user experience on iPhone. None are app-crashing issues, but there are high-impact trust and expectation mismatches around end-of-session signaling.

---

## Blocker issues
- None.

## High issues

### 1) End bell is still not guaranteed at true completion time while iPhone is locked
**Why this hurts UX**
- Users expect a meditation timer bell exactly at session end.
- iOS Safari background suspension means the app may only detect completion on foreground return.
- Current behavior can feel unreliable even with catch-up.

**Evidence in code**
- Session completion is app-runtime driven (`SYNC_TICK`) and depends on browser execution loop.
- Foreground listeners improve catch-up only *after* returning to Safari.

**Recommended fix direction**
- Set expectation clearly in setup and active flows (not only active flow), and add optional “lock-safe alert unavailable in Safari browser mode” copy.
- For stronger reliability, move to an installable/native notification path with explicit product decision.

### 2) Notification fallback is practically unreachable for many users
**Why this hurts UX**
- `notifyTimerCompletion` only fires when permission is already granted and document is hidden.
- There is no UX path to request permission at an intentional moment.
- Many iPhone Safari users will never grant notification permission, so fallback does nothing silently.

**Evidence in code**
- Permission check requires `Notification.permission === 'granted'`.
- No prompt/request flow in timer setup/settings.

**Recommended fix direction**
- Add an explicit, user-controlled “Enable completion notifications” action in Settings (with clear iPhone/PWA caveats).
- Show current notification capability/permission state.

---

## Medium issues

### 3) Guidance copy appears broadly and may feel noisy on non-iPhone contexts
**Why this hurts UX**
- Current fixed-session guidance displays universally during fixed sessions.
- Desktop/Android users get a Safari-specific warning irrelevant to them.

**Recommended fix direction**
- Gate message by runtime capability/UA heuristic and/or show only after first observed deferral event.

### 4) Foreground catch-up may trigger twice (`visibilitychange` + `pageshow`)
**Why this hurts UX**
- Duplicate catch-up dispatch can cause subtle extra UI churn.
- Current code has protections against duplicate end-sound handling, but event storms can still add noise.

**Recommended fix direction**
- Coalesce events (single-shot catch-up window via timestamp/ref guard).

### 5) No explicit user-visible status when completion was deferred due to lock/background
**Why this hurts UX**
- User hears bell on unlock but may not understand that it was deferred.
- Trust is better when app says “session completed while app was in background; updated on return.”

**Recommended fix direction**
- Add one-time post-return status banner when catch-up finalizes a previously elapsed session.

---

## Low issues

### 6) iPhone Safari real-device validation is still manual and not codified in CI
**Why this matters**
- Browser simulation won’t fully reproduce iOS lock-screen behavior.

**Recommended fix direction**
- Add a repeatable manual QA checklist artifact for release gates and include required device/browser versions.

### 7) No product-facing capability matrix for timer alerts by platform
**Why this matters**
- Users and support teams need clarity on what is guaranteed in Safari-tab, PWA, and native contexts.

**Recommended fix direction**
- Add a concise matrix to docs/settings help text.

---

## Suggested next slice (priority order)
1. Add notification permission UX in Settings + capability status.
2. Add deferred-completion status banner after foreground catch-up completion.
3. Narrow Safari guidance display to relevant contexts.
4. Add event coalescing for foreground catch-up listeners.
