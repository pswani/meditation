# ExecPlan: Intent Remediation Bundle

## 1. Objective
Close the highest-value gaps between the current application and the intended meditation-app behavior, while keeping each implementation step bounded enough to complete safely and verify thoroughly.

## 2. Why
The current app already covers most of the product surface area, but a few gaps still prevent it from feeling fully trustworthy and intent-complete:
- the documented default local full-stack startup path is not reliable on the persisted default H2 database
- `custom play` is still metadata plus timer preset behavior rather than a true runnable pre-recorded meditation-session flow
- Home is missing the documented `start last used meditation` shortcut
- playlist behavior still stops short of the intended sequencing scope
- several docs and historical artifacts still describe an older repo state

## 3. Scope
Included:
- a prioritized remediation roadmap with bounded vertical slices
- dependencies and execution order for the major remaining gaps
- the first recommended slice to implement now

Excluded:
- direct product-code implementation in this planning step
- speculative redesign work that is not required to close the documented gaps

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `requirements/intent.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/review-intent-compliance-full-app.md`
- `docs/pending-work-inventory.md`

## 5. Affected files and modules
Expected implementation areas across the bundle:
- managed local runtime scripts under `scripts/`
- backend startup and migration handling under `backend/`
- launch surfaces in `src/pages/`
- runtime orchestration in `src/features/`
- persistence and API helpers in `src/utils/`
- durable product and developer docs in `README.md`, `docs/`, and `requirements/`

## 6. UX behavior
- startup and verification flows should be calm, explicit, and repo-owned rather than relying on ad hoc local cleanup
- Home should remain fast-start and minimal, with any added shortcut clearly distinct from quick start and favorites
- `custom play` should eventually behave as a true pre-recorded session, not just a timer preset
- playlist improvements should preserve the existing calm sequencing model and avoid dashboard-style controls

## 7. Data and state model
- startup remediation should preserve trustworthy behavior for the default local H2 path, either by reconciling legacy migration history or by adding an explicit, safe repair/reset path
- launch-context persistence for Home should use stable domain terminology and avoid overloading timer defaults
- `custom play` and playlist follow-up slices should build on existing REST boundaries and persisted domain types rather than introducing parallel ad hoc state paths

## 8. Risks
- the default H2/Flyway failure may require carefully balancing startup repair against preserving developer data
- `custom play` runtime touches timer, playback, logging, summaries, and sankalpa integration, so it should not be combined with unrelated launch-surface work
- playlist scope can grow quickly if it tries to solve both richer item modeling and runtime polish in one pass
- repo cleanup must avoid deleting operational docs or scripts that still provide real maintenance value

## 9. Milestones

### Slice 1. Restore the default local startup baseline
Objective:
- make the documented managed local app flow trustworthy again on the default persisted H2 path

Included requirements and gaps:
- fix the blocker from `docs/review-intent-compliance-full-app.md` where `npm run start:app` fails against `local-data/h2/meditation`
- provide a repo-owned repair or reset path if legacy local data cannot be migrated transparently
- verify `npm run start:app`, `npm run status:app`, backend health, frontend reachability, and one representative persisted API flow
- align README and handoff guidance with the repaired behavior

Explicit exclusions:
- no unrelated product-feature work
- no broader backend refactor beyond what is needed for reliable startup and verification

