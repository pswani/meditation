#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

print_usage() {
  cat <<'EOF'
Usage:
  ./scripts/prod-macos-control.sh start [--dry-run]
  ./scripts/prod-macos-control.sh stop [--dry-run]
  ./scripts/prod-macos-control.sh restart [--dry-run]
  ./scripts/prod-macos-control.sh status
  ./scripts/prod-macos-control.sh logs [--dry-run] [--lines COUNT] [--no-follow]

This script manages the Mac Mini production services together:
- Homebrew nginx
- the backend launchd service
EOF
}

run_step() {
  description=$1
  command_text=$2

  printf '%s\n' "$description"
  if [ "$dry_run" -eq 1 ]; then
    printf '  [dry-run] %s\n' "$command_text"
    return 0
  fi

  sh -lc "$command_text"
}

require_macos() {
  if [ "$(uname -s)" != "Darwin" ]; then
    printf '%s\n' "This script is intended for macOS hosts."
    exit 1
  fi
}

ensure_brew_on_path() {
  if command -v brew >/dev/null 2>&1; then
    return 0
  fi

  if [ -x /opt/homebrew/bin/brew ]; then
    PATH="/opt/homebrew/bin:$PATH"
    export PATH
    return 0
  fi

  if [ -x /usr/local/bin/brew ]; then
    PATH="/usr/local/bin:$PATH"
    export PATH
    return 0
  fi

  printf '%s\n' "Homebrew is not available on PATH."
  exit 1
}

brew_prefix() {
  if command -v brew >/dev/null 2>&1; then
    brew --prefix
    return
  fi

  if [ -d /opt/homebrew ]; then
    printf '%s\n' /opt/homebrew
    return
  fi

  printf '%s\n' /usr/local
}

prod_app_root() {
  printf '%s\n' "${MEDITATION_PROD_APP_ROOT:-/opt/meditation}"
}

prod_runtime_dir() {
  printf '%s\n' "${MEDITATION_PROD_RUNTIME_DIR:-$(prod_app_root)/runtime-production}"
}

prod_backend_jar_path() {
  printf '%s\n' "$(prod_app_root)/app/backend/meditation-backend.jar"
}

prod_frontend_index_path() {
  printf '%s\n' "$(prod_app_root)/app/frontend/index.html"
}

prod_backend_log_path() {
  printf '%s\n' "$(prod_runtime_dir)/logs/backend-production.log"
}

prod_launchd_label() {
  printf '%s\n' "com.meditation.backend"
}

prod_launchd_plist_path() {
  printf '%s\n' "/Library/LaunchDaemons/$(prod_launchd_label).plist"
}

prod_nginx_site_path() {
  printf '%s\n' "$(brew_prefix)/etc/nginx/servers/meditation.conf"
}

backend_health_url() {
  printf '%s\n' "http://127.0.0.1:8080/api/health"
}

backend_service_loaded() {
  sudo launchctl print "system/$(prod_launchd_label)" >/dev/null 2>&1
}

backend_http_state() {
  if curl -fsS --max-time 2 "$(backend_health_url)" >/dev/null 2>&1; then
    printf '%s\n' "healthy"
    return
  fi

  printf '%s\n' "unreachable"
}

nginx_service_state() {
  state=$(brew services list | awk '$1 == "nginx" {print $2}')
  if [ -n "$state" ]; then
    printf '%s\n' "$state"
    return
  fi

  printf '%s\n' "not-installed"
}

assert_installed() {
  if [ ! -f "$(prod_backend_jar_path)" ]; then
    printf '%s\n' "Backend jar not found at $(prod_backend_jar_path)"
    printf '%s\n' "Run ./scripts/prod-macos-setup.sh install-app --bundle-dir local-data/deploy first."
    exit 1
  fi

  if [ ! -f "$(prod_frontend_index_path)" ]; then
    printf '%s\n' "Frontend install not found at $(prod_frontend_index_path)"
    printf '%s\n' "Run ./scripts/prod-macos-setup.sh install-app --bundle-dir local-data/deploy first."
    exit 1
  fi

  if [ ! -f "$(prod_launchd_plist_path)" ]; then
    printf '%s\n' "Backend launchd plist not found at $(prod_launchd_plist_path)"
    printf '%s\n' "Run ./scripts/prod-macos-setup.sh install-app --bundle-dir local-data/deploy first."
    exit 1
  fi

  if [ ! -f "$(prod_nginx_site_path)" ]; then
    printf '%s\n' "nginx site config not found at $(prod_nginx_site_path)"
    printf '%s\n' "Run ./scripts/prod-macos-setup.sh install-app --bundle-dir local-data/deploy first."
    exit 1
  fi
}

