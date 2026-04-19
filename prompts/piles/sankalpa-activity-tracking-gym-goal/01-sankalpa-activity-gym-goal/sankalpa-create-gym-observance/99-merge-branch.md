# Merge Branch: Sankalpa Create Gym Observance

Merge `codex/sankalpa-create-gym-observance` back into `codex/integration-sankalpa-activity-tracking-gym-goal` only after review and required verification pass.

## Steps

1. Confirm `git status --short --branch` is clean or contains only intentional staged/committed bundle work.
2. Commit the bundle with a clear message, for example:

```bash
git commit -m "feat(sankalpa): support weekly gym observance goals"
```

3. Switch to `codex/integration-sankalpa-activity-tracking-gym-goal`.
4. Merge with:

```bash
git merge --no-ff codex/sankalpa-create-gym-observance
```

5. Confirm the integration branch status.

Do not merge to `main`.
