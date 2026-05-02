# Pranayama Product Spec

Status: planned requirement draft, not yet implemented

Last updated: 2026-05-01

## Overview

Add `Pranayama` as a practice option within the existing meditation practice flow. The feature should support calm, guided, ratio-based breathing routines with visible phase guidance, distinct non-spoken sounds, clear progress feedback, and accurate session logging across web and iPhone.

This first product definition intentionally excludes technique-specific practices such as `Ujjayi` and `Nadi Shodhana`. The first release should focus on high-quality preset routines, not a fully open-ended breathwork builder.

## Product goals

- Let users choose `Pranayama` from the same practice flow used for meditation
- Offer a small set of built-in, high-quality guided breathing presets
- Keep the setup flow simple, calm, and understandable
- Provide phase-by-phase audio and visual guidance during active practice
- Preserve timer correctness across pause, resume, early end, backgrounding, and device lock
- Save the exact performed pattern in `session log` history

## Non-goals

- No technique-specific pranayama instruction in v1
- No user-created custom presets in v1
- No spoken cues
- No haptics
- No mid-session configuration changes
- No Pranayama-specific analytics or history filters in v1

## Presets

Day-one presets:

- `Equal Breath`
- `Extended Exhale`
- `Box Breath`
- `Pranayama 1:4:2:x`

Preset definitions:

- `Equal Breath`
  - inhale and exhale are equal
  - base unit is user-editable
  - hold-in and hold-out are editable
  - hold phases default to `2 seconds`
- `Extended Exhale`
  - inhale and exhale use a curated unequal pattern with longer exhale
  - base unit is user-editable
  - hold-in and hold-out are editable
  - hold phases default to `2 seconds`
- `Box Breath`
  - all four phases are directly editable
- `Pranayama 1:4:2:x`
  - inhale is the editable base unit
  - hold-in is `4x` the base
  - exhale is `2x` the base
  - hold-out (`bahya kumbhaka`) is directly editable in seconds

Default preset:

- `Pranayama 1:4:2:x`

Default values:

- base unit: `5 seconds`
- `bahya kumbhaka` default: `2 seconds`
- intermediate hold default where applicable: `2 seconds`

## Terminology

Primary in-product labels should use plain English. Sanskrit terms may appear in helper text, onboarding text, or educational support content.

Preferred phase labels:

- `Inhale`
- `Hold`
- `Exhale`
- `Hold Out`

Helpful Sanskrit support terms:

- `Puraka` for inhale
- `Kumbhaka` for breath retention
- `Bahya Kumbhaka` for hold after exhale

## Setup flow

The setup flow should be:

1. Choose `Pranayama`
2. Choose a preset
3. Review a live summary of the derived phases
4. Adjust permitted values
5. Choose either `cycle count` or `duration`
6. Start the session

Example live summary:

- `Inhale 5s / Hold 20s / Exhale 10s / Hold Out 2s`

The app should remember the last-used Pranayama setup for the next session.

## Editing model

Editing rules by preset:

- `Equal Breath`: base unit plus editable hold-in and hold-out
- `Extended Exhale`: base unit plus editable hold-in and hold-out
- `Box Breath`: all four phases
- `Pranayama 1:4:2:x`: base unit plus `bahya kumbhaka`

General control behavior:

- stepper increment/decrement: `1 second`
- allowed editable time range: `4` to `48` seconds
- `cycle count` is the source of truth
- when cycle count changes, total duration updates immediately
- when total duration changes, cycle count rounds to the nearest whole cycle
- the UI does not need to explicitly explain that rounding

## Active session experience

The active Pranayama screen should prioritize:

- current phase countdown
- current phase label
- current cycle / total cycles
- total session progress

### Visual guidance

If feasible, the session should include an animated ring that reflects the current phase:

- expand on inhale
- remain steady on hold-in
- contract on exhale
- remain steady on hold-out

### Cycle behavior

- a cycle is completed at the end of `hold-out`
- only completed cycles count toward logged completion
- partial cycles are not counted as completed cycles

### Pause and resume

- the user may pause, resume, or end early
- if the session is paused mid-phase, resume should restart from the current inhale count rather than resume from the exact second remaining

### Session configuration lock

Once a session starts:

- users may not edit the active phase configuration
- users may only pause, resume, end early, or complete the session
- to practice with different settings, the user must end and start a new session

## Sound behavior

Audio should be calm, non-spoken, and optional.

Required cues:

- one preparatory cue before the first inhale
- one distinct cue at each phase start
- one distinct closing bell at session completion

Sound design rules:

- the cues may belong to the same sound family
- the cues should still be clearly distinguishable from each other
- spoken guidance is not allowed in v1
- haptics are not required in v1
- the user must be able to mute Pranayama sounds

## Warnings and safeguards

