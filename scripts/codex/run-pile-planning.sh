#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=scripts/codex/common.sh
source "$script_dir/common.sh"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/codex/run-pile-planning.sh <pile-name> <parent-branch> <pile-brief-path> [--print]

Examples:
  ./scripts/codex/run-pile-planning.sh defects-enhancements-2026-04-18 codex/integration-2026-04-18-defects-enhancements prompts/piles/defects-enhancements-2026-04-18/pile-brief.md
  ./scripts/codex/run-pile-planning.sh defects-enhancements-2026-04-18 codex/integration-2026-04-18-defects-enhancements prompts/piles/defects-enhancements-2026-04-18/pile-brief.md --print
EOF
}

if [[ $# -lt 3 || $# -gt 4 ]]; then
  usage
  exit 1
fi

pile_name=$1
parent_branch=$2
brief_path=$3
mode="run"

if [[ $# -eq 4 ]]; then
  if [[ $4 != "--print" ]]; then
    usage
    exit 1
  fi
  mode="print"
fi

profile="pile-planning"
effort=$(reasoning_effort_for_profile "$profile")
prompt="Read prompts/run-pile-planning-workflow.md and create or refresh prompts/piles/${pile_name} using ${parent_branch} as the parent git branch. The pile brief is in ${brief_path}."

run_or_print_codex_exec "$mode" "$effort" "$prompt"
