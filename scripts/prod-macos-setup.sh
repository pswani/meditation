#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

print_usage() {
  cat <<'EOF'
Usage:
  ./scripts/prod-macos-setup.sh prepare-host [--dry-run]
  ./scripts/prod-macos-setup.sh install-app [--dry-run] [--skip-build] [--bundle-dir PATH] [--domain NAME] [--email ADDRESS]
  ./scripts/prod-macos-setup.sh all-in-one [--dry-run] [--skip-build] [--bundle-dir PATH] [--domain NAME] [--email ADDRESS]

This script installs and deploys the production-only Mac Mini stack.
It does not run vite dev or vite preview as part of the runtime.
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

require_xcode_cli() {
  if xcode-select -p >/dev/null 2>&1; then
    return 0
  fi

  printf '%s\n' "Xcode Command Line Tools are required before running this setup script."
  printf '%s\n' "Run: xcode-select --install"
  exit 1
}

ensure_homebrew() {
  if command -v brew >/dev/null 2>&1; then
    return 0
  fi

  run_step \
    "Installing Homebrew" \
    "NONINTERACTIVE=1 /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
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

  printf '%s\n' "Homebrew was not found on PATH after installation."
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

  if [ -d /usr/local/Homebrew ] || [ -d /usr/local/bin ]; then
    printf '%s\n' /usr/local
    return
  fi

  printf '%s\n' /opt/homebrew
}

prod_app_root() {
  printf '%s\n' "${MEDITATION_PROD_APP_ROOT:-/opt/meditation}"
}

prod_frontend_dir() {
  printf '%s\n' "$(prod_app_root)/app/frontend"
}

prod_backend_dir() {
  printf '%s\n' "$(prod_app_root)/app/backend"
}

prod_bin_dir() {
  printf '%s\n' "$(prod_app_root)/bin"
}

prod_shared_dir() {
  printf '%s\n' "$(prod_app_root)/shared"
}

prod_runtime_dir() {
  printf '%s\n' "${MEDITATION_PROD_RUNTIME_DIR:-$(prod_app_root)/runtime-production}"
}

prod_env_file() {
  printf '%s\n' "$(prod_shared_dir)/meditation.env"
}

prod_backend_jar_path() {
  printf '%s\n' "$(prod_backend_dir)/meditation-backend.jar"
}

prod_nginx_server_dir() {
  printf '%s\n' "$(brew_prefix)/etc/nginx/servers"
}

prod_nginx_site_path() {
  printf '%s\n' "$(prod_nginx_server_dir)/meditation.conf"
}

prod_launchd_label() {
  printf '%s\n' "com.meditation.backend"
}

prod_launchd_plist_path() {
  printf '%s\n' "/Library/LaunchDaemons/$(prod_launchd_label).plist"
}

bundle_dir_path() {
  if [ -n "$bundle_dir" ]; then
    printf '%s\n' "$(resolve_path "$bundle_dir")"
    return
  fi

  printf '%s\n' "$(deploy_dir)"
}

bundle_frontend_dir() {
  printf '%s\n' "$(bundle_dir_path)/frontend"
}

bundle_backend_jar_path() {
  printf '%s\n' "$(bundle_dir_path)/backend/meditation-backend.jar"
}

install_brew_packages() {
  run_step \
    "Installing production packages with Homebrew" \
    "brew install nginx certbot openjdk@21"
}

create_prod_directories() {
  run_step \
    "Creating production directories under $(prod_app_root)" \
    "sudo mkdir -p '$(prod_frontend_dir)' '$(prod_backend_dir)' '$(prod_bin_dir)' '$(prod_shared_dir)' '$(prod_shared_dir)/h2' '$(prod_shared_dir)/media' '$(prod_runtime_dir)/logs'"
}

ensure_bundle() {
  if [ "$skip_build" -eq 0 ]; then
    run_step \
      "Building and packaging the production deploy bundle" \
      "cd '$(resolve_path ".")' && ./scripts/package-deploy.sh"
  fi

  if [ "$dry_run" -eq 0 ]; then
    if [ ! -d "$(bundle_frontend_dir)" ]; then
      printf '%s\n' "Frontend bundle not found at $(bundle_frontend_dir)"
      exit 1
    fi

    if [ ! -f "$(bundle_backend_jar_path)" ]; then
      printf '%s\n' "Backend jar not found at $(bundle_backend_jar_path)"
      exit 1
    fi
  fi
}

install_bundle_files() {
  run_step \
    "Installing frontend bundle into $(prod_frontend_dir)" \
    "sudo rm -rf '$(prod_frontend_dir)' && sudo mkdir -p '$(prod_frontend_dir)' && sudo cp -R '$(bundle_frontend_dir)'/. '$(prod_frontend_dir)'/"

  run_step \
    "Installing backend jar into $(prod_backend_dir)" \
    "sudo cp '$(bundle_backend_jar_path)' '$(prod_backend_jar_path)'"
}

install_backend_support_scripts() {
  run_step \
    "Installing backend support scripts into $(prod_bin_dir)" \
    "sudo cp '$(resolve_path "scripts/common.sh")' '$(prod_bin_dir)/common.sh' && sudo cp '$(resolve_path "scripts/prod-backend-run.sh")' '$(prod_bin_dir)/prod-backend-run.sh' && sudo chmod 755 '$(prod_bin_dir)/common.sh' '$(prod_bin_dir)/prod-backend-run.sh'"
}

ensure_prod_env_file() {
  env_file=$(prod_env_file)

  if [ "$dry_run" -eq 1 ]; then
    printf '%s\n' "Creating production env file when missing"
    printf '  [dry-run] %s\n' "$env_file"
    return 0
  fi

  if [ -f "$env_file" ]; then
    printf '%s\n' "Keeping existing production env file at $env_file"
    return 0
  fi

  tmp_file=$(mktemp)
  cat > "$tmp_file" <<EOF
MEDITATION_BACKEND_BIND_HOST=127.0.0.1
MEDITATION_BACKEND_PORT=8080
MEDITATION_H2_DB_DIR=$(prod_shared_dir)/h2
MEDITATION_H2_DB_NAME=meditation
MEDITATION_MEDIA_STORAGE_ROOT=$(prod_shared_dir)/media
MEDITATION_RUNTIME_DIR=$(prod_runtime_dir)
MEDITATION_BACKEND_JAR_PATH=$(prod_backend_jar_path)
EOF
  sudo mv "$tmp_file" "$env_file"
  sudo chmod 640 "$env_file"
  printf '%s\n' "Created production env file at $env_file"
}

render_installed_nginx_config() {
  server_name_value=${domain_name:-${MEDITATION_NGINX_SERVER_NAME:-_}}
  listen_port_value=${MEDITATION_NGINX_LISTEN_PORT:-80}

  run_step \
    "Rendering nginx site config into $(prod_nginx_site_path)" \
    "sudo mkdir -p '$(prod_nginx_server_dir)' && sudo /bin/sh '$(resolve_path "scripts/render-nginx-config.sh")' --output '$(prod_nginx_site_path)' --frontend-root '$(prod_frontend_dir)' --backend-host 127.0.0.1 --backend-port 8080 --server-name '$server_name_value' --listen-port '$listen_port_value'"
}

render_backend_launchd_plist() {
  run_step \
    "Rendering launchd plist into $(prod_launchd_plist_path)" \
    "sudo mkdir -p '/Library/LaunchDaemons' && sudo /bin/sh '$(resolve_path "scripts/render-launchd-plist.sh")' --output '$(prod_launchd_plist_path)' --script-path '$(prod_bin_dir)/prod-backend-run.sh' --env-file '$(prod_env_file)' --log-path '$(prod_runtime_dir)/logs/backend-production.log' --error-log-path '$(prod_runtime_dir)/logs/backend-production.log'"
}

restart_backend_service() {
  label=$(prod_launchd_label)
  plist_path=$(prod_launchd_plist_path)

  run_step \
    "Reloading backend launchd service" \
    "sudo launchctl bootout system '$plist_path' >/dev/null 2>&1 || true && sudo launchctl bootstrap system '$plist_path' && sudo launchctl kickstart -k system/'$label'"
}

restart_nginx_service() {
  run_step \
    "Starting or restarting nginx through Homebrew services" \
    "sudo brew services restart nginx || sudo brew services start nginx"
}

maybe_install_certbot_certificate() {
  if [ -z "$domain_name" ] || [ -z "$email_address" ]; then
    printf '%s\n' "Skipping Certbot because --domain and --email were not both provided."
    return 0
  fi

  run_step \
    "Requesting or renewing the TLS certificate for $domain_name" \
    "sudo certbot --nginx --non-interactive --agree-tos --no-eff-email --redirect -m '$email_address' -d '$domain_name'"
}

report_runtime_summary() {
  printf '%s\n' "Production app root: $(prod_app_root)"
  printf '%s\n' "Frontend install dir: $(prod_frontend_dir)"
  printf '%s\n' "Backend jar: $(prod_backend_jar_path)"
  printf '%s\n' "Backend env file: $(prod_env_file)"
  printf '%s\n' "nginx site config: $(prod_nginx_site_path)"
  printf '%s\n' "launchd plist: $(prod_launchd_plist_path)"
}

prepare_host() {
  require_macos
  require_xcode_cli
  ensure_homebrew
  ensure_brew_on_path
  install_brew_packages
  create_prod_directories
  report_runtime_summary
}

install_app() {
  require_macos
  ensure_brew_on_path
  ensure_bundle
  create_prod_directories
  install_bundle_files
  install_backend_support_scripts
  ensure_prod_env_file
  render_installed_nginx_config
  render_backend_launchd_plist
  restart_backend_service
  restart_nginx_service
  maybe_install_certbot_certificate
  report_runtime_summary
}

if [ "$#" -eq 0 ]; then
  print_usage
  exit 1
fi

command_name=$1
shift

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
      [ "$#" -gt 0 ] || { print_usage; exit 1; }
      bundle_dir=$1
      ;;
    --domain)
      shift
      [ "$#" -gt 0 ] || { print_usage; exit 1; }
      domain_name=$1
      ;;
    --email)
      shift
      [ "$#" -gt 0 ] || { print_usage; exit 1; }
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

case "$command_name" in
  prepare-host)
    prepare_host
    ;;
  install-app)
    install_app
    ;;
  all-in-one)
    prepare_host
    install_app
    ;;
  *)
    print_usage
    exit 1
    ;;
esac
