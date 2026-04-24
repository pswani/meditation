# QA + UX Review Test Matrix

Date: 2026-04-19

Scope: current implemented Meditation app surfaces on native iPhone simulator and web browser.

## Environment Targets

| Platform | Target | Notes |
|---|---|---|
| iOS | Native SwiftUI app in `ios-native/MeditationNative.xcodeproj` | Run on an iPhone simulator through Xcode tooling. |
| Web | React/Vite app in browser | Run against local Vite app with the in-repo backend when available; capture responsive phone and desktop states where useful. |

## Startup And Navigation

| ID | Flow / State | iOS | Web | Expected Evidence |
|---|---|---:|---:|---|
| NAV-01 | Cold launch / first route | Yes | Yes | Home screen appears with primary navigation. |
| NAV-02 | Primary destinations | Yes | Yes | Home, Practice, History, Goals, Settings reachable. |
| NAV-03 | Back/cancel behavior from secondary screens | Yes | Yes | Library/detail/form routes can return without losing shell navigation. |
| NAV-04 | Responsive/adaptive shell | N/A | Yes | Phone bottom navigation and desktop side/top navigation differences captured. |

## Home

| ID | Flow / State | iOS | Web | Expected Evidence |
|---|---|---:|---:|---|
| HOME-01 | Default/populated home | Yes | Yes | Quick start, last-used, favorite shortcuts, recent/sankalpa context where seeded. |
| HOME-02 | Start timer shortcut | Yes | Yes | Navigates into active timer or timer setup as implemented. |
| HOME-03 | Last-used shortcut | Yes | Yes | Starts the saved last-used practice target when present. |
| HOME-04 | Favorite custom play shortcut | Yes | Yes | Starts or offers saved favorite custom play. |
| HOME-05 | Favorite playlist shortcut | Yes | Yes | Starts or offers saved favorite playlist. |
| HOME-06 | Active-session return state | Yes | Yes | Home shows resume/open active-session affordance after a session starts. |

## Timer / Practice

| ID | Flow / State | iOS | Web | Expected Evidence |
|---|---|---:|---:|---|
| TIMER-01 | Timer setup default fixed-duration state | Yes | Yes | Duration, meditation type, start action visible. |
| TIMER-02 | Open-ended timer setup | Yes | Yes | Duration replaced by elapsed-mode explanation. |
| TIMER-03 | Advanced sound controls | Partial | Yes | Start/end sounds and interval controls visible where implemented. |
| TIMER-04 | Interval validation | Yes | Yes | Interval cannot exceed fixed duration; validation message captured. |
| TIMER-05 | Missing/invalid required timer fields | Partial | Yes | Required meditation type and positive duration validation captured where reachable. |
| TIMER-06 | Active fixed timer | Yes | Yes | Countdown, pause, end controls visible. |
| TIMER-07 | Pause/resume active timer | Yes | Yes | Paused state and resume action visible. |
| TIMER-08 | End timer confirmation | Yes | Yes | Destructive confirmation visible; cancel keeps session running. |
| TIMER-09 | Ended-early success/logging state | Yes | Yes | Return to setup with auto-log feedback or history evidence. |
| TIMER-10 | Active open-ended timer | Yes | Yes | Elapsed timer label and manual end behavior captured. |

## Custom Plays

| ID | Flow / State | iOS | Web | Expected Evidence |
|---|---|---:|---:|---|
| CP-01 | Custom play library populated | Yes | Yes | Seeded/custom plays listed with start/edit/favorite/delete actions. |
| CP-02 | Create custom play form default | Yes | Yes | Name, meditation type, media, sounds, note fields visible. |
| CP-03 | Create validation errors | Partial | Yes | Missing name/type/media errors captured where reachable. |
| CP-04 | Create success | Partial | Yes | New custom play appears and success feedback captured. |
| CP-05 | Edit custom play | Partial | Yes | Existing record loads into edit state and can be saved/canceled. |
| CP-06 | Favorite custom play | Partial | Yes | Favorite state toggles and affects shortcuts. |
| CP-07 | Delete custom play confirmation | Yes | Yes | Destructive confirmation visible and cancel/delete behavior checked. |
| CP-08 | Active custom play runtime | Yes | Yes | Playback runtime, pause/resume, end session controls. |
| CP-09 | Custom play unavailable/media fallback state | If reachable | If reachable | Missing/unavailable media guidance captured when possible. |

## Playlists

