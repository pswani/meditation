# Implement: Tests And Docs

Use `bundle-implementation` for fixes and `docs-and-cleanup` for documentation.

## Tests

Add or update focused tests for:

- fixed timer completion while `document.visibilityState` is hidden
- foreground catch-up after hidden completion
- duplicate prevention for the end bell
- notification fallback interaction if relevant
- playback failure copy if behavior changes

## Docs

Update durable docs only if behavior or limitations change:

- `docs/ux-spec.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/ios-safari-real-device-qa-checklist.md` if the manual QA expectation changes

Keep the wording honest: not-in-focus playback can be improved when the browser remains runnable, but lock-screen or suspended-tab behavior may still need notification fallback or foreground catch-up.
