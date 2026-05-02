# Pranayama Product Spec

Status: requirements finalized, not yet implemented

Last updated: 2026-05-02

## Overview

Add `Pranayama` as a practice option within the existing meditation practice flow. The feature should support calm, guided, ratio-based breathing routines with visible phase guidance, distinct non-spoken sounds, clear progress feedback, and accurate session logging across web and iPhone.

This first release focuses on high-quality preset routines, not a fully open-ended breathwork builder. Technique-specific practices such as `Ujjayi` and `Nadi Shodhana` are intentionally excluded.

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
- No Android support in v1

## Presets

Day-one presets:

- `Equal Breath`
- `Extended Exhale`
- `Box Breath`
- `Pranayama 1:4:2`

### Preset definitions

**`Equal Breath`**
- Inhale and exhale are equal in duration (= base unit)
- Base unit is user-editable (range: 4–48 seconds)
- Hold-in and hold-out are independently editable (range: 0–48 seconds)
- Hold phases default to `2 seconds`
- Setting a hold to `0` disables that phase; its label and cue are suppressed for that cycle

**`Extended Exhale`**
- Inhale:exhale ratio is `1:2` (exhale = 2× base unit)
- Base unit is user-editable (range: 4–48 seconds)
- Hold-in and hold-out are independently editable (range: 0–48 seconds)
- Hold phases default to `2 seconds`
- Setting a hold to `0` disables that phase

**`Box Breath`**
- All four phases are independently and directly editable
- Inhale and exhale range: 4–48 seconds; hold-in and hold-out range: 0–48 seconds
- All four phases default to `5 seconds`
- Setting a hold to `0` disables that phase

**`Pranayama 1:4:2`**
- Inhale = base unit (user-editable, range: 4–48 seconds)
- Hold-in = 4× base (derived, not directly editable)
- Exhale = 2× base (derived, not directly editable)
- Hold-out (`Bahya Kumbhaka`) is directly editable (range: 0–48 seconds); aids the transition between the exhale and the next inhale
- Hold-out defaults to `2 seconds`

### Default preset

`Pranayama 1:4:2`

### Default values on first run

| Field | Value |
|---|---|
| Preset | `Pranayama 1:4:2` |
| Base unit | `5 seconds` |
| Bahya Kumbhaka | `2 seconds` |

