# Repository Hygiene Review

## Scope reviewed
- repository structure and folder consistency
- setup and prompt documentation
- route/doc naming consistency
- config/script hygiene
- tracked generated-looking artifacts
- local-only and secret-bearing file presence
- endpoint and media-directory naming consistency

## Summary
The repo is generally clean at the mechanical level: `.gitignore` is solid, there are no obvious secrets or local databases checked in, the package scripts are minimal and coherent, and generated build output does not appear to be tracked. The main hygiene issues are not dangerous files, but drift and leftover scaffolding.

The biggest discipline problem is documentation drift between the current front-end-only repository and older prompt/setup material that still describes a full-stack repo shape with backend services and missing runner scripts. After that, the main cleanup opportunities are route-doc drift, tracked duplicate Vite config artifacts that look generated from the TypeScript source config, and unused placeholder scaffolding that no longer matches the implemented app.

## What is working well
- `.gitignore` covers the important local-noise categories:
  - dependencies
  - build output
  - logs
  - temp files
  - environment files
  - test artifacts
- No obvious secret-bearing files were found:
  - no `.env*`
  - no cert/key files
  - no local databases
- Build/test scripts are concise and conventional in `package.json`.
- REST-style endpoint naming is consistent where present:
  - `/api/playlists`
  - `/api/sankalpas`
  - `/api/media/custom-plays`
- Media storage naming is at least internally consistent in the current front-end mock boundary:
  - `/media/custom-plays`

## Findings

### Critical Hygiene Issues
None identified in this pass.

### Important Cleanup Opportunities

1. Prompt/setup docs still describe an older full-stack repo shape that the current workspace does not have.
- Affected files/areas:
  - `prompts/README.md`
  - `README.md`
  - repository root structure
- Why it matters:
  - `README.md` clearly states the workspace is front-end only
  - `prompts/README.md` still describes:
    - a full-stack meditation app
    - H2 persistence
    - a required `scripts/` folder
    - `scripts/run-milestones.sh`, which is not present
- Recommended cleanup:
  - either update `prompts/README.md` to reflect the current front-end-only repository status
  - or clearly mark it as historical / upstream prompt-bundle guidance that does not match the live workspace

2. Route documentation has drifted from the implemented route structure.
- Affected files/areas:
  - `docs/architecture.md`
  - `src/App.tsx`
  - `src/app/routes.ts`
- Why it matters:
  - the architecture doc still lists `/practice/timer` and `/practice/plays`
  - the app now uses:
    - `/practice`
    - `/practice/active`
    - `/practice/playlists`
    - `/practice/playlists/active`
  - there is also a `/sankalpa` redirect alias not reflected in the main route guidance
- Recommended cleanup:
  - update the architecture doc so contributors see the real route model
  - include the current `Practice` composition and the `Sankalpa` redirect note if it remains intentional

3. Tracked `vite.config.js` and `vite.config.d.ts` appear to be generated duplicates of the real source config.
- Affected files/areas:
  - `vite.config.ts`
  - `vite.config.js`
  - `vite.config.d.ts`
- Why it matters:
  - the TypeScript source config is the real authoring file
  - the tracked JS and declaration files are not referenced by the repo’s visible config flow
  - duplicate config artifacts create confusion about which file is authoritative
- Recommended cleanup:
  - keep `vite.config.ts` as the canonical config
  - remove the duplicate JS / `.d.ts` files if they are not intentionally required
  - add ignore rules if these files are regenerated locally

4. Unused placeholder scaffolding remains in the source tree.
- Affected files/areas:
  - `src/components/PlaceholderScreen.tsx`
  - older prompt/requirements references to placeholders
- Why it matters:
  - the current app no longer appears to route through placeholder screens
  - keeping dead scaffolding in `src/components` makes the codebase look less settled than it is
- Recommended cleanup:
  - remove `PlaceholderScreen` if it is no longer part of any active implementation path
  - keep historical context in requirements docs rather than in unused source files

5. Review-document naming has drifted into two parallel conventions.
- Affected files/areas:
  - `docs/ux-review-full-app.md`
  - `docs/review-usability-full-app.md`
  - `docs/ux-review-*.md`
  - `docs/review-*.md`
- Why it matters:
  - having both `ux-review-*` and `review-*` naming schemes makes it harder to know which review artifact is canonical
  - newer prompt-driven review docs and older review docs now overlap in topic area
- Recommended cleanup:
  - choose one review-doc naming convention
  - either consolidate overlapping review documents or add a short README/index note describing which files are historical vs current prompt outputs

### Minor Polish Opportunities

1. Repo root config naming is mostly clean, but the mixed TS/JS config footprint is noisier than necessary.
- Affected files/areas:
  - repo root config files
- Why it matters:
  - the project already uses TypeScript-first config in visible places
  - reducing duplicate config formats lowers maintenance overhead
- Recommended cleanup:
  - prefer one canonical config format per tool wherever possible

2. `requirements/session-handoff.md` now acts as a rolling status file while review artifacts accumulate in `docs/`.
- Affected files/areas:
  - `requirements/session-handoff.md`
  - `docs/`
- Why it matters:
  - this is workable, but a small index of latest review artifacts would improve discoverability as more review docs accumulate
- Recommended cleanup:
  - optionally add a short review index in `docs/` or `requirements/` once the cleanup pass touches documentation structure

## Overall assessment
- folder structure consistency:
  - good
- naming conventions:
  - generally good in code, less consistent in docs/review filenames
- stale files and docs drift:
  - moderate; this is the main hygiene issue
- `.gitignore` quality:
  - good
- tracked generated artifacts:
  - one meaningful concern around duplicate Vite config artifacts
- local-only or secret-bearing files:
  - no major issue found
- README/setup clarity:
  - good in `README.md`, weaker in `prompts/README.md`
- script quality:
  - good in `package.json`, but prompt docs reference missing runner scripts
- route naming consistency:
  - strong in code, weaker in docs
- REST endpoint naming consistency:
  - good
- storage directory conventions for media files:
  - good enough for the current mock boundary

## Recommended cleanup plan

### Phase 1: important hygiene fixes
1. Align `prompts/README.md` with the current front-end-only repo and remove references to missing runner scripts.
2. Update `docs/architecture.md` to match the implemented route structure.
3. Remove tracked duplicate Vite config artifacts if they are not intentionally required.

### Phase 2: cleanup soon
1. Remove unused `PlaceholderScreen` scaffolding.
2. Normalize review-document naming and reduce overlapping review-file ambiguity.

### Phase 3: polish later
1. Add a small review-doc index or “current canonical review files” note.
2. Continue simplifying root config surface wherever duplicate artifacts exist.

## Overall recommendation
Treat this as a documentation-and-scaffolding cleanup slice, not a product-behavior change. The repo is already operationally clean; the main win now is making sure contributors see one truthful story about what this workspace is, how it is routed, and which files are canonical.
