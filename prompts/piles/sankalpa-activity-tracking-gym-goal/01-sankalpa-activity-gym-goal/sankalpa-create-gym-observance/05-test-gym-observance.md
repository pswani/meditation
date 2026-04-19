# Test: Gym Observance Bundle

Run focused verification first, then broader checks as appropriate.

Suggested focused commands:

```bash
npm run test -- --run src/utils/sankalpa.test.ts src/pages/SankalpaPage.test.tsx
```

If API or backend code changed, run the relevant backend tests or:

```bash
./scripts/pipeline.sh verify
```

Before merging this bundle, run at least:

```bash
npm run typecheck
npm run lint
npm run test
```

If a deterministic verification step fails, diagnose at `bundle-implementation` effort and rerun verification after fixing.
