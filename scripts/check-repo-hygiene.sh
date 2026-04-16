#!/bin/sh

set -eu

usage() {
  cat <<'USAGE'
Reject generated or runtime artifact paths in diffs.

Usage:
  ./scripts/check-repo-hygiene.sh
  ./scripts/check-repo-hygiene.sh --diff-range <git-range>
  ./scripts/check-repo-hygiene.sh --paths <path> [<path> ...]

Defaults:
  - On pull requests, prefer passing --diff-range "origin/<base>...HEAD".
  - Without explicit inputs, the script checks tracked changes against HEAD.
USAGE
}

matches_rejected_path() {
  case "$1" in
    dist/*|build/*|coverage/*|backend/target/*|local-data/*|exports/*|tmp/*|temp/*|logs/*|playwright-report/*|test-results/*|.vite/*)
      return 0
      ;;
    *.log|*.tmp|*.pid|*.pid.lock|*.seed|*.tsbuildinfo|.DS_Store|Thumbs.db)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

collect_paths_from_diff() {
  git diff --name-only --diff-filter=ACMR "$1"
}

mode=diff
diff_range=

while [ "$#" -gt 0 ]; do
  case "$1" in
    --help|-h)
      usage
      exit 0
      ;;
    --diff-range)
      shift
      if [ "$#" -eq 0 ]; then
        printf '%s\n' "Missing value for --diff-range." >&2
        exit 1
      fi
      diff_range=$1
      shift
      ;;
    --paths)
      mode=paths
      shift
      break
      ;;
    *)
      printf '%s\n' "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [ "$mode" = "paths" ]; then
  if [ "$#" -eq 0 ]; then
    printf '%s\n' "Expected at least one path after --paths." >&2
    exit 1
  fi
  candidate_paths=$(printf '%s\n' "$@")
elif [ -n "$diff_range" ]; then
  candidate_paths=$(collect_paths_from_diff "$diff_range")
else
  candidate_paths=$(collect_paths_from_diff HEAD)
fi

rejected_paths=

while IFS= read -r path; do
  if [ -z "$path" ]; then
    continue
  fi

  if matches_rejected_path "$path"; then
    rejected_paths="${rejected_paths}${path}
"
  fi
done <<EOF
$candidate_paths
EOF

if [ -n "$rejected_paths" ]; then
  printf '%s\n' "Repo hygiene check failed. Remove generated or runtime artifacts from the diff:"
  printf '%s' "$rejected_paths"
  exit 1
fi

printf '%s\n' "Repo hygiene check passed."
