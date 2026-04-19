# Group Test: Timer Background End Bell

Run deterministic verification with the `verification` reasoning profile.

## Commands

Start with focused tests:

```bash
npm run test -- --run src/features/timer/TimerContext.test.tsx src/features/timer/timerSoundPlayback.test.tsx src/features/timer/foregroundCatchUp.test.ts src/utils/timerCompletionNotice.test.ts
```

Then run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Manual Browser Check

When practical:

- Start the local app.
- Configure a short fixed timer with an end sound.
- Start it from a visible tab.
- Switch focus to another tab/window before completion.
- Confirm the end bell plays if the browser keeps the page runnable.
- Return to the app and confirm completion messaging is calm and accurate.

If verification fails, diagnose at high effort before rerunning.
