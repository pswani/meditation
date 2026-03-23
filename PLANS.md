# PLANS.md

# Codex Execution Plans (ExecPlans)

Use an ExecPlan for:
- new major features
- major refactors
- navigation changes
- data model changes
- state management changes
- large UX redesigns

## Purpose
An ExecPlan is a living design-and-implementation plan that allows Codex to:
- research the task
- define scope
- identify risks
- propose milestones
- implement in an ordered way
- keep progress visible

## Required sections for every ExecPlan

### 1. Objective
What is being built or changed?

### 2. Why
Why this work matters to the product or user?

### 3. Scope
What is included and explicitly excluded?

### 4. Source documents
List the files and docs reviewed.

### 5. Affected files and modules
Expected areas of change.

### 6. UX behavior
Expected user-facing behavior and validations.

### 7. Data and state model
State shape, derived values, and persistence assumptions.

### 8. Risks
Known uncertainties, edge cases, and tradeoffs.

### 9. Milestones
Break work into small, reviewable milestones.

### 10. Verification
How success will be verified:
- typecheck
- lint
- test
- build
- manual behavior checks

### 11. Decision log
Record important decisions and why they were made.

### 12. Progress log
Update as work proceeds.

## Working rules
- Do not start coding until the plan is coherent.
- Resolve ambiguities using product requirements and architecture docs.
- Keep the plan updated as implementation evolves.
- Keep milestones small and concrete.
- Do not ask for “next steps” in the middle of an active plan unless truly blocked by missing business input.

## Example milestone pattern
1. define domain types and validation utilities
2. build feature state and persistence
3. implement core UI
4. wire navigation and empty states
5. add tests
6. update docs and handoff
