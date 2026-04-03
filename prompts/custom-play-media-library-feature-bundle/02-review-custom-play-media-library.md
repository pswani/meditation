# 02-review-custom-play-media-library.md

## Goal
Review the custom-play media library slice for correctness, architecture, and product fit.

## Review checklist
1. Product UX
   - Is the media selection flow clear and calm?
   - Are empty and invalid-reference states actionable?

2. Technical correctness
   - Are media files still modeled as filesystem-backed assets with DB metadata/path references?
   - Are backend validation and frontend assumptions aligned?
   - Any risk of stale linked-recording references or broken playlist/runtime behavior?

3. Scope discipline
   - No unrelated refactors.
   - Changes limited to the media-library slice, tests, and docs.

4. Tests and docs
   - Focused tests added for backend, frontend, and integration boundaries.
   - Durable docs and session handoff updated.

## Output format
Findings by severity:
- blocker
- high
- medium
- low

If clean: "No blocker/high/medium findings."
