# Backend Scale Hardening ExecPlan

Date: 2026-04-05

## Objective

Make the backend `session log`, summary, sankalpa, and playlist-save paths more production-scalable while tightening the shared frontend API client and keeping the current product behavior and offline-first guarantees intact.

## Why

- The current summary and sankalpa services still load the full `session log` history into memory and repeatedly scan it.
- The current `session log` GET endpoint always returns the full history collection with no explicit filtering or pagination contract.
- Playlist save still validates linked `custom play` ids one item at a time.
- The shared API client does not yet have an explicit timeout or clearer cancellation semantics for the now broader backend-backed surface.

## Scope

Included:
- backend query and repository improvements for summary and sankalpa computation
- explicit filtering or pagination contracts for `session log` and summary APIs
- batched linked-`custom play` validation during playlist save
- shared frontend API-client timeout and cancellation behavior
- only the minimal frontend API-boundary or consumer changes needed to support the new contracts cleanly
- tests and durable docs for the touched areas

Excluded:
- large frontend runtime decomposition
- shared reference-data cleanup
- media or cache source-of-truth cleanup
- broad UI redesign
- unrelated backend refactors outside session logs, summaries, sankalpas, playlists, and API-boundary helpers

## Source documents

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
- `prompts/production-grade-hardening-phased-plan.md`
- `prompts/backend-scale-hardening-feature-bundle-with-branching/01-implement-backend-scale-hardening.md`

## Affected files and modules

- `backend/src/main/java/com/meditation/backend/sessionlog/`
- `backend/src/main/java/com/meditation/backend/summary/`
- `backend/src/main/java/com/meditation/backend/sankalpa/`
- `backend/src/main/java/com/meditation/backend/playlist/`
- backend repository interfaces and controller tests for those domains
- `src/utils/apiClient.ts`
- `src/utils/sessionLogApi.ts`
- `src/utils/summaryApi.ts`
- any minimal frontend consumers that need to pass new request options

## UX behavior

- `History` behavior should remain calm and truthful; any API-boundary changes must preserve recency ordering and current user-visible meaning.
- Summary behavior must remain correct for:
  - empty states
  - inclusive date-range filtering
  - time-zone-aware time-of-day buckets
  - manual vs auto log distinctions
- `Sankalpa` progress must remain correct for active, completed, expired, and archived goals.
- Playlist saves must still reject invalid linked `custom play` ids, but do so without per-item existence probes.
- API timeout or cancellation behavior must distinguish deliberate cancellation from backend failure without making offline-first flows look broken.

## Data and state model

- Keep the existing `session log`, summary, and `sankalpa` response shapes stable where practical.
- Introduce explicit request parameters for `session log` and summary filtering/pagination without inventing a second sync surface.
- Prefer repository aggregation queries and reduced projections over loading full `SessionLogEntity` rows when only counts, sums, or small fields are needed.
- Preserve the current queue-backed replay model and stale-write protection.
- Preserve the current browser-side summary snapshot caching keyed by request parameters.

## Risks and tradeoffs

- Time-zone-aware time-of-day buckets are awkward to compute purely in the database in a portable way, so some bounded in-memory work may still be necessary.
- Changing `session log` API contracts risks breaking hydration, History ordering, or stale-write replay behavior if the frontend boundary is not updated carefully.
- API timeout logic must not misclassify user-initiated aborts as backend outages.
- Batched playlist validation must preserve correctness when multiple linked items refer to the same `custom play`.

## Milestones

1. Inspect and define the final API-contract shape for `session log` and summary filtering/pagination.
2. Add repository-level query or projection support for summary and sankalpa hot paths.
3. Update backend services and controllers for the new query behavior and batched playlist validation.
4. Tighten the frontend API client and update any API-boundary helpers or consumers that need the new contract.
5. Add or update focused backend and frontend tests.
6. Run verification and update durable docs plus review/test artifacts.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`
- focused checks for:
  - summary correctness across empty, filtered, and time-zone-aware cases
  - `sankalpa` progress correctness across statuses
  - `session log` ordering plus filtering/pagination contract behavior
  - batched playlist linked-`custom play` validation
  - API timeout and cancellation semantics

## Decision log

- 2026-04-05: Treat `codex/cleanup` as the safe parent because it already contains the Phase 1 runtime-boundary merge.
- 2026-04-05: Keep this slice bounded to backend query/API hardening plus only minimal frontend API-boundary changes.
- 2026-04-05: Plan to preserve stable response shapes where possible and make new filtering/pagination contracts opt-in rather than forcing a broad frontend rewrite.

## Progress log

- 2026-04-05: Read the milestone runner, bundle prompts, and required repo guidance.
- 2026-04-05: Created branch `codex/backend-scale-hardening-feature-bundle-with-branching` from `codex/cleanup`.
- 2026-04-05: Inspected current `SessionLogService`, `SummaryService`, `SankalpaService`, `PlaylistService`, shared API helpers, and current tests.
- 2026-04-05: Reworked summary and `sankalpa` hot paths around repository aggregates and reduced time-slice projections.
- 2026-04-05: Added explicit filtered and optional paged `session log` list contracts plus minimal frontend boundary updates to consume the response envelope.
- 2026-04-05: Batched linked-`custom play` validation during playlist save and added focused integration coverage for the single-query behavior.
- 2026-04-05: Added explicit shared API timeout and cancellation semantics plus frontend API-boundary coverage.
- 2026-04-05: Verified the final slice with `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, and `mvn -Dmaven.repo.local=../local-data/m2 verify`.
