# Meditation App

Calm, minimal meditation practice app built with React, TypeScript, and Vite — with a Spring Boot backend and a native iPhone app.

## Docs Index

- [docs/architecture.md](docs/architecture.md) — runtime shape, module layout, offline model
- [docs/mac-mini-production-runbook.md](docs/mac-mini-production-runbook.md) — host setup and production operations
- [PLANS.md](PLANS.md) — roadmap and planned work
- [AGENTS.md](AGENTS.md) — repo-specific agent operating rules

## Workspace Entry Points

- Web app and shared frontend code: `src/`, `public/`, `index.html`, `vite.config.ts`
- Spring Boot backend: `backend/`
- Native iPhone app:
  - `ios-native/MeditationNative.xcodeproj` — app development, simulator builds, device runs, UI tests
  - `ios-native/Package.swift` — `MeditationNativeCore` package and its core tests
- Durable product and operational docs: `docs/README.md`, `requirements/`, `AGENTS.md`, `PLANS.md`
- Repo scripts and operator flows: `scripts/`

## Supported Toolchain Baseline

- Node.js 20.x (pinned in `.nvmrc`)
- npm 10 or newer
- Java 21
- Maven 3.9 or newer
- Xcode with iOS 17+ simulator or device support for native app work
- Swift 6.3 toolchain for `swift test --package-path ios-native`

## Current Status

The repo is operational as a full-stack vertical slice:

- React SPA (Vite, TypeScript, React Router 7)
- Spring Boot backend with H2 + Flyway, REST APIs for all primary domains
- Native iPhone app (`MeditationNativeCore` package + SwiftUI app target)

Backend persistence and REST APIs are in place for:
- timer settings
- session logs (including manual logs)
- custom plays and media asset metadata
- playlists
- sankalpas (including observance-based goals and weekly cadence targets)
- summaries

Offline-first write behavior is in place for all five backend-backed domains. The sync queue persists to browser storage and flushes on reconnect with stale-write protection.

Remaining gap: no browser upload/import workflow; custom-play media registration is still script-driven.

## What The Application Does

- Home: quick start, last-used, favorite custom play / playlist shortcuts
- Timer-based meditation sessions with start, interval, and end sounds
- Custom play runtime (prerecorded sessions with resumeable playback)
- Playlists (mixed timed and linked-recording items, optional gaps, active-run recovery)
- Session history and summaries
- Sankalpa goal tracking — meditation-derived goals, manual observance goals, weekly observance goals

Primary screens: `/`, `/practice`, `/practice/active`, `/practice/custom-plays/active`, `/practice/playlists`, `/practice/playlists/active`, `/history`, `/goals`, `/settings`

## Repository Layout

```text
AGENTS.md                Repo-specific agent operating rules
PLANS.md                 Roadmap and planned work
README.md                This file
backend/                 Spring Boot + H2 backend
docs/                    Architecture, iOS, ops, and policy docs
ios-native/              Native iPhone app + MeditationNativeCore package
scripts/                 Setup, build, verification, packaging, and operator helpers
src/
  app/                  App shell and navigation
  features/             Feature logic (timer, customPlays, playlists, sankalpa, sync, home)
  pages/                Route-level screens
  types/                Shared domain types
  utils/                Validation, persistence, summaries, API boundaries
public/                 Static frontend fallback assets
local-data/             Ignored local runtime state (H2, media, deploy, build caches)
```

## Working In This Repo

### Daily developer workflow

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
cd backend && mvn -Dmaven.repo.local=../local-data/m2 verify
```

Or use the pipeline convenience wrapper:

```bash
./scripts/pipeline.sh verify
```

That runs frontend checks, backend Maven verify, and a temporary backend health smoke check against disposable runtime dirs.

Optional media setup for backend-served audio:

```bash
./scripts/setup-media-root.sh
```

### Native iOS workflow

- Core package tests: `swift test --package-path ios-native`
- App + simulator: `ios-native/MeditationNative.xcodeproj`
- Setup and connectivity guidance: [docs/ios-native/README.md](docs/ios-native/README.md)

### macOS operator workflow

| Command | What it does |
| --- | --- |
| `./scripts/pipeline.sh verify` | Frontend checks + backend `mvn verify` + health smoke |
| `./scripts/pipeline.sh build` | Builds frontend and backend artifacts |
| `./scripts/pipeline.sh package` | Builds then assembles `local-data/deploy/` |
| `./scripts/pipeline.sh release` | Packages and installs on the prepared macOS host |

Recommended operator flow on a prepared Mac host:

```bash
./scripts/setup-media-root.sh
./scripts/pipeline.sh verify
./scripts/pipeline.sh release
```

See [docs/mac-mini-production-runbook.md](docs/mac-mini-production-runbook.md) for host setup and post-install operations.

### CI

`.github/workflows/ci.yml` runs:
- `ubuntu` job: `./scripts/pipeline.sh verify` (web + backend + sync-contract diff check covering all three generated tiers)
- `macos-15` job: `swift test` + `xcodebuild test` for the iOS app

### Configuration variables

There are no required environment variables for the default production path.

Key optional variables:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Frontend API base; defaults to same-origin `/api` |
| `MEDITATION_BACKEND_BIND_HOST` | Backend bind address |
| `MEDITATION_BACKEND_PORT` | Backend port |
| `MEDITATION_H2_DB_DIR` | H2 file directory |
| `MEDITATION_MEDIA_STORAGE_ROOT` | Backend media-storage root |
| `MEDITATION_PROD_APP_ROOT` | Install root for `release` command |

See `.env.example` for the full list.

### Default ports

| Resource | Default |
| --- | --- |
| Backend bind | `http://127.0.0.1:8080/` |
| Backend health | `http://127.0.0.1:8080/api/health` |
| Public app (after nginx install) | `http://<MAC-LAN-IP>/` or configured domain |
| iPhone base URL | `http://<Mac-Local-Hostname>.local/` |

## Persistence

### Backend (H2 + Flyway)

Schema and migrations: `backend/src/main/resources/db/migration/`

H2 is file-backed in production, in-memory for tests. To reset: stop the backend, delete the H2 files from `MEDITATION_H2_DB_DIR`, restart.

### Browser storage

Browser `localStorage` acts as an offline-first cache and migration source. Keys are defined in `src/utils/storage.ts` under the `meditation.*` namespace.

To clear the frontend cache: `Object.keys(localStorage).filter(k => k.startsWith('meditation.')).forEach(k => localStorage.removeItem(k))`

## Media Files

- Backend serves `/media/custom-plays/**` and `/media/sounds/**` from the configured media root
- Place audio files under `local-data/media/custom-plays/` for backend-served development media
- `npm run media:add:custom-play -- --help` — register a new custom-play media asset
- `npm run sound:add -- --help` — add a new timer sound

See [docs/media-registration-scripts.md](docs/media-registration-scripts.md) for full docs.

## Testing

```bash
npm run typecheck && npm run lint && npm run test && npm run build
cd backend && mvn -Dmaven.repo.local=../local-data/m2 verify
swift test --package-path ios-native
```

Key test areas: `src/utils/*.test.ts`, `src/features/timer/*.test.ts`, `src/pages/*.test.tsx`, `src/App.test.tsx`

## Known Limitations

- No browser upload/import for custom-play media — registration is script-driven
- Browser autoplay policies can block timer sounds or recording playback until the session is started through an allowed interaction
