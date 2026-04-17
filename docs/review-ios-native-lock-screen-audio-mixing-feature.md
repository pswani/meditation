# Review: iOS Native Lock-Screen Audio Mixing

## Findings
- No correctness findings identified in this review.

## Notes
- The playback policy now uses `.playback` with `.mixWithOthers`, which matches the requested competing-audio behavior without regressing the earlier silent-switch support path.
- The lock-screen improvement is real but intentionally narrow: the app only arms a background-task bridge when a fixed timer is within roughly the last 25 seconds before completion, and it still documents notification fallback plus foreground catch-up for longer background spans.
- The remaining meaningful risk is physical-device behavior, not a code-path contradiction in the branch:
  - how audible the mixed timer cue or `custom play` feels over another app's audio
  - whether the near-end background bridge reliably survives real lock-screen timing on iPhone hardware