The product should allow supported value combinations within the configured bounds, but should show soft, non-blocking inline guidance while the user edits settings.

Warning philosophy:

- minimal
- calm
- simple
- not alarmist
- medically grounded where practical

Approved warning copy:

- `If you feel dizzy or light-headed, pause and return to a comfortable breath.`

Warning triggers should include:

- long holds
- long total cycle durations
- strong inhale/exhale imbalance
- other combinations considered more advanced by the product

Reference guidance for warning tone:

- NHS and hospital breathing guidance commonly recommends pausing or resting if exercises cause dizziness
- slower breathing and prolonged exhale are commonly used for calming
- over-breathing can contribute to lightheadedness

Sources:

- [Cambridge University Hospitals](https://www.cuh.nhs.uk/patient-information/breathing-exercises/)
- [Hull University Teaching Hospitals](https://www.hey.nhs.uk/patient-leaflet/active-cycle-of-breathing-technique-acbt-secretion-clearance-technique/)
- [Harvard Health](https://www.health.harvard.edu/heart-health/breathing-exercises-to-lower-your-blood-pressure)
- [Cleveland Clinic](https://my.clevelandclinic.org/health/diseases/hyperventilation)

## Completion behavior

When the final cycle completes:

- play a distinct closing bell
- show a completion screen
- do not auto-return to the normal post-session flow
- do not require a forced acknowledgment step

The completion state should remain visible until the user chooses the next action.

## Session logging

Each Pranayama `session log` should capture:

- preset name
- actual phase values used
- target cycle count
- completed cycle count
- derived total duration
- whether the session was paused
- whether the session ended early
- sound enabled or muted state when relevant

Pranayama history does not need separate summary or filter treatment in v1.

## Platform-specific requirements

### iPhone

- the session should continue if the phone locks
- bells should continue while the phone is locked
- the app should try to prevent auto-lock during active Pranayama

### Web

- if browser backgrounding may reduce timer or audio reliability, the app should warn before the session starts
- the active session should continue to attempt truthful timing behavior while the page remains runnable

## Validations

### Required validations

- a preset must be selected before starting
- `cycle count` or `duration` must resolve to at least one complete cycle
- all editable time values must remain within the supported range
- derived total duration must stay consistent with the chosen preset definition
- muted audio must not block visual guidance or timer correctness

### Behavior validations

- changing cycle count immediately updates duration
- changing duration updates cycle count using nearest-whole-cycle rounding
- the live summary always reflects the actual derived phase values
- completed-cycle counting occurs only at the end of `hold-out`
- ending early preserves actual completed-cycle count without inventing partial completion
- restart after pause begins again from the current inhale count

## Edge cases

- user changes duration to a value that maps between two whole-cycle counts
- user pauses during `hold-out`
- user ends early after finishing `exhale` but before finishing `hold-out`
- user locks the iPhone during a long retention phase
- user backgrounds the web tab before the final bell
- user mutes sound but still expects the ring and timers to guide the session
- saved last-used setup points to a preset whose values were previously edited

## User stories

- As a practitioner, I want to choose `Pranayama` from the normal practice flow so it feels like part of the same app experience.
- As a practitioner, I want to start from a trusted preset instead of building a routine from scratch.
- As a practitioner, I want to see a step-wise timer and cycle progress so I can stay with the breath instead of doing mental counting.
- As a practitioner, I want distinct bells at each phase transition so I can practice with eyes closed.
- As a practitioner, I want the session to continue while my phone is locked so the practice remains uninterrupted.
- As a practitioner, I want the app to log the exact breathing pattern I used so my history remains trustworthy.

## Acceptance criteria

### Setup

- `Pranayama` appears as a practice option in the same practice flow as meditation
- the user can choose from exactly the four approved presets
- the setup screen shows a live summary of the derived phases
- the user can control either cycle count or total duration
- the app remembers the last-used Pranayama setup

### Active session

- the session screen shows phase countdown, phase label, cycle progress, and total progress
- a phase transition cue plays at each phase start unless sound is muted
- a preparatory cue plays before the first inhale
- a distinct closing bell plays on completion unless sound is muted
- the animated ring reflects inhale, hold, exhale, and hold-out if the implementation can support it cleanly

### Reliability

- locking the iPhone does not intentionally terminate the active session flow
- the product attempts to prevent auto-lock during active Pranayama on iPhone
- web setup warns when browser background behavior may reduce timer or audio reliability

### Logging

- completed sessions save the preset and actual phase values used
- early-ended sessions save only completed cycles
- paused sessions retain pause-related completion truth in the logged result

## Out of scope

- `Ujjayi`
- `Nadi Shodhana`
- user-authored presets
- favorites for Pranayama presets
- spoken coaching
- haptic cues
- in-session editing of routine values
- Pranayama-specific analytics or filters
