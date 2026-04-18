#!/usr/bin/env bash
set -euo pipefail

repo_root() {
  cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd
}

reasoning_effort_for_profile() {
  case "${1:-}" in
    pile-planning|group-orchestration|bundle-implementation)
      printf '%s\n' "high"
      ;;
    docs-and-cleanup)
      printf '%s\n' "medium"
      ;;
    verification|cleanup)
      printf '%s\n' "low"
      ;;
    *)
      printf '%s\n' "Unknown reasoning profile: ${1:-}" >&2
      return 1
      ;;
  esac
}

reasoning_config_key() {
  printf '%s\n' "${CODEX_REASONING_CONFIG_KEY:-reasoning_effort}"
}

run_or_print_codex_exec() {
  local mode=$1
  local effort=$2
  local prompt=$3
  local root
  local config_key

  root=$(repo_root)
  config_key=$(reasoning_config_key)

  local -a cmd=(
    codex exec
    -C "$root"
    -c "${config_key}=\"${effort}\""
    "$prompt"
  )

  if [[ "$mode" == "print" ]]; then
    printf '%q ' "${cmd[@]}"
    printf '\n'
    return 0
  fi

  "${cmd[@]}"
}
