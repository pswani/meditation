# Review: Repo Hygiene Foundation

Review the implementation with a repo-hygiene and wrong-edit-risk mindset.

Priority areas:
1. Any accidental deletion of real source, fixtures, or intentionally versioned config.
2. Ignore rules that are too broad and could hide legitimate source or docs.
3. Remaining tracked generated or mutable runtime artifacts that still violate the bundle goal.
4. Cleanup steps that are not reproducible from repo scripts or docs.
5. Config ambiguity that still leaves multiple canonical build or test entrypoints.

Review workflow:
1. Read the ExecPlan and implementation diff first.
2. Inspect ignore files, setup scripts, cleaned directories, and docs carefully.
3. Produce findings first, ordered by severity, with file references.
4. Save the review in `docs/review-repo-hygiene-foundation-feature.md`.

If no findings remain:
- say so explicitly
- note any intentionally retained tracked runtime or fixture content that future bundles should continue to respect

When complete:
- point to the review doc
- identify the highest-priority remaining hygiene follow-up if any
- then continue to `03-test-repo-hygiene-foundation.md`
