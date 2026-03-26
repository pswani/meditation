# Prototype Cleanup Assessment

## ExecPlan

### 1. Objective
Assess the current repository for temporary prototype content introduced for UX exploration, placeholder flows, screen demos, and local-only seams, then define a bounded cleanup plan without performing the cleanup yet.

### 2. Why
The app has moved well beyond placeholder screens, but a few prototype-era seams and process artifacts still leak into runtime UI, persisted product data, and top-level docs. Cleaning those up will make the product feel more intentional, reduce contributor confusion, and keep future release work focused on real product gaps instead of historical scaffolding.

### 3. Scope
Included:
- runtime UI copy and labels that still read like prototype or technical demo material
- fixed local catalogs and local-storage-backed API seams
- dead styling/components/routes left behind by placeholder-driven work
- top-level docs and review artifacts that behave like historical process output rather than core product documentation
- classification into `must remove now`, `can keep temporarily`, and `should be converted into proper seed/sample data`

Excluded:
- implementing the cleanup itself
- test-only fixtures and sample data inside `*.test.tsx`
- removing intentional local-first behavior just because it is local
- backend, database, upload, or audio-playback implementation

### 4. Source documents
Required docs reviewed:
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/architecture.md`
- `docs/product-requirements.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `requirements/prompts.md`

Runtime and support files inspected:
- `src/App.tsx`
- `src/app/AppShell.tsx`
- `src/app/routes.ts`
- `src/pages/HomePage.tsx`
- `src/pages/PracticePage.tsx`
- `src/pages/HistoryPage.tsx`
- `src/pages/SankalpaPage.tsx`
- `src/pages/ActiveTimerPage.tsx`
- `src/pages/PlaylistsPage.tsx`
- `src/pages/PlaylistRunPage.tsx`
- `src/features/customPlays/CustomPlayManager.tsx`
- `src/features/playlists/PlaylistManager.tsx`
- `src/features/timer/constants.ts`
- `src/features/timer/TimerContext.tsx`
- `src/utils/home.ts`
- `src/utils/summary.ts`
- `src/utils/customPlay.ts`
- `src/utils/playlistApi.ts`
- `src/utils/sankalpaApi.ts`
- `src/utils/mediaAssetApi.ts`
- `src/utils/storage.ts`
- `src/types/customPlay.ts`
- `src/index.css`

Historical artifact inventory reviewed:
- all top-level `docs/review-*.md`
- all top-level `docs/ux-review-*.md`
- all top-level `requirements/execplan-*.md`

### 5. Affected files and modules
Highest-signal cleanup targets:
- `src/features/customPlays/CustomPlayManager.tsx`
- `src/utils/mediaAssetApi.ts`
- `src/utils/customPlay.ts`
- `src/types/customPlay.ts`
- `src/index.css`
- `src/features/timer/constants.ts`
- `src/utils/playlistApi.ts`
- `src/utils/sankalpaApi.ts`
- `src/App.tsx`
- `src/app/routes.ts`
- `README.md`
- `requirements/prompts.md`
- top-level review and ExecPlan artifact sets in `docs/` and `requirements/`

### 6. UX behavior
Desired cleanup direction:
- user-facing screens should not expose implementation details like managed file paths or MIME types
- primary navigation should contain only real product destinations
- compatibility routes may remain short-term if they prevent broken links or historical drift
- summary and home cards should stay because they are already driven by real `session log` data, not fake demo metrics
- empty-state copy can remain calm and helpful, but should avoid sounding like a design demo or placeholder shell

### 7. Data and state model
Current model observations:
- the app is intentionally local-first today, so local storage itself is not prototype residue
- `playlist` and `sankalpa` REST-shaped utilities are acting as future transport seams over local persistence
- `custom play` media is different: the source catalog is a fixed in-code list and the app currently persists denormalized media label/path fields into product records

Cleanup implication:
- keep intentional local-first seams where they protect future backend integration
- separate those seams from truly temporary data, especially the fixed media catalog and path-oriented custom-play persistence

### 8. Risks
- removing persisted media path fields may require a small compatibility migration for existing local storage
- removing or archiving review artifacts without an index can break historical references in older handoff docs and ExecPlans
- replacing fixed catalogs later with real reference data should preserve stable ids where practical to avoid breaking saved records
- over-cleaning local-first seams would create churn without improving the current product experience

### 9. Milestones
1. Remove immediate runtime and doc remnants that are clearly no longer desired.
2. Clean stale active guidance that still points contributors toward placeholder-era behavior.
3. Decide which historical review and ExecPlan artifacts should be archived, indexed, or left in place short-term.
4. Convert remaining fixed prototype catalogs into explicit sample/reference data structures before production hardening.

