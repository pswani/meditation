# 01-implement-ios-safari-ux-hardening.md

## Objective
Resolve pending iPhone Safari UX issues identified in `docs/review-ios-safari-ux-issues.md` with a focused, shippable web slice.

## In-scope issues for this slice
1. Notification fallback reachability (permission UX missing)
2. Over-broad Safari guidance copy (noise on non-iPhone contexts)
3. No explicit deferred-completion status after foreground catch-up
4. Potential duplicate foreground catch-up from `visibilitychange` + `pageshow`

## Track selection
### Track A (Recommended): web hardening in current app
Implement all four in-scope issues without introducing native runtime dependencies.

### Track B: native reliability expansion
Only if explicitly requested. Not required for this slice.

## Required implementation outcomes (Track A)
1. **Notification permission UX in Settings**
   - Add a clearly labeled user-controlled action to request notification permission.
   - Show current capability state and permission state.
   - Keep copy calm and explicit about iPhone Safari/PWA limitations.

2. **Targeted Safari guidance**
   - Show lock-screen deferral guidance only when context indicates relevance:
     - iPhone Safari runtime heuristic and/or
     - after first observed deferred-completion event
   - Avoid persistent noisy warnings for unrelated platforms.

3. **Deferred-completion explanation**
   - When a fixed timer finalizes via foreground catch-up (not real-time tick), show one-time explanatory status text.

4. **Foreground event coalescing**
   - Prevent duplicate catch-up processing when both `visibilitychange` and `pageshow` fire close together.

## Architecture constraints
- Keep business logic out of JSX-heavy trees.
- Use reusable helpers for platform detection and notification capability state.
- Avoid unrelated refactors.

## Validation integrity
Do not break existing timer rules:
- duration > 0
- meditation type required
- pause/resume correctness
- session logging correctness

## Tests required
Add/update focused tests for:
- notification permission state and request flow
- guidance visibility rules
- deferred-completion status message behavior
- event coalescing (no duplicate completion handling)

Run:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## Documentation updates required
- update `docs/ux-spec.md`
- update `requirements/decisions.md`
- update `requirements/session-handoff.md`
- add/update verification artifact under `docs/`

## Commit guidance
Suggested commit message:
- `fix(timer): harden ios safari completion ux and notification flows`
