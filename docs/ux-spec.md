# UX Spec

## Design principles
- calm
- minimal
- serious
- practical
- responsive
- multi-device friendly

## Navigation
Use a responsive navigation model:
- mobile: bottom tabs
- tablet/desktop: top navigation or side navigation, as long as destinations remain consistent

Primary destinations:
- Home
- Practice
- History
- Goals
- Settings

## Timer UX rules
- fixed-duration remains the default mode
- timer mode choice should clearly separate fixed-duration from open-ended practice
- duration first for fixed sessions
- open-ended mode should explain that there is no scheduled finish time
- meditation type required
- optional sounds grouped under advanced controls
- interval settings hidden unless enabled
- interval bells in open-ended mode repeat on elapsed-time milestones
- pause/resume prominent during session
- active timer should clearly label countdown vs elapsed time
- ending a session should confirm intent
- for likely iPhone Safari browser contexts, timer setup and active timer should explain that lock-screen browser suspension can defer completion handling until Safari returns to foreground
- after foreground catch-up finalizes a fixed timer, the completion UI should explain that the scheduled end was reached while Safari was in the background
- Safari-specific guidance should stay hidden for unrelated desktop and Android contexts

## Settings UX rules
- Settings should expose an optional, user-controlled action to request timer completion notifications when browser support exists
- Settings should show current notification capability and permission state in calm, explicit language
- iPhone Safari notification copy should explain that browser support and permission still do not guarantee lock-screen reliability in browser-tab mode

## Responsive layout notes
- forms stay single-column on narrow screens
- summaries may expand to multiple cards or columns on larger screens
- history and playlist management should use extra width on desktop without becoming dense
