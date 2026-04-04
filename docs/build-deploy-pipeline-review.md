# Build and Deployment Pipeline Review (Shell Script First)

## Date
2026-04-04

## Objective
Provide a clearer, high-quality build and deployment workflow that keeps the existing production behavior but reduces operator confusion.

## What was reviewed
- `scripts/prod-release.sh`
- `scripts/prod-build.sh`
- `scripts/package-deploy.sh`
- `scripts/common.sh`
- `scripts/prod-macos-setup.sh`
- `scripts/prod-macos-control.sh`
- `README.md` deployment and production sections
- `docs/mac-mini-production-runbook.md`

## Current strengths
- Production path exists end to end: build → package → install/restart.
- Scripted rendering for nginx and launchd reduces manual config drift.
- Shared helpers in `scripts/common.sh` keep env/path resolution centralized.
- Dry-run options exist in key places.

## Current pain points (why it feels confusing)
1. **Too many entry points for one job**
   - Build/deploy actions are split across many scripts with overlapping responsibilities.
   - New operators must decide between `prod-build`, `package-deploy`, `prod-release`, `prod-macos-setup`, and `prod-macos-control`.

2. **Documentation breadth over hierarchy**
   - README has detailed, useful deployment content, but the ordering can make the “first command to run” unclear.

3. **Platform-specific and generic commands are mixed together**
   - Some scripts are universally useful (`prod-build`, `package-deploy`).
   - Others are macOS-specific (`prod-macos-*`) but live in the same command namespace.

4. **Inconsistent mental model between CI quality gates and release scripts**
   - Quality checks (`typecheck`, `lint`, `test`, `build`) are required but not represented as a first-class pipeline command.

## Recommended target pipeline
Keep the existing production scripts as implementation primitives, but present a **single entry command** with four explicit stages:

1. `verify` — quality gate
2. `build` — build artifacts
3. `package` — assemble deployment bundle
4. `release` — install/update production runtime (macOS host path)

### Why this is higher quality
- One discoverable command surface for all operators.
- Preserves existing proven scripts (low migration risk).
- Supports progressive operator maturity (start with `verify`; move to `release`).
- Works well for both local release rehearsals and production-style runs.

## Implemented recommendation in this slice
Added `scripts/pipeline.sh` as a thin orchestrator over existing scripts.

### New command surface
- `./scripts/pipeline.sh verify`
- `./scripts/pipeline.sh build`
- `./scripts/pipeline.sh package [--skip-build]`
- `./scripts/pipeline.sh release [--skip-build] [--bundle-dir PATH] [--domain NAME] [--email ADDRESS]`

## Suggested operating standard
For each release candidate:

```bash
./scripts/pipeline.sh verify
./scripts/pipeline.sh package
./scripts/pipeline.sh release
```

For fast repeat installs:

```bash
./scripts/pipeline.sh package --skip-build
./scripts/pipeline.sh release --skip-build
```

## Additional near-term cleanup recommendations
1. Add npm aliases for the new unified entrypoint (`pipeline:verify`, `pipeline:package`, `pipeline:release`).
2. Add a short “Quick Start Production Pipeline” section near the top of README deployment docs.
3. Keep low-level scripts documented, but mark them as “advanced/internal primitives” for day-to-day operators.
4. Optionally split `scripts/common.sh` by concern in a later refactor (`env.sh`, `runtime.sh`, `deploy.sh`) without changing behavior.

## Out-of-scope for this slice
- Rewriting existing production scripts.
- Changing backend runtime behavior.
- Changing deployment topology.
