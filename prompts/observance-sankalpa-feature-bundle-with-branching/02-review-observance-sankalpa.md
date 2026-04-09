Read before review:
- `AGENTS.md`
- `README.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/execplan-observance-sankalpa-feature.md`

Review goal:
- Review the observance-based sankalpa slice with a code-review mindset focused on correctness, regressions, and missing tests.

Review priorities:
1. Confirm existing duration-based and session-count-based sankalpas still derive progress correctly.
2. Confirm observance goals validate the required observance label and reject malformed per-date records.
3. Confirm future dates cannot be edited through the intended UI path.
4. Confirm local-first save and replay behavior still uses the existing sankalpa queue flow.
5. Confirm backend persistence and response normalization remain id-stable and backward compatible.
6. Confirm date-window and time-zone handling are explicit enough to avoid off-by-one behavior for observance dates.
7. Confirm the Goals UI remains readable on smaller screens and does not overload the card layout.

Artifact requirement:
- Create or update `docs/review-observance-sankalpa-feature.md` with findings-first review output.

Output requirements:
- List findings first, ordered by severity, with file references.
- If no blocker, high, or medium findings are found, say so explicitly.
- Call out any residual risks or manual UX checks that still deserve attention.
