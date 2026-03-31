Read:
- AGENTS.md
- PLANS.md
- README.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md

Then:

1. Create an ExecPlan for fixing the practice/default-timer separation defect.

2. Fix the defect where editing timer values in Practice mutates the saved default timer configuration.

3. Keep the scope bounded to the timer-default ownership problem and its immediate integration points.
   Included:
   - Practice timer setup state ownership
   - Settings default-timer persistence ownership
   - Home quick-start/default-timer display correctness
   - custom play "Use" flows that preload timer setup
   - any minimal queue/persistence changes needed so only Settings persists app defaults

   Excluded:
   - broader timer redesign
   - open-ended timer work unless required for compatibility
   - unrelated playlist, sankalpa, or history refactors

4. Behavior expectations:
   - changing duration, meditation type, or advanced timer fields in Practice must be session-scoped and must not overwrite saved defaults automatically
   - the default timer shown on Home must continue to reflect the values saved in Settings
   - loading a custom play into timer setup from Home or Practice must not overwrite saved defaults unless the user explicitly saves defaults in Settings
   - saving defaults in Settings must remain the only intentional path for changing persisted timer defaults

5. Add or update focused tests for:
   - Practice edits not mutating saved defaults
   - Home still reflecting Settings defaults after Practice changes
   - custom play shortcut/use flows not mutating saved defaults
   - Settings save/reset behavior still persisting defaults correctly

6. Run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
   - any relevant backend verification commands if the implementation touches backend-backed timer settings behavior

7. Update:
   - requirements/decisions.md
   - requirements/session-handoff.md

8. In session-handoff, include:
   - what was fixed
   - how Practice and Settings now divide ownership
   - any remaining limitations
   - exact recommended next prompt

9. Commit with a clear message, for example:
   - `fix(timer): separate practice draft state from saved defaults`