start_backend_service() {
  if backend_service_loaded; then
    run_step \
      "Restarting backend launchd service" \
      "sudo launchctl kickstart -k system/'$(prod_launchd_label)'"
    return
  fi

  run_step \
    "Bootstrapping backend launchd service" \
    "sudo launchctl bootstrap system '$(prod_launchd_plist_path)' && sudo launchctl kickstart -k system/'$(prod_launchd_label)'"
}

stop_backend_service() {
  if backend_service_loaded; then
    run_step \
      "Stopping backend launchd service" \
      "sudo launchctl bootout system '$(prod_launchd_plist_path)'"
    return
  fi

  printf '%s\n' "Backend launchd service is not loaded."
}

start_nginx_service() {
  run_step \
    "Starting or restarting nginx" \
    "sudo brew services start nginx || sudo brew services restart nginx"
}

stop_nginx_service() {
  if [ "$(nginx_service_state)" = "none" ] || [ "$(nginx_service_state)" = "not-installed" ]; then
    printf '%s\n' "nginx is already stopped."
    return
  fi

  run_step \
    "Stopping nginx" \
    "sudo brew services stop nginx"
}

print_status() {
  if [ "$dry_run" -eq 1 ]; then
    printf '%s\n' "nginx service: [dry-run]"
    printf '%s\n' "nginx site config: $(prod_nginx_site_path)"
    printf '%s\n' "backend launchd: [dry-run]"
    printf '%s\n' "backend plist: $(prod_launchd_plist_path)"
    printf '%s\n' "backend jar: $(prod_backend_jar_path)"
    printf '%s\n' "backend health: [dry-run]"
    return
  fi

  printf '%s\n' "nginx service: $(nginx_service_state)"
  printf '%s\n' "nginx site config: $(prod_nginx_site_path)"

  if backend_service_loaded; then
    backend_launchd_state="loaded"
  else
    backend_launchd_state="not-loaded"
  fi

  printf '%s\n' "backend launchd: $backend_launchd_state"
  printf '%s\n' "backend plist: $(prod_launchd_plist_path)"
  printf '%s\n' "backend jar: $(prod_backend_jar_path)"
  printf '%s\n' "backend health: $(backend_http_state)"
}

clean_start() {
  assert_installed
  start_nginx_service
  start_backend_service

  if [ "$dry_run" -eq 0 ]; then
    if wait_for_http "$(backend_health_url)" 60; then
      printf '%s\n' "Backend health is up at $(backend_health_url)"
    else
      printf '%s\n' "Backend health did not become ready at $(backend_health_url)"
      exit 1
    fi
  fi

  print_status
}

clean_stop() {
  stop_backend_service
  stop_nginx_service
  print_status
}

show_logs() {
  log_path=$(prod_backend_log_path)

  if [ "$dry_run" -eq 1 ]; then
    if [ "$follow_logs" -eq 1 ]; then
      printf '%s\n' "[dry-run] tail -n $log_lines -f '$log_path'"
    else
      printf '%s\n' "[dry-run] tail -n $log_lines '$log_path'"
    fi
    return 0
  fi

  if [ ! -f "$log_path" ]; then
    printf '%s\n' "Backend log not found at $log_path"
    printf '%s\n' "Start the production app or check the install layout first."
    exit 1
  fi

  if [ "$follow_logs" -eq 1 ]; then
    exec tail -n "$log_lines" -f "$log_path"
  fi

  tail -n "$log_lines" "$log_path"
}

if [ "$#" -eq 0 ]; then
  print_usage
  exit 1
fi

command_name=$1
shift

dry_run=0
log_lines=40
follow_logs=1

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run)
      dry_run=1
      ;;
    --lines)
      shift
      [ "$#" -gt 0 ] || { print_usage; exit 1; }
      log_lines=$1
      ;;
    --no-follow)
      follow_logs=0
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

require_macos
ensure_brew_on_path

case "$command_name" in
  start)
    clean_start
    ;;
  stop)
    clean_stop
    ;;
  restart)
    clean_stop
    clean_start
    ;;
  status)
    print_status
    ;;
  logs)
    show_logs
    ;;
  *)
    print_usage
    exit 1
    ;;
esac
