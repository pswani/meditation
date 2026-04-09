Read before review:
- `AGENTS.md`
- `README.md`
- `docs/ux-spec.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/execplan-ios-native-custom-play-playlist-feature.md`

Review target:
- The branch `codex/ios-native-custom-play-playlist-feature-bundle-with-branching` after implementation is complete.

Review focus:
- playback correctness
- playlist ordering and derived-duration correctness
- logging integrity
- small-screen UX clutter
- missing media edge-case handling

Priority review questions:
1. Does `custom play` playback feel trustworthy across pause, resume, completion, and early stop?
2. Is playlist order preserved consistently in edit and runtime flows?
3. Are media-missing or invalid-file states handled calmly and explicitly?
4. Does the UI stay usable on an iPhone without turning into a crowded management screen?
5. Were unrelated summary, `sankalpa`, or sync behaviors touched early?

Artifact requirement:
- Create or update `docs/review-ios-native-custom-play-playlist-feature.md` with the review outcome.

Output requirements:
- Findings first, ordered by severity.
- Include file references and line references where possible.
- If no blocker, high, or medium findings exist, state that explicitly.
- Keep any summary brief.
