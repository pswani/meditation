# Implement: End Bell Fix

Use the `bundle-implementation` reasoning profile.

## Objective

Implement the narrowest fix that makes the end bell play when the app is not focused and the browser still allows the page to run.

## Requirements

- Preserve start and interval sound behavior.
- Preserve pause/resume correctness.
- Preserve ending-early behavior.
- Avoid duplicate end bells for the same outcome.
- Keep notification fallback behavior when notification permission is granted and the document is hidden.
- Keep failure messages calm and non-blocking.
- Do not claim guaranteed sound playback after browser or OS suspension.

## Possible Directions

Choose based on diagnosis:

- Evaluate fixed-timer completion against wall-clock time while hidden so the end cue can be attempted before foreground return when the page is still runnable.
- Coordinate end-bell attempts and notification fallback to reduce duplicate signals.
- Preserve a single handled-outcome key so foreground catch-up does not replay the same bell.
- Strengthen audio priming or end-cue preparation if current prepared audio is discarded or not reused.

Document the selected approach in code comments only where it prevents future mistakes.
