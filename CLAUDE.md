# CLAUDE.md

This file guides Claude Code behavior in this repository. Read it alongside `AGENTS.md` and `PLANS.md`.

## Repository overview

Full-stack meditation app:
- **Frontend**: React + TypeScript + Vite (`src/`)
- **Backend**: Spring Boot + H2 + Flyway (`backend/`)
- **iOS**: Swift native app (`ios-native/`)

Required reading before changing behavior or structure: see `AGENTS.md` → "Required reading before work".

---

## Effort profiles

Match reasoning effort to the task type. Do not always run high.

| Task type | Effort |
|---|---|
| Run tests, lint, typecheck, build | low |
| Update docs, cleanup, closeout | low–medium |
| Fix defects | medium–high |
| Analyze, design, architect, code, produce prompts, plan | high |

---

## Verification after every code change

After any code change, always run in this order:

```bash
npm run typecheck    # fast — catches type errors
npm test             # vitest run
npm run build        # full build gate
```

For backend changes also run:

```bash
./mvnw test -q
```

For iOS changes also run:

```bash
xcodebuild test -scheme MeditationApp -destination 'platform=iOS Simulator,name=iPhone 16'
```

Stop and fix failures before continuing.

---

## New features and requirements — ask first

For any new functional requirement, enhancement, or behavioral change, ask clarifying questions until you have clear, unambiguous requirements before writing code. Specifically confirm:

- What the user-visible behavior should be (screens, flows, edge cases)
- What the data/state model change is, if any
- What acceptance criteria look like
- Whether this needs backend, iOS, or only web

Do not start implementation until requirements are clear.

---

## Planning for medium and large tasks

For any task that touches more than one file in a non-trivial way, or involves new behavior, use plan mode first:

- Use `EnterPlanMode` to write and align on the plan
- Use high effort during planning
- Once the plan is approved, implement at medium effort
- Reference `PLANS.md` for the ExecPlan template

For staged multi-bundle work, follow the `Pile → Group → Bundle` structure in `prompts/README.md` and `docs/codex-staged-workflow-design.md`.

---

## Pile → Bundle → Prompt workflow

When the user brings a batch of work (a "pile"), decompose it using the staged workflow:

1. Run `prompts/run-pile-planning-workflow.md` at `high` effort to produce pile/group/bundle folders under `prompts/piles/`
2. Execute each group via `prompts/run-group-workflow.md` at `high` effort
3. Execute each bundle via `prompts/run-milestone-workflow.md` at `high` effort
4. Verify at `low` effort; fix at `medium–high` effort; re-verify at `low`

Bundle folder names must be domain use cases (e.g. `timer-active-session`), not layer names (e.g. `ui-*`, `phase-*`).

Remove generated pile folders after work is merged. Do not commit them to `main`.

---

## Skills to use

| Skill | When |
|---|---|
| `/plan` | Medium–large tasks before coding |
| `/review` | Before merging any branch |
| `/security-review` | When touching auth, CORS, headers, API boundaries |
| `/simplify` | After a feature lands — check for unnecessary complexity |
| `/fewer-permission-prompts` | If Claude is asking for too many permissions repeatedly |

---

## Engineering guard rails

- Prefer editing existing files over creating new ones.
- Do not refactor unrelated areas.
- Do not add dependencies without justification.
- Keep business logic out of large JSX trees.
- Prefer explicit types; avoid `any`.
- Use `useCallback` for prop callbacks; `useMemo` for expensive computed values.
- Always provide complete `useEffect` / `useCallback` / `useMemo` dependency arrays.
- Keep domain naming consistent with product terminology (see `requirements/decisions.md`).
- Local-first persistence is the default; backend integration requires explicit justification.

---

## Commit and branch discipline

- One integration branch per pile; one child branch per bundle.
- Merge bundle branches into the integration branch after local review+test+build pass.
- Run group-level gates (`90-group-review.md`, `91-group-test.md`, `92-group-build.md`) after all bundles in a group are done.
- Remove pile folders and generated artifacts before merging the integration branch to `main`.
- Never force-push `main`.

---

## Key scripts

```bash
npm run build              # TypeScript check + Vite build
npm run typecheck          # tsc --noEmit only
npm test                   # vitest run
npm run lint               # eslint
npm run pipeline:verify    # full pre-release gate
npm run check:repo-hygiene # hygiene checks
./mvnw test -q             # backend tests
```
