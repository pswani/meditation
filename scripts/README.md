# Codex prompts bundle

This bundle contains:
- `.codex/config.toml` with a `deep-build` profile using `model_reasoning_effort = "high"`
- `scripts/run-codex-sequence.sh` to run the prompt sequence in order
- `prompts/` markdown files for each vertical slice and UX review/fix pass

## Where to change reasoning for every prompt
Edit:
- `.codex/config.toml`

Change this line under `[profiles.deep-build]`:
- `model_reasoning_effort = "high"`

You can switch it to `medium` or another profile if you want.

## Run the full sequence
```bash
chmod +x scripts/run-codex-sequence.sh
./scripts/run-codex-sequence.sh
```

## Run with a different profile
```bash
CODEX_PROFILE=deep-build ./scripts/run-codex-sequence.sh
```

## Run a single prompt manually
```bash
codex exec --profile deep-build "$(cat prompts/01-timer-history.md)"
```
