# Custom Plays Review

## Scope reviewed
- `Practice` custom play create/edit/delete/favorite flows
- sound and media/session selection experience
- labels and validation behavior
- responsive behavior across mobile, tablet, and desktop
- clarity of the file-backed asset model in UI

## Review lens
- calmness and low-friction interaction
- data integrity
- media-management clarity
- responsive usability

## Summary
The custom-play slice is a strong functional baseline: core CRUD flows are present, favorite and `Use Custom Play` behavior works, and sound/media fields are integrated into setup application. The main remaining risks are around data-integrity boundaries for stored custom-play payloads and UX clarity for the file-backed media model.

## Findings

### Critical
None identified in this review pass.

### Important
1. Custom-play storage normalization does not enforce domain validity for key fields.
- Current load normalization accepts any string for `meditationType` and any number for `durationMinutes`.
- Impact:
  - malformed persisted entries can re-enter runtime state with invalid domain values
  - users may see confusing custom-play rows that cannot be safely trusted
- Recommendation:
  - enforce enum validation for `meditationType`
  - enforce `durationMinutes > 0` during load normalization
  - drop or repair malformed entries with explicit safe defaults

2. File-backed media model is visible but not fully understandable to non-technical users.
- UI exposes raw filesystem-style `mediaAssetPath` text directly in hints/list rows.
- Impact:
  - users may not understand whether path text is editable, local-only, or server-backed metadata
  - media/session selection feels technical rather than practice-oriented
- Recommendation:
  - keep path available as secondary detail, but lead with human-readable metadata (label + duration + type)
  - add a short helper line clarifying this is linked media metadata, not manual file-path entry

3. Create/update flows lack explicit success feedback.
- After save, form resets but no clear create/update confirmation appears.
- Impact:
  - users can be unsure whether edits were persisted, especially in longer lists
- Recommendation:
  - add calm inline success feedback (`Custom play saved`) and optionally highlight the affected row

### Nice to have
1. Offer lightweight media-session filtering/grouping in selection list.
- Example:
  - group by meditation type or duration bucket
  - include search for long catalogs

2. Add favorite-first sort toggle for faster repeat access.
- Rationale:
  - aligns with expected quick reuse behavior of custom plays

3. Reduce action density on narrow phones.
- Current wrap behavior is functional, but per-row action clusters still feel busy.
- A compact primary/secondary action pattern would improve scanability.
