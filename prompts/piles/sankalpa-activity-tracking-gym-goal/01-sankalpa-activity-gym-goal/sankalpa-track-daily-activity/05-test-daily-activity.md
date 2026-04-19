# Test: Daily Activity Tracking Bundle

Run focused verification first:

```bash
npm run test -- --run src/pages/SankalpaPage.test.tsx src/features/sankalpa/useSankalpaProgress.test.ts src/utils/sankalpa.test.ts
```

Then run:

```bash
npm run typecheck
npm run lint
npm run test
```

If CSS or responsive behavior changed substantially, start the app and do browser verification for `/goals` at phone and desktop widths.

If a deterministic verification step fails, diagnose at higher effort before rerunning.