### 10. Verification
When cleanup work begins, verify with:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- manual check that custom play UI no longer shows technical media metadata
- manual check that no active guidance still tells contributors to add placeholder screens
- manual check that primary navigation and routed pages remain unchanged except for intended cleanup

### 11. Decision log
- Treat local-first persistence as the current product baseline, not cleanup debt by itself.
- Treat `playlist` and `sankalpa` API-style wrappers as intentional temporary seams that can remain short-term.
- Treat fixed custom-play media metadata as prototype content that should not remain as product data.
- Treat top-level review and ExecPlan files as historical process artifacts, not core product docs; prefer archive/index decisions over ad hoc deletion.

### 12. Progress log
- 2026-03-25: reviewed required repo, product, architecture, and handoff documents.
- 2026-03-25: audited route structure, runtime UI, local persistence seams, and top-level artifact directories.
- 2026-03-25: classified findings and prepared the next implementation-ready cleanup prompt.

## Findings Summary

### Confirmed Non-Findings
- No fake summary cards or mock metric panels remain in routed UI. `HomePage` and `SankalpaPage` derive metrics from real `session log` data.
- No temporary primary navigation items remain in `src/app/routes.ts`.
- No dead route-level page components were found in `src/pages`; the current page files are all wired through `src/App.tsx`.
- Test fixtures such as `sampleLogs` and `samplePlaylist` are test-only and are not counted as product data cleanup targets.

### Must Remove Now

| Area | Files | Why |
| --- | --- | --- |
| Unused placeholder-era styling remnant | `src/index.css` | `.placeholder-list` is no longer referenced anywhere in `src/` and appears to be leftover from removed placeholder-screen work. |
| Stale active prompt guidance for placeholder screens | `requirements/prompts.md` | This still tells contributors to "add route-level placeholder screens" even though the app has moved past that architecture and the scaffolding has already been removed. |
| Technical media metadata exposed in product UI | `src/features/customPlays/CustomPlayManager.tsx` | Showing MIME type and managed path in the form and saved-item UI leaks internal implementation details from the prototype media exploration flow into the product experience. |
| Denormalized media path data persisted as product data | `src/types/customPlay.ts`, `src/utils/customPlay.ts` | `mediaAssetLabel` and especially `mediaAssetPath` are prototype-era carryovers from the fixed local media catalog and should not remain part of long-term user data shape. |

### Can Keep Temporarily

| Area | Files | Why |
| --- | --- | --- |
| Local-storage-backed REST seams for playlists | `src/utils/playlistApi.ts`, `src/features/timer/TimerContext.tsx` | These are fake APIs in the sense that they do not call a server, but they are serving as intentional backend boundary seams and can stay until live transport work is in scope. |
| Local-storage-backed REST seams for sankalpa | `src/utils/sankalpaApi.ts`, `src/pages/HomePage.tsx`, `src/pages/SankalpaPage.tsx` | Same rationale as playlists: the seam is useful even though the persistence remains local-first today. |
| Compatibility redirect route | `src/App.tsx` | `/sankalpa` redirects to `/goals`. This is not a product nav item, but it is a low-cost compatibility bridge and can stay until route migration concerns disappear. |
| Fixed timer sound label list | `src/features/timer/constants.ts` | The sound selectors are still mock labels with no playback implementation. They are acceptable short-term while the roadmap gap for actual audio playback remains open. |
| Form placeholder hints | `src/features/customPlays/CustomPlayManager.tsx`, `src/features/playlists/PlaylistManager.tsx` | `Morning Focus`, `Breath emphasis`, and `Morning Sequence` read as examples rather than fake saved content, so they can remain unless copy polish chooses different hints. |
| Historical review and planning artifacts | `docs/review-*.md`, `docs/ux-review-*.md`, `requirements/execplan-*.md` | These should not define the core doc surface long-term, but they still contain useful project history. They can remain temporarily if an archive/index strategy is introduced instead of broad deletion. |

### Should Be Converted Into Proper Seed/Sample Data

| Area | Files | Why |
| --- | --- | --- |
| Fixed custom-play media catalog | `src/utils/mediaAssetApi.ts` | `localMediaAssetCatalog` is currently a hardcoded prototype catalog. It should either become explicit seed/reference data or be replaced by a real media source. |
| Timer sound option catalog | `src/features/timer/constants.ts` | The current string list is serviceable for prototype selection, but production work should move it into an explicit asset/reference catalog with stable ids and real playback mapping. |

## Recommended Cleanup Order
1. Remove the immediate dead and misleading remnants: `.placeholder-list`, placeholder-screen prompt language, and user-facing managed-path technical copy.
2. Normalize custom-play media persistence so product records do not store prototype-only path details.
3. Add a lightweight archive or index strategy for top-level review and ExecPlan artifacts instead of leaving them mixed into the core doc surface indefinitely.
4. Convert fixed catalogs into explicit reference data only when the related product area is being actively hardened.
