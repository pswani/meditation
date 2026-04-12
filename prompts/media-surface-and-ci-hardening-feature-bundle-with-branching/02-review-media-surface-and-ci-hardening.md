# Review: Media Surface And CI Hardening

Review the implementation with a security, reliability, and enforcement mindset.

Priority areas:
1. Media-serving paths that still expose more of the filesystem than intended.
2. Service-worker behavior that still buffers large media unsafely or grows cache without clear bounds.
3. CI workflows that miss an important platform or silently diverge from local verification commands.
4. Hygiene checks that are too weak to catch known junk or too broad to block legitimate files.
5. Documentation that no longer matches the actual media or CI model.

Review workflow:
1. Read the ExecPlan and implementation diff first.
2. Inspect backend config, service-worker code, workflow files, and docs carefully.
3. Produce findings first, ordered by severity, with file references.
4. Save the review in `docs/review-media-surface-and-ci-hardening-feature.md`.

If no findings remain:
- say so explicitly
- note any residual platform or GitHub-environment limits that still need later follow-up

When complete:
- point to the review doc
- identify the highest-priority remaining hardening follow-up if any
- then continue to `03-test-media-surface-and-ci-hardening.md`
