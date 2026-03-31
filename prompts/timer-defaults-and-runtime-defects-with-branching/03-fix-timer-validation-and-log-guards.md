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

1. Create an ExecPlan for fixing timer validation and session-log correctness guards.

2. Fix the remaining timer correctness defects around validation, duration guarding, and legacy/default compatibility.

3. Keep the scope bounded to timer correctness rules and immediate support code.
   Included:
   - timer settings validation helpers
   - session-log duration clamping/guard behavior for timer sessions
   - timer settings API/storage normalization for fixed-mode defaults and legacy payloads
   - focused cleanup needed so timer-mode-aware code remains safe and predictable

   Excluded:
   - broader timer UX redesign
   - new timer features
   - unrelated history or summary redesign

4. Behavior expectations:
   - invalid fixed-duration timer settings must be rejected consistently
   - interval validation must remain correct for fixed-duration sessions
   - auto-log duration derivation must never exceed the intended duration for fixed sessions
   - storage and API normalization must handle legacy or omitted timer-mode payloads safely without weakening validation

5. Add or update focused tests for:
   - timer validation edge cases
   - session-log duration clamping
   - timer settings API normalization/equality behavior
   - storage compatibility for legacy/default timer payloads where applicable

6. Run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
   - any relevant backend verification commands if timer-settings contracts are touched

7. Update:
   - requirements/decisions.md
   - requirements/session-handoff.md

8. In session-handoff, include:
   - what correctness guards were fixed
   - any compatibility assumptions
   - exact recommended next prompt

9. Commit with a clear message, for example:
   - `fix(timer): restore validation and duration guard correctness`
