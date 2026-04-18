#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=scripts/codex/common.sh
source "$script_dir/common.sh"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/codex/run-bundle.sh <bundle-path> <parent-branch> [--print]

Examples:
  ./scripts/codex/run-bundle.sh prompts/piles/defects-enhancements-2026-04-18/history-quality/session-log-edit-manual-entry codex/integration-2026-04-18-defects-enhancements
  ./scripts/codex/run-bundle.sh prompts/piles/defects-enhancements-2026-04-18/history-quality/session-log-edit-manual-entry codex/integration-2026-04-18-defects-enhancements --print
EOF
}

if [[ $# -lt 2 || $# -gt 3 ]]; then
  usage
  exit 1
fi

bundle_path=$1
parent_branch=$2
mode="run"

if [[ $# -eq 3 ]]; then
  if [[ $3 != "--print" ]]; then
    usage
    exit 1
  fi
  mode="print"
fi

profile="bundle-implementation"
effort=$(reasoning_effort_for_profile "$profile")
prompt="Read prompts/run-milestone-workflow.md and execute it for ${bundle_path} using ${parent_branch} as the parent git branch."

run_or_print_codex_exec "$mode" "$effort" "$prompt"
