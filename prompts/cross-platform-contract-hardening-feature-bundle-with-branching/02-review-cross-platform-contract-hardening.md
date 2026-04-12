# Review: Cross-Platform Contract Hardening

Review the implementation with an API-correctness and cross-runtime drift mindset.

Priority areas:
1. Contract mismatches that still allow backend, web, and iOS to disagree on the same mutation outcome.
2. Stale-write behavior that is still encoded differently by different controllers.
3. Reference-data drift or schema duplication that remains manual and fragile.
4. Missing transaction boundaries or concurrency guards on multi-step writes.
5. Tests that do not actually prove replay or conflict correctness.

Review workflow:
1. Read the ExecPlan, contract doc, and implementation diff first.
2. Inspect backend, web, iOS, and test changes carefully.
3. Produce findings first, ordered by severity, with file references.
4. Save the review in `docs/review-cross-platform-contract-hardening-feature.md`.

If no findings remain:
- say so explicitly
- note any residual compatibility or migration risk that still deserves later follow-up

When complete:
- point to the review doc
- identify the highest-priority remaining contract risk if any
- then continue to `03-test-cross-platform-contract-hardening.md`
