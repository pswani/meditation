# Review: Intent Remediation Slice 2

Date: 2026-04-01

## Findings

### [P2] Deleted playlists leave a permanently stale "Start Last Used Meditation" shortcut on Home
- Files:
  - `src/pages/HomePage.tsx:129`
  - `src/features/timer/TimerContext.tsx:1612`
- When the last-used context points to a playlist and that playlist is later deleted, Home keeps rendering `Last used: Playlist ...` forever. Clicking the shortcut only shows the existing `playlist not found` feedback, but nothing clears or repairs the stored last-used context. That leaves a dead primary shortcut on the Home screen until some other launch overwrites it, which undercuts the low-friction intent of this feature.

## Open questions and assumptions
- Assumed the Home shortcut should clear or downgrade stale last-used playlist references once the app can prove they are no longer runnable, rather than repeatedly surfacing the same dead shortcut and error banner.
