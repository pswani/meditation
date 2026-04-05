Read before review:
- `AGENTS.md`
- `README.md`
- `docs/architecture.md`
- `docs/media-registration-scripts.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/execplan-media-cache-hygiene-feature.md`

Review target:
- The branch `codex/media-cache-hygiene-feature-bundle-with-branching` after implementation is complete.

Review focus:
- bugs
- asset ownership drift
- broken timer sound lookup
- broken media registration workflow
- unsafe cache invalidation behavior
- missing test coverage

Priority review questions:
1. Is there now one clear, documented ownership model for timer sounds and fallback media assets?
2. Could the cleanup break playback, registration scripts, or fallback asset resolution on existing environments?
3. Does the new cache-version strategy actually invalidate safely on deploy without requiring hand edits?
4. Were unrelated refactors introduced?
5. Do tests protect the risky sound, media, and service-worker paths?

Artifact requirement:
- Create or update `docs/review-media-cache-hygiene-feature.md` with the review outcome.

Output requirements:
- Findings first, ordered by severity.
- Include file references and line references where possible.
- If no blocker, high, or medium findings exist, state that explicitly.
- Keep any summary brief.

If review discovers a real issue:
- Do not fix it in this step.
- Capture it clearly so the next prompt can address it.

