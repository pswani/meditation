# Merge Branch: Sankalpa Track Daily Activity

Merge `codex/sankalpa-track-daily-activity` back into `codex/integration-sankalpa-activity-tracking-gym-goal` only after review and required verification pass.

## Steps

1. Confirm `git status --short --branch` is clean or contains only intentional staged/committed bundle work.
2. Commit the bundle with a clear message, for example:

```bash
git commit -m "feat(sankalpa): show calm daily activity tracking"
```

3. Switch to `codex/integration-sankalpa-activity-tracking-gym-goal`.
4. Merge with:

```bash
git merge --no-ff codex/sankalpa-track-daily-activity
```

5. Confirm the integration branch status.

Do not merge to `main`.
