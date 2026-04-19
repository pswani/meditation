# Implement: Diagnosis

Use the `bundle-implementation` reasoning profile.

## Objective

Reproduce and diagnose why the ending bell does not play when the app is not in focus.

## Required Reading

Read:

- `src/features/timer/TimerContext.tsx`
- `src/features/timer/timerSoundPlayback.ts`
- `src/features/timer/foregroundCatchUp.ts`
- `src/utils/timerCompletionNotice.ts`
- `src/features/timer/TimerContext.test.tsx`
- `src/features/timer/timerSoundPlayback.test.tsx`
- `docs/ux-spec.md`
- `requirements/decisions.md`

## Diagnosis Targets

Determine whether the defect is caused by:

- timer tick throttling while hidden
- `lastOutcome` processing only after foreground return
- browser audio policy for hidden documents
- unprimed or stale end-sound audio
- notification timing masking or replacing the bell
- duplicate guards suppressing playback after catch-up

Add a failing or characterization test before changing behavior when practical.
