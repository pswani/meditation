Read before testing:
- `AGENTS.md`
- `README.md`
- `docs/architecture.md`
- `requirements/session-handoff.md`
- `docs/execplan-production-reference-cleanup-feature.md`

Goal:
- Verify the production reference and build cleanup phase thoroughly without widening scope.

Required automated verification:
- run the new or tightened single-entry verification command
- if that command does not already cover everything, also run:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`

Required focused checks:
1. Confirm shared reference-data behavior remains correct across frontend validation and backend validation paths.
2. Confirm the remaining Vite config is the only authoritative config file and that documented proxy or runtime behavior matches reality.
3. Confirm README and durable docs no longer describe stale config behavior.
4. Confirm generated artifacts such as `tsconfig.node.tsbuildinfo` are no longer tracked after the cleanup.
5. Confirm the single-entry verification path runs successfully and is documented accurately.

Artifact requirement:
- Create or update `docs/test-production-reference-cleanup-feature.md` with concise verification results.

Output requirements:
- Report pass or fail for each required command.
- Report pass or fail for each focused config, reference-data, and verification check.
- Call out any residual risk that still needs manual validation.

