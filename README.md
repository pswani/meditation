# Meditation App

A focused meditation practice app built with React, TypeScript, and Vite.

## Repository status

- Milestone D release-readiness handoff is complete as of `2026-03-24`.
- This repository currently contains the React front end.
- A dedicated back-end service is not yet present in this workspace.
- Local persistence is used as the current baseline storage approach.

## Release candidate snapshot

Implemented and verified in the current front-end baseline:
- responsive app shell and navigation
- Home, Practice, History, Sankalpa, and Settings screens
- timer setup and active session flow
- custom plays
- playlists and active playlist runs
- automatic and manual session logging
- summaries and sankalpa goals
- favorites and startup recovery for active flows

Current v1 release-candidate gaps still to close:
- timer and playlist sound selections are still mocked choices; actual sound playback is not implemented yet
- playlists do not yet support the product-requirement option for a small gap between items
- custom play media uses a fixed local metadata catalog; user-managed media import and a real backend media library are not implemented in this workspace

## Product focus

This app is designed as a disciplined meditation practice tool, not a broad wellness marketplace.

Core capabilities:
- timer-based meditation
- meditation types
- custom meditation plays
- playlists
- automatic and manual session logging
- summaries and insights
- sankalpa goals

## Meditation types
- Vipassana
- Ajapa
- Tratak
- Kriya
- Sahaj

## UX scope

The UX must work well across:
- mobile phones
- tablets
- laptops
- desktops

Design goals:
- responsive layouts
- calm and uncluttered UI
- quick meditation start on mobile
- efficient information density on desktop
- consistent terminology and flows across breakpoints

## Tech stack
- React
- TypeScript
- Vite
- React Router
- local state first
- local persistence first

## Getting started

### 1. Install Node.js
Use Node 20+.

### 2. Install dependencies
```bash
npm ci
```

### 3. Start the app
```bash
npm run dev
```
Vite prints the local dev URL in the terminal (typically `http://localhost:5173/`).

### 4. Build for production
```bash
npm run build
```

### 5. Preview production build
```bash
npm run preview
```

## Local run baseline checklist

Run these commands to verify the current baseline in order:

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
```

After checks pass, start local development:

```bash
npm run dev
```

Vite prints the local URL in the terminal (typically `http://localhost:5173/`).

## Quality commands

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Release handoff notes

- Package scripts verified for local development: `dev`, `build`, `preview`, `typecheck`, `lint`, and `test`.
- The repository is currently ready for front-end release-candidate handoff, not for backend deployment.
- If you are continuing v1 product work, start from the remaining gaps above and keep `requirements/decisions.md` plus `requirements/session-handoff.md` current after each slice.

## Suggested implementation order
1. app shell and responsive navigation
2. timer flow
3. meditation types
4. custom plays
5. playlists
6. logging
7. summaries
8. sankalpa goals

## Codex notes
Read:
- AGENTS.md
- PLANS.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md
- requirements/prompts.md

Before major feature work:
- plan first
- keep changes scoped
- update requirements/session-handoff.md and requirements/decisions.md
- run lint, test, typecheck, and build
