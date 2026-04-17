# 03 Test Full Cross-Platform Sankalpa Parity

Run the most relevant verification for the full `sankalpa` parity slice.

Required verification:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- backend verification covering `sankalpa` persistence and progress behavior
- `swift test --package-path ios-native`
- relevant native Xcode build verification for the updated Goals/Home flow

Targeted evidence to capture:
- recurring duration goal behavior
- recurring session-count goal behavior
- compatibility for cumulative goals
- compatibility for observance goals
- native sync/API round-trip for recurring fields

Artifacts:
- Update `docs/test-sankalpa-full-parity-feature.md` with exact results.

When verification is complete, continue with `04-fix-sankalpa-full-parity.md`.
