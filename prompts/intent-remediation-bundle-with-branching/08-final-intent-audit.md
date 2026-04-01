Read AGENTS.md, README.md, requirements/intent.md, docs/product-requirements.md, docs/architecture.md, docs/ux-spec.md, docs/screen-inventory.md, requirements/decisions.md, requirements/session-handoff.md, the audit and inventory documents produced by prompts 1 and 2, and `requirements/execplan-intent-remediation-bundle.md`.

If the audit and inventory documents were created at different paths, use the paths recorded in requirements/session-handoff.md.

Then perform a fresh requirement audit of the current application against `requirements/intent.md` after the remediation slices completed.

Scope:
- verify which original gaps are now fully closed
- identify which gaps remain partial or unresolved
- flag any new regressions introduced during remediation
- do not implement code changes in this step

Output:
1. an updated pass or fail matrix
2. a before or after closure summary for the original gap list
3. the remaining gaps, if any, prioritized by blocker, important, and polish
4. a recommendation:
   - either the app is ready for final cleanup and hardening
   - or one more bounded remediation slice is still needed

Write the audit into `docs/review-intent-compliance-final-pass.md`, update requirements/session-handoff.md with the exact recommended next prompt, and if only documentation changes are made commit with a clear message such as `docs(review): final intent compliance pass`.

