# Product Requirements

## Product summary
A focused meditation app for disciplined personal practice.

## Supported devices
The app must work well on:
- mobile phones
- tablets
- laptops
- desktops

## Primary use cases
1. meditate with a timer
2. choose optional start and end sounds
3. choose optional interval sounds
4. pause, resume, and end a session
5. create custom meditation plays from pre-recorded sessions
6. create playlists that sequence multiple meditations
7. log sessions automatically
8. log sessions manually
9. summarize meditation by type or overall
10. define and track sankalpa goals

## Meditation types
- Vipassana
- Ajapa
- Tratak
- Kriya
- Sahaj

## Functional requirements

### Home
- quick start timer
- start last used meditation
- favorite plays
- favorite playlists
- today’s progress
- sankalpa snapshot

### Timer
- fixed-duration or open-ended mode
- total duration for fixed sessions
- meditation type
- optional start sound
- optional end sound
- optional interval sounds
- elapsed time for open-ended sessions
- pause
- resume
- end early for fixed sessions
- manual end for open-ended sessions

### Custom Plays
- create
- edit
- delete
- favorite
- attach pre-recorded session
- assign meditation type

### Playlists
- create playlist
- add items
- remove items
- reorder items
- compute total duration
- optional small gap between items
- favorite playlist

### Logging
- auto-log app sessions
- manual logging for off-app meditation
- differentiate manual vs auto logs

### Summaries
- overall summary
- summary by meditation type
- summary by source
- summary by date range
- summary by time-of-day bucket

### Sankalpa
- duration goal in Y days
- session-count goal in Y days
- observance goal in Y days for disciplines the app cannot infer automatically
- weekly observance goal for disciplines the app cannot infer automatically, such as Gym 5 observed days per week for 4 weeks
- optional filter by meditation type
- optional filter by time of day
- observance goals use manual per-date marking with observed or missed status

## Multi-device UX requirements
- mobile-first implementation
- responsive layouts across phone, tablet, and desktop
- navigation may adapt by breakpoint
- core actions must remain discoverable across devices
- desktop layouts should use additional width effectively
- no essential functionality should rely only on hover
