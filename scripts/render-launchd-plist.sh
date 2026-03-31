#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

print_usage() {
  printf '%s\n' "Usage: ./scripts/render-launchd-plist.sh [--output PATH] [--label NAME] [--script-path PATH] [--env-file PATH] [--log-path PATH] [--error-log-path PATH]"
}

output_path=""
label="com.meditation.backend"
script_path=""
env_file="/opt/meditation/shared/meditation.env"
log_path="/opt/meditation/runtime-production/logs/backend-production.log"
error_log_path="/opt/meditation/runtime-production/logs/backend-production.log"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --output)
      shift
      [ "$#" -gt 0 ] || { print_usage; exit 1; }
      output_path=$1
      ;;
    --label)
      shift
      [ "$#" -gt 0 ] || { print_usage; exit 1; }
      label=$1
      ;;
    --script-path)
      shift
      [ "$#" -gt 0 ] || { print_usage; exit 1; }
      script_path=$1
      ;;
    --env-file)
      shift
      [ "$#" -gt 0 ] || { print_usage; exit 1; }
      env_file=$1
      ;;
    --log-path)
      shift
      [ "$#" -gt 0 ] || { print_usage; exit 1; }
      log_path=$1
      ;;
    --error-log-path)
      shift
      [ "$#" -gt 0 ] || { print_usage; exit 1; }
      error_log_path=$1
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

load_local_env

if [ -z "$script_path" ]; then
  script_path=$(resolve_path "scripts/prod-backend-run.sh")
fi

plist_text=$(cat <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "https://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${label}</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/sh</string>
        <string>${script_path}</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>MEDITATION_BACKEND_ENV_FILE</key>
        <string>${env_file}</string>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${log_path}</string>
    <key>StandardErrorPath</key>
    <string>${error_log_path}</string>
</dict>
</plist>
EOF
)

if [ -n "$output_path" ]; then
  resolved_output=$(resolve_path "$output_path")
  mkdir -p "$(dirname "$resolved_output")"
  printf '%s\n' "$plist_text" > "$resolved_output"
  printf '%s\n' "Wrote launchd plist to $resolved_output"
  exit 0
fi

printf '%s\n' "$plist_text"
