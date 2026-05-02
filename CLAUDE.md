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

Match reasoning effort to the task type. Never default every task to high.

| Task type | Effort |
|---|---|
| Run tests, lint, typecheck, build, deterministic cleanup | low |
| Update docs, release-readiness summaries, closeout notes | low–medium |
| Fix defects | medium–high |
| Analyze, design, architect, code, produce prompts, plan | high |
| Verification failure diagnosis and fix planning | high (escalate from low) |

**Escalation rule**: if a `low`-effort verification step fails, switch to `high` effort to diagnose and fix, then rerun verification at `low`.

---

## Verification after every code change

After any code change, always run in this order at **low effort**:

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

Stop and fix failures before continuing. Switch to **medium–high effort** to fix; rerun verification at **low effort**.

---

## New features and requirements — ask first

For any new functional requirement, enhancement, or behavioral change, ask clarifying questions at **high effort** until requirements are unambiguous. Specifically confirm:

- What the user-visible behavior should be (screens, flows, edge cases)
- What the data/state model change is, if any
- What acceptance criteria look like
- Whether this needs backend, iOS, or only web
- What is explicitly out of scope

Do not start implementation until all questions are answered and requirements are clear.

---

## Planning for medium and large tasks

For any task that touches more than one file in a non-trivial way, or introduces new behavior:

1. Use `EnterPlanMode` at **high effort** to write and align on the plan
2. Reference `PLANS.md` for the ExecPlan template
3. Once the plan is approved, implement at **medium effort**
4. Verify at **low effort**; fix failures at **medium–high effort**

For trivial single-file fixes, skip plan mode and implement directly at **medium effort**.

For staged multi-bundle work, use the `/pile-plan` skill — see below.

---

## Skills

| Skill | When | Effort |
|---|---|---|
| `/pile-plan` | Decompose a batch of work into pile → group → bundle prompts | high |
| `/plan` | Medium–large tasks before coding | high |
| `/review` | Before merging any branch | medium |
| `/security-review` | When touching auth, CORS, headers, API boundaries | high |
| `/simplify` | After a feature lands — check for unnecessary complexity | medium |
| `/fewer-permission-prompts` | If Claude is asking for too many permissions repeatedly | low |

---

## `/pile-plan` skill — pile → bundle → prompt workflow

Use this skill whenever the user brings a batch of work (a "pile") that spans multiple features or user journeys.

**Trigger phrase**: user describes a batch of work, or says "plan this pile", "decompose this work", or references `prompts/piles/`.

**Steps** (run at `high` effort throughout):

1. Read `prompts/run-pile-planning-workflow.md`, `AGENTS.md`, `PLANS.md`, `prompts/reasoning-effort-profiles.md`, and `requirements/decisions.md`.
2. Confirm with the user: pile name, integration branch name, and the pile brief (inline or from `prompts/piles/<pile-name>/pile-brief.md`).
3. Decompose the pile into `Group`s → `Bundle`s following the rules in `prompts/run-pile-planning-workflow.md`.
4. Generate the full folder structure under `prompts/piles/<pile-name>/`:
   - `README.md` (integration branch, group order, exact prompts per group, cleanup rule)
   - `pile-brief.md` if not already provided
   - One group folder per group, each containing:
     - `README.md`, `00-group-plan.md`, `90-group-review.md`, `91-group-test.md`, `92-group-build.md`, `99-group-closeout.md`
     - Bundle folders named as domain use cases (`<domain>-<use-case>`)
   - Each bundle folder containing: `00-create-branch.md`, `01-implement-*.md` … `03-implement-*.md`, `04-review-*.md`, `05-test-*.md`, `06-fix-*.md`, `99-merge-branch.md`
5. Map reasoning profiles per `prompts/reasoning-effort-profiles.md`: planning = `pile-planning`, group execution = `group-orchestration`, bundle implementation = `bundle-implementation`, docs/closeout = `docs-and-cleanup`, verification = `verification`.
6. Remove generated pile folders from the integration branch before merging to `main` unless the user explicitly says to keep them.

**Naming rules**:
- Bundle folders: domain use-case names (`timer-active-session`, `sankalpa-create-goal`) — never layer names (`ui-*`, `phase-*`, `api-*`).
- Each bundle = one meaningful vertical slice covering a real user journey.

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
- Merge bundle branches into the integration branch after local review + test + build pass.
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
