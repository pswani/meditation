#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=scripts/codex/common.sh
source "$script_dir/common.sh"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/codex/run-group.sh <pile-name> <group-name> <parent-branch> [phase] [--print]

Phases:
  execute   Run prompts/run-group-workflow.md for the whole group
  review    Run 90-group-review.md
  test      Run 91-group-test.md
  build     Run 92-group-build.md
  closeout  Run 99-group-closeout.md

Examples:
  ./scripts/codex/run-group.sh defects-enhancements-2026-04-18 history-quality codex/integration-2026-04-18-defects-enhancements
  ./scripts/codex/run-group.sh defects-enhancements-2026-04-18 history-quality codex/integration-2026-04-18-defects-enhancements test --print
EOF
}

if [[ $# -lt 3 || $# -gt 5 ]]; then
  usage
  exit 1
fi

pile_name=$1
group_name=$2
parent_branch=$3
phase="execute"
mode="run"

if [[ $# -ge 4 ]]; then
  case "$4" in
    execute|review|test|build|closeout)
      phase=$4
      ;;
    --print)
      mode="print"
      ;;
    *)
      usage
      exit 1
      ;;
  esac
fi

if [[ $# -eq 5 ]]; then
  if [[ $5 != "--print" ]]; then
    usage
    exit 1
  fi
  mode="print"
fi

group_path="prompts/piles/${pile_name}/${group_name}"

case "$phase" in
  execute)
    profile="group-orchestration"
    prompt="Read prompts/run-group-workflow.md and execute it for ${group_path} using ${parent_branch} as the parent git branch."
    ;;
  review)
    profile="group-orchestration"
    prompt="Read ${group_path}/90-group-review.md and execute it for ${group_path} using ${parent_branch} as the parent git branch. Follow AGENTS.md, PLANS.md, README.md, docs/codex-staged-workflow-design.md, prompts/reasoning-effort-profiles.md, requirements/decisions.md, and requirements/session-handoff.md."
    ;;
  test)
    profile="verification"
    prompt="Read ${group_path}/91-group-test.md and execute it for ${group_path} using ${parent_branch} as the parent git branch. Follow AGENTS.md, README.md, prompts/reasoning-effort-profiles.md, requirements/decisions.md, and requirements/session-handoff.md."
    ;;
  build)
    profile="verification"
    prompt="Read ${group_path}/92-group-build.md and execute it for ${group_path} using ${parent_branch} as the parent git branch. Follow AGENTS.md, README.md, prompts/reasoning-effort-profiles.md, requirements/decisions.md, and requirements/session-handoff.md."
    ;;
  closeout)
    profile="docs-and-cleanup"
    prompt="Read ${group_path}/99-group-closeout.md and execute it for ${group_path} using ${parent_branch} as the parent git branch. Follow AGENTS.md, PLANS.md, README.md, docs/codex-staged-workflow-design.md, prompts/reasoning-effort-profiles.md, requirements/decisions.md, and requirements/session-handoff.md."
    ;;
esac

effort=$(reasoning_effort_for_profile "$profile")
run_or_print_codex_exec "$mode" "$effort" "$prompt"