On subsequent sessions the app restores the last-used setup (see [Setup flow](#setup-flow)).

## Terminology

Primary in-product labels use plain English. Sanskrit terms may appear in helper text, onboarding text, or educational support content only.

Preferred phase labels:

- `Inhale`
- `Hold`
- `Exhale`
- `Hold Out`

Sanskrit support terms (helper/educational use only):

- `Puraka` — inhalation
- `Kumbhaka` — breath retention (hold after inhale)
- `Bahya Kumbhaka` — external retention (hold after exhale)

## Setup flow

1. Choose `Pranayama` from the practice selection screen
2. Choose a preset
3. Review a live summary of the derived phases
4. Adjust permitted values
5. Choose either `cycle count` or `duration`
6. Start the session

Example live summary:

> `Inhale 5s / Hold 20s / Exhale 10s / Hold Out 2s`

Phases set to `0 seconds` are omitted from the live summary.

The app remembers the last-used Pranayama setup and restores it at the start of the next setup flow.

## Editing model

### Editable fields by preset

| Preset | Editable fields |
|---|---|
| `Equal Breath` | Base unit; hold-in; hold-out |
| `Extended Exhale` | Base unit; hold-in; hold-out |
| `Box Breath` | Inhale; hold-in; exhale; hold-out |
| `Pranayama 1:4:2` | Base unit; hold-out (Bahya Kumbhaka) |

### Ranges

| Field type | Range |
|---|---|
| Base unit / inhale / exhale | 4–48 seconds |
| Kumbhaka (any hold phase, directly editable) | 0–48 seconds |

### Control behavior

- Stepper increment/decrement: `1 second`
- Changing a base unit immediately updates all derived phases and the live summary
- `Cycle count` is the source of truth
- Changing cycle count immediately updates total duration
- Changing total duration updates cycle count by rounding to the nearest whole cycle (no UI explanation of rounding required)

### Cycle count

| | Value |
|---|---|
| Default | `6` |
| Minimum | `1` |
| Maximum | `49` |

A cycle is one complete pass through all active phases: Inhale → Hold (if > 0) → Exhale → Hold Out (if > 0). Cycles with all holds disabled still count as complete cycles.

## Active session experience

The active Pranayama screen must display:

- Current phase countdown (seconds remaining in this phase)
- Current phase label (`Inhale`, `Hold`, `Exhale`, `Hold Out`)
- Current cycle / total cycles
- Total session progress

### Visual guidance

The session should include an animated ring reflecting the current phase:

- Expand on Inhale
- Remain steady on Hold
- Contract on Exhale
- Remain steady on Hold Out

This is required if the implementation can support it cleanly; it must not compromise timer accuracy.

### Cycle behavior

- A cycle completes at the end of `Hold Out` (or at the end of `Exhale` if Hold Out = 0)
- Only completed cycles count toward session completion
- Partial cycles are not counted

### Pause and resume

- The user may pause, resume, or end early at any time
- Resuming after a pause restarts from the **beginning of the current cycle's Inhale phase** (not from the exact second remaining in the paused phase)

### Session configuration lock

Once a session starts, configuration is locked. Users may only pause, resume, end early, or complete. To use different settings the user must end the session and start a new one.

## Sound behavior

Audio is calm, non-spoken, and optional.

### Required cues

| Cue | When |
|---|---|
| Preparatory | Once, before the first Inhale |
| Phase-start | At the start of each active phase per cycle |
| Closing bell | Once, on final cycle completion |

### Timing

The preparatory cue plays first. After a fixed `1-second` silence, the first Inhale phase-start cue plays and the session timer begins.

Phases set to `0 seconds` do not receive a phase-start cue.

### Sound design rules

- All cues belong to the same sound family (bell/singing-bowl character)
- Each cue is clearly distinguishable from the others by pitch or resonance
- No spoken content
- No haptics required in v1
- The user must be able to mute all Pranayama sounds independently
- Muting does not affect visual guidance or timer correctness

Sound assets must be created. See [Appendix A — Sound synthesis specification](#appendix-a--sound-synthesis-specification).

## Warnings and safeguards

Warnings are soft, non-blocking, and shown inline as the user edits settings.

### Warning trigger

Display the approved warning copy when **any active phase duration exceeds 48 seconds**.

For `Pranayama 1:4:2` this threshold is reached by:
- Hold-in (4× base) when base > 12 seconds
- Exhale (2× base) when base > 24 seconds

### Warning philosophy

- Minimal
- Calm
- Simple
- Not alarmist
- Medically grounded

### Approved warning copy

> `If you feel dizzy or light-headed, pause and return to a comfortable breath.`

### Reference sources

- [Cambridge University Hospitals — Breathing exercises](https://www.cuh.nhs.uk/patient-information/breathing-exercises/)
- [Harvard Health — Breathing exercises to lower blood pressure](https://www.health.harvard.edu/heart-health/breathing-exercises-to-lower-your-blood-pressure)
- [Cleveland Clinic — Hyperventilation](https://my.clevelandclinic.org/health/diseases/hyperventilation)

## Completion behavior

### Normal completion (all cycles finished)

1. Play the closing bell
2. Show the completion screen (see below)
3. Do not auto-return to the post-session flow
4. Do not require a forced acknowledgment step

### Early end

1. Show the same completion screen with actual completed-cycle count
2. Do not play the closing bell on early end
3. Partial cycles are not counted

### Completion screen content

**Session summary:**

| Field | Value shown |
|---|---|
| Preset name | e.g. `Pranayama 1:4:2` |
| Phase pattern used | e.g. `Inhale 5s / Hold 20s / Exhale 10s / Hold Out 2s` |
| Cycles completed | e.g. `6 of 6` or `4 of 6` |
| Total time | Derived from completed cycles × cycle duration |
| Ended early | Yes / No |

**Available action:**

- `Return to practice selection` — navigates to the practice selection screen

The completion screen remains visible until the user chooses this action.

## Session logging

Each Pranayama session log entry captures:

| Field | Notes |
|---|---|
| Preset name | As selected |
| Actual phase values used | All four phases in seconds (0 if disabled) |
| Target cycle count | As configured |
| Completed cycle count | Only fully completed cycles |
| Derived total duration | Completed cycles × cycle duration |
| Ended early | Boolean |
| Paused | Boolean |
| Sound enabled | Boolean at session start |

Pranayama history does not require separate summary or filter treatment in v1.

Persistence follows the same local-first model as the existing meditation session log.

## Platform-specific requirements

### iPhone

- The session must continue if the phone locks during practice
- Phase-start bells and the closing bell must play while the phone is locked
- The app must attempt to prevent auto-lock during an active Pranayama session

### Web

- An inline note is shown in the setup flow, just above the Start button, on all browsers:

  > *For best results, keep this tab active during practice. Browsers may limit timing accuracy and audio when the tab is in the background.*

- The active session continues to attempt accurate timing while the page remains runnable
- No special action is taken if the tab is backgrounded mid-session beyond best-effort timer correction

## Validations

### Required validations

- A preset must be selected before starting
- Cycle count or duration must resolve to at least one complete cycle
- All directly editable values must remain within their supported ranges
- Derived total duration must stay consistent with the chosen preset's ratio definition
- Muted audio must not affect visual guidance or timer correctness

### Behavior validations

- Changing cycle count immediately updates displayed duration
- Changing duration updates cycle count via nearest-whole-cycle rounding
- The live summary always reflects actual derived phase values
- Disabled phases (= 0s) are omitted from the live summary and receive no sound cue
- Completed-cycle counting occurs only at the end of the final active phase of a cycle
- Ending early preserves the actual completed-cycle count; no partial cycles are invented
- Resume after pause restarts from the beginning of the current cycle's Inhale
- Warning appears inline whenever any active phase duration exceeds 48 seconds

## Edge cases

- User changes duration to a value that maps between two whole-cycle counts → round to nearest whole cycle; do not explain the rounding
- User pauses during `Hold Out` → on resume, restart from the beginning of that cycle's Inhale
- User ends early after finishing `Exhale` but before finishing `Hold Out` → cycle is not counted as complete
- User locks iPhone during a long hold phase → session and audio continue
- User backgrounds the web tab before the final bell → best-effort continuation; no error state
- User mutes sound → ring animation and phase timer continue unaffected
- User sets hold to `0` → phase and its cue are suppressed; cycle and summary update immediately
- Last-used setup has base value previously edited → restore exact saved values on next setup load

## User stories

- As a practitioner, I want to choose `Pranayama` from the normal practice flow so it feels like part of the same app experience.
- As a practitioner, I want to start from a trusted preset instead of building a routine from scratch.
- As a practitioner, I want to see a step-wise timer and cycle progress so I can stay with the breath instead of doing mental counting.
- As a practitioner, I want distinct bells at each phase transition so I can practice with eyes closed.
- As a practitioner, I want the session to continue while my phone is locked so the practice remains uninterrupted.
- As a practitioner, I want the app to log the exact breathing pattern I used so my history remains trustworthy.

## Acceptance criteria

### Setup

- `Pranayama` appears as a practice option in the same flow as meditation
- The user can choose from exactly the four approved presets
- The setup screen shows a live summary of derived phases; disabled phases are omitted
- The user can control either cycle count or total duration
- The app restores the last-used Pranayama setup on the next session
- The web background warning note appears above the Start button on all browsers

### Active session

- The session screen shows phase countdown, phase label, cycle progress, and total progress
- A phase-start cue plays at the start of each active phase unless sound is muted
- A preparatory cue plays 1 second before the first Inhale cue
- A distinct closing bell plays on normal completion unless sound is muted
- No closing bell plays on early end
- The animated ring reflects Inhale (expand), Hold (steady), Exhale (contract), Hold Out (steady) if the implementation supports it cleanly

### Warnings

- The approved warning copy appears inline whenever any active phase duration exceeds 48 seconds
- The warning is non-blocking; the user may still start the session

### Reliability

- Locking the iPhone does not terminate the active session
- The app prevents auto-lock during active Pranayama on iPhone
- The session attempts accurate timing while the web tab remains runnable

### Logging

- Completed sessions save preset name, actual phase values, target and completed cycle counts, derived duration, paused flag, ended-early flag, and sound state
- Early-ended sessions save only actually completed cycles
- A session with all cycles completed is not marked as ended early

## Out of scope

- `Ujjayi`
- `Nadi Shodhana`
- Android
- User-authored presets
- Favorites for Pranayama presets
- Spoken coaching
- Haptic cues
- In-session editing of routine values
- Pranayama-specific analytics or filters

---

## Appendix A — Sound synthesis specification

### Overview

Six distinct audio assets are required. All belong to the same bell/singing-bowl family. Each is distinguishable by pitch and resonance. No spoken content. Assets are generated once via the synthesis script described below and committed as static files.

### Asset inventory

| Asset ID | Role | Pitch (fundamental) | Duration | Character |
|---|---|---|---|---|
| `cue-prep` | Preparatory — signals session is about to begin | 330 Hz (E4) | 1.5 s | Soft, medium decay — settling |
| `cue-inhale` | Inhale phase start | 528 Hz (~C5) | 0.8 s | Bright, clear — upward feel |
| `cue-hold-in` | Hold-in phase start | 660 Hz (E5) | 0.6 s | Short, stable — settled |
| `cue-exhale` | Exhale phase start | 396 Hz (~G4) | 0.8 s | Softer, mid — releasing |
| `cue-hold-out` | Hold-out phase start | 264 Hz (C4) | 0.5 s | Quiet, low — still |
| `cue-complete` | Closing bell | 432 Hz (~A4) | 3.0 s | Rich, slow decay — arrival |

### Synthesis model

Each asset uses an additive sine synthesis model with an exponential decay envelope:

```
signal(t) = A₁ · sin(2π · f · t) · e^(–t/τ₁)
           + A₂ · sin(2π · 2f · t) · e^(–t/τ₂)
```

Where:
- `f` = fundamental frequency (see table above)
- `A₁ = 1.0` (fundamental amplitude)
- `A₂ = 0.4` (second harmonic amplitude — adds bell body)
- `τ₁` = fundamental decay constant (see per-asset values below)
- `τ₂ = τ₁ × 0.5` (harmonic decays faster, as in physical bells)
- Attack: hard onset (0 ms fade-in); real bells have near-instant attack

### Per-asset decay constants

| Asset ID | τ₁ (seconds) |
|---|---|
| `cue-prep` | 0.8 |
| `cue-inhale` | 0.4 |
| `cue-hold-in` | 0.25 |
| `cue-exhale` | 0.4 |
| `cue-hold-out` | 0.2 |
| `cue-complete` | 1.8 |

### Output specification

| Parameter | Value |
|---|---|
| Sample rate | 44 100 Hz |
| Bit depth | 16-bit PCM |
| Channels | Mono |
| Primary format | `.wav` (source) |
| Web delivery format | `.mp3` (128 kbps) converted from `.wav` |
| iOS delivery format | `.m4a` (AAC 128 kbps) converted from `.wav` |

### Synthesis script (Python)

Dependencies: `numpy`, `scipy` (for WAV output). Runs once to generate all six `.wav` files.

```python
import numpy as np
from scipy.io import wavfile
import os

SAMPLE_RATE = 44100

ASSETS = [
    # (asset_id, freq_hz, duration_s, tau1_s)
    ("cue-prep",      330, 1.5, 0.8),
    ("cue-inhale",    528, 0.8, 0.4),
    ("cue-hold-in",   660, 0.6, 0.25),
    ("cue-exhale",    396, 0.8, 0.4),
    ("cue-hold-out",  264, 0.5, 0.2),
    ("cue-complete",  432, 3.0, 1.8),
]

A1 = 1.0
A2 = 0.4

def synthesize(freq, duration, tau1):
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    tau2 = tau1 * 0.5
    wave = (
        A1 * np.sin(2 * np.pi * freq * t) * np.exp(-t / tau1)
        + A2 * np.sin(2 * np.pi * 2 * freq * t) * np.exp(-t / tau2)
    )
    # Normalize to [-1, 1], then scale to int16
    peak = np.max(np.abs(wave))
    if peak > 0:
        wave = wave / peak
    return (wave * 32767).astype(np.int16)

os.makedirs("sounds", exist_ok=True)

for asset_id, freq, duration, tau1 in ASSETS:
    samples = synthesize(freq, duration, tau1)
    path = f"sounds/{asset_id}.wav"
    wavfile.write(path, SAMPLE_RATE, samples)
    print(f"Written: {path}  ({len(samples)} samples, {duration}s)")

print("Done. Convert .wav → .mp3 and .m4a for delivery.")
```

### Conversion commands (after synthesis)

**WAV → MP3 (web):**
```bash
for f in sounds/*.wav; do
    ffmpeg -i "$f" -codec:a libmp3lame -b:a 128k "${f%.wav}.mp3"
done
```

**WAV → M4A/AAC (iOS):**
```bash
for f in sounds/*.wav; do
    ffmpeg -i "$f" -codec:a aac -b:a 128k "${f%.wav}.m4a"
done
```

### Placement in project

| Platform | Directory |
|---|---|
| Web | `public/sounds/pranayama/` |
| iOS | `ios-native/MeditationApp/Resources/Sounds/Pranayama/` |

### Listening test checklist

Before committing assets, verify by ear:

- [ ] All six cues are clearly distinguishable from each other
- [ ] No cue sounds harsh, sharp, or alarming
- [ ] `cue-complete` feels conclusive and calming relative to phase cues
- [ ] `cue-prep` feels different from `cue-inhale` (it precedes it by 1 second)
- [ ] Playing all six in sequence at 1-second intervals sounds coherent as a family
- [ ] All assets play cleanly at both low and medium device volume
