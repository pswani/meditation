# ExecPlan: Summaries Review Remediation

## 1. Objective
Address the `critical` and `important` issues from `docs/review-summaries.md` for the summaries experience on `/goals`.

## 2. Why
Summary trust and clarity are core to discipline tracking. Invalid-range fallback behavior risks credibility, and missing time-of-day segmentation leaves a required insight path incomplete.

## 3. Scope
Included:
- Fix invalid custom range behavior so summary values are not shown for invalid ranges
- Add `by time of day` summary derivation and UI section
- Improve by-source row comprehension with explicit completed vs ended-early labeling
- Add focused tests for changed summary derivation and UI behavior
- Update decisions and handoff docs

Excluded:
- nice-to-have review items
- sankalpa goal-rule changes
- backend summary API work
- unrelated route/navigation refactors

## 4. Source documents
- AGENTS.md
- PLANS.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md
- docs/review-summaries.md
- prompts/milestone-c-discipline-and-insight/03-fix-summaries-review-findings.md

## 5. Affected files and modules
- `src/utils/summary.ts`
- `src/utils/summary.test.ts`
- `src/pages/SankalpaPage.tsx`
- `src/pages/SankalpaPage.test.tsx` (new)
- `src/index.css`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Invalid custom range:
  - shows validation guidance
  - does not render summary metric sections
- Summary includes:
  - overall
  - by meditation type
  - by source (with explicit completed/ended-early labels)
  - by time of day
- Layout remains calm and responsive across phone/tablet/desktop.

## 7. Data and state model
- Keep local-first summary derivation from `session log` entries.
- Add time-of-day bucket summary grouping from `endedAt`.
- Treat invalid custom range as `no valid summary window`, not as all-time fallback.

## 8. Risks
- Date-range state branching can become complex if mixed with custom input handling.
- Additional summary section could increase density if row copy is not concise.
- Time-of-day mapping must stay consistent with sankalpa bucket definitions.

## 9. Milestones
1. Update summary utility types/derivation for time-of-day support.
2. Update Sankalpa summary range handling for invalid-range behavior.
3. Improve by-source in-row semantics and add time-of-day section.
4. Add focused tests for utility derivation + route-level invalid-range behavior.
5. Run verification, update docs, and commit.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual checks:
  - invalid custom range shows no summary values
  - by-source wording is explicit
  - by-time-of-day values align with sample log times

## 11. Decision log
- Fix trust-critical invalid-range fallback by suppressing summary metrics while range is invalid.
- Reuse existing time-of-day bucket terminology to keep cross-feature comprehension consistent.
- Keep remediation scope bounded to review-prioritized summary issues only.

## 12. Progress log
- Completed: source-doc review and remediation scope alignment.
- Completed: summary utility enhancements for:
  - by-time-of-day derivation
  - snapshot expansion with time-of-day summaries
- Completed: summary range UX remediation:
  - invalid custom range no longer renders summary metrics
  - corrective empty-state guidance added
- Completed: by-source comprehension refinement:
  - explicit in-row `completed` and `ended early` labels
- Completed: focused tests:
  - `src/utils/summary.test.ts`
  - `src/pages/SankalpaPage.test.tsx`
- Completed: verification commands:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
