#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

print_usage() {
  cat <<'EOF'
Usage:
  ./scripts/prod-release.sh [--dry-run] [--skip-build] [--bundle-dir PATH] [--domain NAME] [--email ADDRESS]

This is the production-only golden path:
1. package the release bundle
2. install/update the Mac production app from that bundle
EOF
}

dry_run=0
skip_build=0
bundle_dir=""
domain_name=""
email_address=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run)
      dry_run=1
      ;;
    --skip-build)
      skip_build=1
      ;;
    --bundle-dir)
      shift
      if [ "$#" -eq 0 ]; then
        print_usage
        exit 1
      fi
      bundle_dir=$1
      ;;
    --domain)
      shift
      if [ "$#" -eq 0 ]; then
        print_usage
        exit 1
      fi
      domain_name=$1
      ;;
    --email)
      shift
      if [ "$#" -eq 0 ]; then
        print_usage
        exit 1
      fi
      email_address=$1
      ;;
    --help|-h)
      print_usage
      exit 0
      ;;
    *)
      print_usage
      exit 1
      ;;
  esac
  shift
done

if [ -z "$bundle_dir" ]; then
  bundle_dir=local-data/deploy
fi

if [ "$dry_run" -eq 1 ]; then
  printf '%s\n' "Packaging production bundle"
  if [ "$skip_build" -eq 1 ]; then
    printf '%s\n' "  ./scripts/package-deploy.sh --skip-build"
  else
    printf '%s\n' "  ./scripts/package-deploy.sh"
  fi

  printf '%s\n' "Installing production bundle"
  printf '%s' "  ./scripts/prod-macos-setup.sh install-app --skip-build --bundle-dir $bundle_dir"
  if [ -n "$domain_name" ]; then
    printf '%s' " --domain $domain_name"
  fi
  if [ -n "$email_address" ]; then
    printf '%s' " --email $email_address"
  fi
  printf '%s\n' " --dry-run"
  exit 0
fi

printf '%s\n' "Packaging production bundle"
if [ "$skip_build" -eq 1 ]; then
  "$SCRIPT_DIR/package-deploy.sh" --skip-build
else
  "$SCRIPT_DIR/package-deploy.sh"
fi

printf '%s\n' "Installing production bundle"
set -- install-app --skip-build --bundle-dir "$bundle_dir"
if [ -n "$domain_name" ]; then
  set -- "$@" --domain "$domain_name"
fi
if [ -n "$email_address" ]; then
  set -- "$@" --email "$email_address"
fi

exec "$SCRIPT_DIR/prod-macos-setup.sh" "$@"
