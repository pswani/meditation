# 01-implement-custom-play-media-library.md

## Objective
Start the next media-library slice so `custom play` flows move beyond the current seeded-only catalog.

## Recommended slice
Implement a bounded managed-media foundation for `custom play` recordings:
- backend-backed media asset records
- a repo-consistent way to register available local files into that library
- frontend selection that uses the managed library instead of depending only on seeded assets

## Required implementation outcomes
1. **Managed media library foundation**
   - Introduce a clear backend-backed media asset model if the current seeded-only shape is insufficient.
   - Keep media files on disk under the configured media root.
   - Store metadata and relative paths, not blobs.

2. **Operator-friendly registration flow**
   - Provide a straightforward local-development registration path for new media items.
   - Keep filesystem and DB modeling simple and documented.
   - Reuse existing media-registration script patterns where practical.

3. **Frontend integration**
   - Ensure `custom play` create/edit flows can use the broader managed library.
   - Keep empty, loading, and invalid-reference states calm and clear.
   - Preserve current fallback behavior only where still intentionally supported.

4. **Migration and integrity**
   - Preserve existing saved `custom play` behavior where possible.
   - Fail clearly when a referenced media item is missing or invalid.

## Architecture constraints
- Use an ExecPlan before implementation because this changes data modeling and backend integration.
- Keep the REST boundary explicit.
- Keep backend persistence, registration, and frontend consumption cleanly separated.
- Avoid unrelated refactors.

## Validation integrity
Do not break existing `custom play` and playlist runtime rules:
- linked media metadata must remain resolvable before save and launch
- playlist references to `custom play` recordings must stay trustworthy
- session logging behavior must remain correct

## Tests required
Add/update focused tests for:
- backend media asset persistence and validation
- registration/import path behavior
- frontend media selection and empty/error states
- `custom play` save behavior with managed media references
- any affected playlist/runtime guardrails

Run:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`

## Documentation updates required
- update `README.md` if setup or media registration changes
- update `docs/architecture.md`
- update `requirements/decisions.md`
- update `requirements/session-handoff.md`
- add/update review and verification artifacts under `docs/`

## Commit guidance
Suggested commit message:
- `feat(media): add managed custom play media library foundation`
