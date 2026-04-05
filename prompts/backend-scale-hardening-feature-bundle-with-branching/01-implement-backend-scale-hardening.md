Read before implementation:
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

Implementation objective:
- Make the history, summary, sankalpa, and linked-playlist save paths more production-scalable while keeping the existing product behavior and offline-first guarantees intact.

Required planning step:
1. Create and keep updated an ExecPlan at `docs/execplan-backend-scale-hardening-feature.md` before making substantial code changes.
2. Use that ExecPlan to record:
   - objective
   - scope and exclusions
   - affected modules
   - UX behavior and validations
   - data and state model
   - risks and tradeoffs
   - milestones
   - verification plan
   - decision log
   - progress log

Required behavior:
1. Replace naive full-history in-memory aggregation in the summary, sankalpa, and related history flows where a query- or repository-level approach is a cleaner production fit.
2. Add practical filtering or pagination contracts for `session log` and summary APIs.
3. Keep product behavior intact for:
   - date-range filtering
   - manual vs auto log distinctions
   - time-zone-aware summary or sankalpa behavior
   - local-first queue replay and stale-write protection
4. Batch playlist linked-`custom play` validation so playlist save does not perform per-item existence probes.
5. Tighten `src/utils/apiClient.ts` with an explicit production-friendly timeout or cancellation policy and clearer failure handling.
6. If frontend usage of the new API contracts requires UI changes, keep them minimal and confined to existing History or Goals surfaces.
7. Do not widen into reference-data cleanup, media cleanup, or screen redesign.

Suggested implementation direction:
- Prefer repository queries, projections, or aggregation helpers over loading the full history into memory when the data access pattern is predictable.
- Keep REST boundary changes explicit in the existing API helper modules.
- Preserve the current queue-backed sync surface instead of inventing a second synchronization API.
- If request cancellation or timeout behavior is introduced, keep it deliberate and testable rather than hidden in route components.

Expected affected areas:
- `backend/src/main/java/com/meditation/backend/summary/`
- `backend/src/main/java/com/meditation/backend/sankalpa/`
- `backend/src/main/java/com/meditation/backend/sessionlog/`
- `backend/src/main/java/com/meditation/backend/playlist/`
- backend repositories and controllers as needed
- `src/utils/apiClient.ts`
- `src/utils/sessionLogApi.ts`
- `src/utils/summaryApi.ts`
- any minimal frontend consumers that need to opt into the new API contracts

Required tests:
- Add or update backend tests for summary, sankalpa, session-log, and playlist-save behavior touched by this phase.
- Add or update tests for filtering or pagination contracts.
- Add or update frontend API-boundary tests for timeout, cancellation, and clearer failure handling.
- Preserve coverage for stale-write safety and idempotent `session log` replay if the touched code paths interact with those flows.

Documentation updates:
- Update `README.md` if the API or verification story changes materially.
- Update `docs/architecture.md` for the new history or summary query strategy and API-boundary behavior.
- Update `requirements/decisions.md` for long-lived backend-query or API-client decisions.
- Update `requirements/session-handoff.md` for the new repo state, artifact paths, and recommended next slice.

Verification after implementation:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`

Suggested durable artifacts:
- `docs/execplan-backend-scale-hardening-feature.md`
- `docs/review-backend-scale-hardening-feature.md`
- `docs/test-backend-scale-hardening-feature.md`

Commit expectations:
- Use a focused commit message in the repo's preferred style, such as:
  - `feat(api): scale history and summary query paths`

Deliverables before moving on:
- coherent ExecPlan
- implementation changes
- updated tests
- updated durable docs
- verification results