Affected files/modules:
- `scripts/`
- `backend/src/main/resources/`
- backend startup or migration helpers under `backend/`
- `README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

Key UX and validation expectations:
- default startup should either succeed or give explicit recovery guidance owned by the repo
- repair/reset behavior must clearly target local development data only

Backend, API, and data implications:
- Flyway/H2 compatibility handling
- possibly a documented local reset or repair command for the default database

Risk notes:
- safest path may be a repair workflow instead of trying to infer intent from corrupted legacy migration state

Verification plan:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- relevant backend verification for startup, health, and one persisted API path

### Slice 2. Add Home `start last used meditation`
Objective:
- close the missing low-friction Home launch path with a bounded, trustworthy shortcut

Included requirements and gaps:
- implement the documented Home `start last used meditation` behavior
- persist the last-used launch context from the currently supported launch surfaces
- surface a calm distinct Home action that starts that context without mutating saved defaults

Explicit exclusions:
- no `custom play` runtime redesign in this slice
- no playlist model expansion beyond recording enough launch context to restart an existing supported flow

Affected files/modules:
- `src/pages/HomePage.tsx`
- timer, playlist, and custom-play launch helpers in `src/features/`
- storage or API helpers in `src/utils/`
- focused Home and launch-flow tests

Key UX and validation expectations:
- the shortcut should be obvious and fast without crowding Home
- if there is no last-used meditation yet, Home should stay calm and omit or soften the action cleanly

Backend, API, and data implications:
- likely local persistence only for launch context
- no required backend contract change

Risk notes:
- the last-used model must distinguish saved defaults from actual last launched behavior
- the slice should stay truthful about unsupported runnable `custom play` media behavior

Verification plan:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

### Slice 3. Turn `custom play` into a real pre-recorded meditation-session flow
Objective:
- make `custom play` an actual runnable linked-session experience rather than only a saved preset

Included requirements and gaps:
- primary `Run Custom Play` entry points
- playback of the linked media session with configured meditation type and optional start/end sounds
- trustworthy completion and end-early logging into History, Summary, and Sankalpa

Explicit exclusions:
- no broader playlist redesign in the same slice
- no media import/upload workflow beyond the existing catalog and file-path model

Affected files/modules:
- `src/features/customPlays/`
- active-session runtime under `src/features/timer/`
- media helpers under `src/utils/`
- backend media or session-log boundaries only where needed
- Home and Practice launch surfaces

Key UX and validation expectations:
- custom-play actions should clearly differentiate `Run` from `Use` if both remain
- runtime should feel calm and trustworthy on phone, tablet, and desktop

Backend, API, and data implications:
- may require extending session-log source modeling and active-session state
- may need light media API or persistence changes

Risk notes:
- highest product-value feature gap, but materially larger than the other slices

Verification plan:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- relevant backend verification if contracts or persistence change

### Slice 4. Complete playlist runtime behavior
Objective:
- close the remaining playlist requirement gap without overextending scope

Included requirements and gaps:
- add optional small gaps between playlist items
- confirm and implement the intended sequencing model for current supported meditation units

Explicit exclusions:
- no unrelated media-management redesign
- no Home IA overhaul beyond playlist launch behavior needed for the slice

Affected files/modules:
- `src/features/playlists/`
- `src/features/timer/`
- playlist API helpers in `src/utils/`
- backend playlist contract if `small_gap_seconds` needs frontend exposure changes

Key UX and validation expectations:
- gap controls should stay progressive and secondary
- runtime should remain easy to understand, especially on narrow screens

Backend, API, and data implications:
- use the existing `small_gap_seconds` backend support where applicable

Risk notes:
- should follow the custom-play runtime decision so playlist sequencing does not bake in the wrong long-term meditation-unit model

Verification plan:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- relevant backend verification if playlist contracts change

### Slice 5. Cleanup and truth-alignment pass
Objective:
- leave the repository easier to trust and navigate after the remediation work lands

Included requirements and gaps:
- final intent audit
- rewrite or remove stale roadmap, review, prompt-tracking, and handoff artifacts that no longer provide durable value
- update repo instructions so remaining docs no longer depend on deleted tracking files

Explicit exclusions:
- no new product-feature work unless required to keep surviving docs truthful

Affected files/modules:
- `README.md`
- `AGENTS.md`
- `docs/`
- `requirements/`
- non-functional tracking scripts if any remain

Key UX and validation expectations:
- none user-facing beyond documentation truthfulness

Backend, API, and data implications:
- none unless cleanup removes or rewrites operational scripts

Risk notes:
- cleanup must classify files carefully to avoid deleting useful operational knowledge

Verification plan:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- relevant backend verification if operational scripts or setup docs change

## 10. Verification
- Every implementation slice runs:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
- Backend slices also verify the affected local backend behavior directly.
- Review-only and audit-only steps should leave the tree clean and commit only documentation changes.

## 11. Decision log
- Prioritize restoring the default full-stack startup baseline first because later feature slices need a trustworthy verification environment.
- Pull Home `start last used meditation` ahead of the larger `custom play` runtime slice so the bundle can close one meaningful documented product gap with bounded risk after the startup fix.
- Keep the much larger `custom play` and playlist behavior gaps explicitly planned rather than forcing both into this bundle before the baseline and Home shortcut behavior are stable.

## 12. Progress log
- 2026-04-01: Reviewed intent, audit, inventory, and repo guidance; defined five bounded slices for the bundle.
- 2026-04-01: Recommended slice 1 as startup reliability because it unblocks trustworthy local verification for all later slices.

## Recommended first slice
Implement Slice 1, `Restore the default local startup baseline`, first. It removes the current blocker on trustworthy default full-stack verification, reduces risk for every later slice, and can be completed end to end without mixing in broader product redesign work.