| ID | Flow / State | iOS | Web | Expected Evidence |
|---|---|---:|---:|---|
| PL-01 | Playlist library populated | Yes | Yes | Saved playlists listed with total duration, favorite/start/edit/delete actions. |
| PL-02 | Create playlist form default | Yes | Yes | Playlist name, gap, item builder, derived total runtime. |
| PL-03 | Playlist validation errors | Partial | Yes | Missing name/items or invalid item fields captured. |
| PL-04 | Add/remove/reorder items | Partial | Yes | Item controls preserve order and derived duration updates. |
| PL-05 | Create success | Partial | Yes | New playlist appears and success feedback captured. |
| PL-06 | Edit playlist | Partial | Yes | Existing playlist loads into edit state and can be saved/canceled. |
| PL-07 | Delete playlist confirmation | Yes | Yes | Destructive confirmation visible and cancel/delete behavior checked. |
| PL-08 | Active playlist runtime | Yes | Yes | Current item, item count, pause/resume/end controls; confirmation on end. |
| PL-09 | Gap phase | If reachable | If reachable | Small-gap transition visible if timing allows. |

## History / Logging

| ID | Flow / State | iOS | Web | Expected Evidence |
|---|---|---:|---:|---|
| HIST-01 | Empty history | If reachable | Yes | No logs empty state with next action. |
| HIST-02 | Populated history | Yes | Yes | Recent session logs with status/source/timer-mode badges. |
| HIST-03 | Manual log form default | Yes | Yes | Fixed/open-ended choice, duration, type, timestamp fields. |
| HIST-04 | Manual log validation | Partial | Yes | Duration/type/timestamp errors captured. |
| HIST-05 | Manual log success | Yes | Yes | Success confirmation and new manual log appears. |
| HIST-06 | Source/status filters | Partial | Yes | Empty-filter and populated-filter states captured. |
| HIST-07 | Manual-log meditation type correction | Yes | Yes | Edit panel appears only for manual logs and saves/cancels. |
| HIST-08 | Long list / show more | If reachable | If reachable | Pagination or show-more state captured if enough records exist. |

## Goals / Sankalpa / Summaries

| ID | Flow / State | iOS | Web | Expected Evidence |
|---|---|---:|---:|---|
| GOAL-01 | Summary default | Yes | Yes | Overall/by-type/by-time-of-day summary captured. |
| GOAL-02 | Summary filters/ranges | Yes | Yes | 7-day/custom range controls and invalid custom range if reachable. |
| GOAL-03 | Sankalpa create form default | Yes | Yes | Duration/session-count default fields and optional filters. |
| GOAL-04 | Sankalpa validation errors | Partial | Yes | Invalid target/days/observance errors captured. |
| GOAL-05 | Create duration or session-count sankalpa | Yes | Yes | Success feedback and active sankalpa card. |
| GOAL-06 | Start Gym Sankalpa preset | Yes | Yes | Weekly observance form state. |
| GOAL-07 | Observance check-ins | Yes | Yes | Pending/Observed/Missed states and future-date lock if visible. |
| GOAL-08 | Edit sankalpa | Partial | Yes | Edit state preserves goal window copy and can cancel/save. |
| GOAL-09 | Archive confirmation | Yes | Yes | Archive confirmation sheet/alert captured. |
| GOAL-10 | Archived restore and delete | Yes | Yes | Restore feedback and archived-only delete confirmation. |
| GOAL-11 | Completed/expired sections | Yes | Yes | Empty and/or populated sections captured as available. |

## Settings / Preferences / Sync

| ID | Flow / State | iOS | Web | Expected Evidence |
|---|---|---:|---:|---|
| SET-01 | Settings default | Yes | Yes | Timer defaults and notification/sync sections visible. |
| SET-02 | Timer default validation | Partial | Yes | Invalid duration/type/interval errors captured. |
| SET-03 | Save/reset timer defaults | Yes | Yes | Success/reset feedback visible. |
| SET-04 | Notification capability state | Yes | Yes | Permission/capability messaging captured. |
| SET-05 | Local-only/offline/backend-unavailable messaging | Yes | Yes | Sync or backend banners captured where safely reachable. |

## Error / Loading / Edge States

| ID | Flow / State | iOS | Web | Expected Evidence |
|---|---|---:|---:|---|
| EDGE-01 | Route loading fallback | N/A | If observable | Lazy route loading fallback captured if visible. |
| EDGE-02 | Backend unavailable with fallback data | N/A | Yes | Calm backend-unavailable banner and fallback media/summary behavior. |
| EDGE-03 | Browser offline / pending sync | N/A | If safe | Local write queues and banner captured without external services. |
| EDGE-04 | Native local-only sync state | Yes | N/A | Settings/shell copy clarifies local-only mode. |
| EDGE-05 | Layout stress: phone scroll / long forms | Yes | Yes | Long forms and lists remain readable and tappable. |
