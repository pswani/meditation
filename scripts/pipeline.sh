#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

usage() {
  cat <<'USAGE'
Simple build and deploy pipeline entrypoint.

Usage:
  ./scripts/pipeline.sh verify
  ./scripts/pipeline.sh build
  ./scripts/pipeline.sh package [--skip-build]
  ./scripts/pipeline.sh release [--skip-build] [--bundle-dir PATH] [--domain NAME] [--email ADDRESS]
  ./scripts/pipeline.sh help

Commands:
  verify   Run the quality gate: typecheck, lint, test, build.
  build    Build frontend and backend artifacts.
  package  Build (unless --skip-build) and assemble local-data/deploy.
  release  Package then install via prod-macos-setup.sh install-app.

Notes:
  - This script is a thin wrapper over the existing production scripts.
  - It provides one discoverable command surface without changing runtime behavior.
USAGE
}

run_verify() {
  cd "$ROOT_DIR"
  npm run typecheck
  npm run lint
  npm run test
  npm run build
}

if [ "$#" -eq 0 ]; then
  usage
  exit 1
fi

command_name=$1
shift

case "$command_name" in
  verify)
    run_verify
    ;;
  build)
    exec "$SCRIPT_DIR/prod-build.sh"
    ;;
  package)
    exec "$SCRIPT_DIR/package-deploy.sh" "$@"
    ;;
  release)
    exec "$SCRIPT_DIR/prod-release.sh" "$@"
    ;;
  help|--help|-h)
    usage
    ;;
  *)
    printf '%s\n' "Unknown command: $command_name"
    usage
    exit 1
    ;;
esac
