# Native iOS Parity Gap Phased Plan

This plan turns the current web-versus-native review gaps into bounded prompt bundles that can be executed after the existing native milestone work.

Read before running any bundle:
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/intent.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/ios-native/README.md`

## Review-Derived Gap List

The current native iOS app still trails the HTML front end in these areas:

1. Home parity:
   - no actionable quick start from Home
   - no last-used meditation shortcut
   - no favorite custom play or playlist shortcuts
   - Home recent activity is much thinner than the web surface
2. `custom play` parity:
   - no native model support for web-style start or end sounds
   - no recording label or richer linked-media semantics
   - no `Apply To Timer` action
3. History and summary parity:
   - native `session log` data model is flatter than the web model
   - History lacks status filtering, grouped playlist-run context, and richer item metadata
   - Goals summary lacks custom range and by-time-of-day coverage
4. Runtime and destructive-action safety:
   - no confirm-before-end flow for active timer, `custom play`, or playlist runtime
   - no confirm-before-delete flow for `custom play` or playlist library items
   - archived `sankalpa` delete is still missing
5. Sync parity:
   - native app remains local-only while the web app already supports backend-backed persistence, offline queueing, reachability state, and calm shell sync messaging
6. Code-quality and test-hardening issues:
   - `ShellViewModel.swift` and `PracticeView.swift` are too large
   - current UI coverage is mostly smoke-level and would miss many parity regressions

## Recommended Execution Order

### Bundle 1
- Bundle: `ios-native-runtime-safety-hardening-feature-bundle-with-branching`
- Goal: close the highest-trust UX gaps first by adding explicit confirm-before-end and confirm-before-delete flows, plus archived `sankalpa` delete support.

### Bundle 2
- Bundle: `ios-native-home-parity-feature-bundle-with-branching`
- Goal: make Home meaningfully actionable on iPhone with quick start, last-used, favorites, and stronger recent-session context.

### Bundle 3
- Bundle: `ios-native-custom-play-parity-feature-bundle-with-branching`
- Goal: align native `custom play` behavior and data modeling with the richer web surface without prematurely widening into full backend sync.

### Bundle 4
- Bundle: `ios-native-history-summary-parity-feature-bundle-with-branching`
- Goal: enrich native `session log` fidelity, History rendering, and Goals summary filtering so reflective views match the web app more closely.

### Bundle 5
- Bundle: `ios-native-sync-parity-feature-bundle-with-branching`
- Goal: introduce backend-backed, local-first sync behavior for the native app and add calm connectivity and pending-sync UX.

### Bundle 6
- Bundle: `ios-native-decomposition-hardening-feature-bundle-with-branching`
- Goal: reduce native maintenance risk by decomposing oversized files and strengthening automated coverage after the main parity work lands.

## Global Guardrails

1. Keep each bundle bounded; do not collapse all parity work into one oversized milestone.
2. Preserve exact product terminology:
   - meditation type
   - custom play
   - playlist
   - session log
   - manual log
   - sankalpa
   - summary
3. Keep iPhone UX calm and readable even when parity adds more metadata or actions.
4. Prefer local-first fallbacks whenever a bundle introduces backend-backed behavior.
5. Treat the web front end as the behavior reference unless product docs explicitly say otherwise.
6. Update durable docs after each bundle:
   - `requirements/decisions.md`
   - `requirements/session-handoff.md`
   - `docs/ios-native/README.md`
   - bundle-specific ExecPlan, review, and test artifacts

## Suggested Runner Usage

Use the shared runner with one bundle at a time:

- `Read prompts/run-milestone-bundle.md and execute it for ios-native-runtime-safety-hardening-feature-bundle-with-branching.`
- `Read prompts/run-milestone-bundle.md and execute it for ios-native-home-parity-feature-bundle-with-branching.`
- `Read prompts/run-milestone-bundle.md and execute it for ios-native-custom-play-parity-feature-bundle-with-branching.`
- `Read prompts/run-milestone-bundle.md and execute it for ios-native-history-summary-parity-feature-bundle-with-branching.`
- `Read prompts/run-milestone-bundle.md and execute it for ios-native-sync-parity-feature-bundle-with-branching.`
- `Read prompts/run-milestone-bundle.md and execute it for ios-native-decomposition-hardening-feature-bundle-with-branching.`
