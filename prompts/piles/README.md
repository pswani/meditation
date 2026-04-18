# Generated Piles

This folder stores generated pile, group, and bundle workflow artifacts.

Use this structure:

```text
prompts/piles/<pile-name>/
  README.md
  pile-brief.md
  <group-name>/
    README.md
    00-group-plan.md
    <bundle-name>/
    90-group-review.md
    91-group-test.md
    92-group-build.md
    99-group-closeout.md
```

Rules:

- `README.md` at the pile level should include the exact group-run prompts and preferred CLI helper commands.
- Group folders should be the main execution and verification unit.
- Bundle folders should be domain use cases and should usually keep 2-4 implementation prompts before local review, test, and fix prompts.
- Keep these artifacts temporary unless the user explicitly asks to retain them.
- Remove the whole pile folder from the integration branch before merging to `main` once its durable outcomes are folded into the long-lived docs and code.
