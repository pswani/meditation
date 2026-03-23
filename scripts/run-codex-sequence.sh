#!/usr/bin/env bash
set -euo pipefail

PROFILE="${CODEX_PROFILE:-deep-build}"
PROMPTS_DIR="${1:-prompts}"

run_prompt() {
  local file="$1"
  echo
  echo "============================================================"
  echo "Running: $file"
  echo "Profile: $PROFILE"
  echo "============================================================"
  codex exec --profile "$PROFILE" "$(cat "$file")"
}

run_prompt "$PROMPTS_DIR/01-timer-history.md"
run_prompt "$PROMPTS_DIR/02-ux-review-timer-history.md"
# run_prompt "$PROMPTS_DIR/03-fix-ux-timer-history.md"
# run_prompt "$PROMPTS_DIR/04-custom-plays-manual-log.md"
# run_prompt "$PROMPTS_DIR/05-ux-review-custom-plays.md"
# run_prompt "$PROMPTS_DIR/06-fix-ux-custom-plays.md"
# run_prompt "$PROMPTS_DIR/07-playlists.md"
# run_prompt "$PROMPTS_DIR/08-ux-review-playlists.md"
# run_prompt "$PROMPTS_DIR/09-fix-ux-playlists.md"
# run_prompt "$PROMPTS_DIR/10-summaries-sankalpa.md"

echo

echo "All Codex prompts completed."
