Read before fixing:
- `AGENTS.md`
- `README.md`
- `docs/execplan-observance-sankalpa-feature.md`
- `docs/review-observance-sankalpa-feature.md`
- `docs/test-observance-sankalpa-feature.md`

Goal:
- Address the actionable issues discovered during review and verification for the observance-based sankalpa slice without widening scope.

Fix requirements:
1. Resolve blocker, high, and medium review findings before considering the slice complete.
2. Re-run the smallest meaningful verification set after each fix, then re-run the full required verification set before closing the bundle.
3. Update the ExecPlan progress log and any durable docs affected by the fixes.
4. Keep the final behavior calm, auditable, and aligned with the product terminology.

Output requirements:
- Summarize which issues were fixed.
- List the verification commands re-run.
- Report any remaining low-risk follow-ups separately from the completed slice.
