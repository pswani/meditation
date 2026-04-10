# Review: iOS Native Media And Sound Parity

Review the implementation with a code-review mindset.

Priority areas:
1. Any remaining mismatch between the web sound contract and the native sound contract.
2. Any path where `custom play` or playlist-linked recording behavior still pretends to be real playback when it is not.
3. Regression risk in sync, snapshot, or persistence models caused by new media metadata.
4. Test gaps around normalization, migration, or runtime transitions.
5. UX issues introduced by the new media and sound surfaces.

Review workflow:
1. Read the ExecPlan and implementation diff first.
2. Inspect changed files carefully, especially domain, runtime, sync, and settings surfaces.
3. Produce findings first, ordered by severity, with file references.
4. Save the review in `docs/review-ios-native-media-sound-parity-feature.md`.

If no findings remain:
- state that explicitly
- include residual risks and any real-device validation still pending

When complete:
- point to the review doc
- identify the highest-priority follow-up if any
- then continue to `03-test-ios-native-media-sound-parity.md`
