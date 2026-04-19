# Test: Timer Preserve End Bell

Run focused tests first:

```bash
npm run test -- --run src/features/timer/TimerContext.test.tsx src/features/timer/timerSoundPlayback.test.tsx src/features/timer/foregroundCatchUp.test.ts src/utils/timerCompletionNotice.test.ts
```

Then run:

```bash
npm run typecheck
npm run lint
npm run test
```

When practical, run a local browser check with a short timer and end sound while the tab or window is not focused.

If a deterministic verification step fails, diagnose at `bundle-implementation` effort before rerunning.
