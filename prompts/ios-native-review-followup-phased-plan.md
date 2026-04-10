# Native iOS Review Follow-Up Phased Plan

This plan converts the parity-review findings into bounded prompt bundles that can be executed one at a time.

Read before running any bundle:
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `requirements/intent.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/ios-native/README.md`
- `docs/ios-native/parity-review-2026-04-10.md`

## Review-Derived Follow-Ups

The current native iOS app still needs follow-up work in these areas:

1. Media and sound parity:
- timer sound catalog and playback do not match the web app
- `Wood Block` still exists natively as a first-class option
- `custom play` and linked playlist recording playback still rely on placeholder media behavior

2. Runtime resilience and usability:
- active timer, `custom play`, and playlist sessions are not recoverable after relaunch
- timer and manual-log duration entry is Stepper-heavy and slower than the web app
- local-only and backend-unavailable messaging is easy to misread
- timer defaults are persisted immediately rather than through a calmer save or reset workflow

3. Build, deploy, and operator docs:
- there is no dedicated command-line script to build and deploy to a connected iPhone
- the iOS README is useful but not yet a consolidated operator guide
- native operational docs should better explain local-only mode, synced mode, and device workflow

## Recommended Execution Order

### Bundle 1
- Bundle: `ios-native-media-sound-parity-feature-bundle-with-branching`
- Goal: align native timer sounds, `custom play`, and linked playlist media behavior with the web app in the highest-trust user-facing media flows.

### Bundle 2
- Bundle: `ios-native-runtime-ux-resilience-feature-bundle-with-branching`
- Goal: improve the trust and usability of the timer and session flows through recovery, better numeric entry, calmer settings behavior, and clearer connectivity messaging.

### Bundle 3
- Bundle: `ios-native-build-deploy-docs-feature-bundle-with-branching`
- Goal: make the iPhone app easier to build, deploy, and operate through scripts and stronger consolidated documentation.

### Bundle 4
- Bundle: `ios-native-low-risk-cleanup-feature-bundle-with-branching`
- Goal: close small, low-risk project-hygiene and documentation cleanup items after the larger parity and workflow bundles land.

## Global Guardrails

1. Keep each bundle bounded and mergeable on its own.
2. Preserve exact product terminology:
- meditation type
- custom play
- playlist
- session log
- manual log
- sankalpa
- summary
- favorite
- recent
3. Treat the web app as the behavior reference unless durable product docs say otherwise.
4. Keep the native app calm and minimal across phone, tablet, and desktop-class layouts.
5. Prefer local-first behavior and explicit backend seams over brittle assumptions.
6. Update durable docs after each bundle:
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/ios-native/README.md`
- bundle-specific ExecPlan, review, and test artifacts

## Suggested Runner Usage

Use the shared runner with one bundle at a time:

- `Read prompts/run-milestone-bundle.md and execute it for ios-native-media-sound-parity-feature-bundle-with-branching.`
- `Read prompts/run-milestone-bundle.md and execute it for ios-native-runtime-ux-resilience-feature-bundle-with-branching.`
- `Read prompts/run-milestone-bundle.md and execute it for ios-native-build-deploy-docs-feature-bundle-with-branching.`
- `Read prompts/run-milestone-bundle.md and execute it for ios-native-low-risk-cleanup-feature-bundle-with-branching.`
