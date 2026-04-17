#!/bin/sh

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

load_local_env() {
  if [ -f "$ROOT_DIR/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    . "$ROOT_DIR/.env"
    set +a
  fi

  if [ -f "$ROOT_DIR/.env.local" ]; then
    set -a
    # shellcheck disable=SC1091
    . "$ROOT_DIR/.env.local"
    set +a
  fi
}

resolve_path() {
  case "$1" in
    /*) printf '%s\n' "$1" ;;
    *) printf '%s/%s\n' "$ROOT_DIR" "$1" ;;
  esac
}

frontend_media_root_dir() {
  printf '%s\n' "$(resolve_path "${MEDITATION_MEDIA_ROOT:-public/media/custom-plays}")"
}

frontend_sound_root_dir() {
  printf '%s\n' "$(dirname "$(frontend_media_root_dir)")/sounds"
}

backend_media_root_dir() {
  printf '%s\n' "$(resolve_path "${MEDITATION_MEDIA_STORAGE_ROOT:-local-data/media}")/custom-plays"
}

backend_sound_root_dir() {
  printf '%s\n' "$(dirname "$(backend_media_root_dir)")/sounds"
}

backend_port() {
  printf '%s\n' "${MEDITATION_BACKEND_PORT:-8080}"
}

backend_health_url() {
  printf 'http://127.0.0.1:%s/api/health\n' "$(backend_port)"
}

backend_bind_host() {
  printf '%s\n' "${MEDITATION_BACKEND_BIND_HOST:-127.0.0.1}"
}

java_bin() {
  if [ -n "${MEDITATION_JAVA_BIN:-}" ]; then
    printf '%s\n' "$MEDITATION_JAVA_BIN"
    return
  fi

  if command -v java >/dev/null 2>&1; then
    command -v java
    return
  fi

  if [ -x /opt/homebrew/opt/openjdk@21/bin/java ]; then
    printf '%s\n' /opt/homebrew/opt/openjdk@21/bin/java
    return
  fi

  if [ -x /usr/local/opt/openjdk@21/bin/java ]; then
    printf '%s\n' /usr/local/opt/openjdk@21/bin/java
    return
  fi

  printf '\n'
}

backend_bound_health_url() {
  printf 'http://%s:%s/api/health\n' "$(backend_bind_host)" "$(backend_port)"
}

ensure_media_directory() {
  media_root=$1
  mkdir -p "$media_root"
  if [ ! -f "$media_root/.gitkeep" ]; then
    : > "$media_root/.gitkeep"
  fi
}

ensure_media_root() {
  frontend_media_root=$(frontend_media_root_dir)
  backend_media_root=$(backend_media_root_dir)
  frontend_sound_root=$(frontend_sound_root_dir)
  backend_sound_root=$(backend_sound_root_dir)
  ensure_media_directory "$frontend_media_root"
  ensure_media_directory "$backend_media_root"
  ensure_media_directory "$frontend_sound_root"
  ensure_media_directory "$backend_sound_root"
  printf '%s\n' "$frontend_media_root"
}

backend_dir() {
  if [ -n "${MEDITATION_BACKEND_DIR:-}" ]; then
    printf '%s\n' "$(resolve_path "$MEDITATION_BACKEND_DIR")"
    return
  fi

  if [ -d "$ROOT_DIR/backend" ] && [ -f "$ROOT_DIR/backend/pom.xml" ]; then
    printf '%s\n' "$ROOT_DIR/backend"
    return
  fi

  printf '\n'
}

default_backend_build_cmd() {
  dir=$(backend_dir)
  if [ -n "$dir" ] && [ -x "$dir/mvnw" ]; then
    printf '%s\n' "exec ./mvnw -Dmaven.repo.local=../local-data/m2 verify"
    return
  fi

  if [ -n "$dir" ] && [ -f "$dir/pom.xml" ]; then
    printf '%s\n' "exec mvn -Dmaven.repo.local=../local-data/m2 verify"
    return
  fi

  if [ -n "$dir" ] && [ -x "$dir/gradlew" ]; then
    printf '%s\n' "exec ./gradlew build"
    return
  fi

  printf '\n'
}

backend_build_cmd() {
  if [ -n "${MEDITATION_BACKEND_BUILD_CMD:-}" ]; then
    printf '%s\n' "$MEDITATION_BACKEND_BUILD_CMD"
    return
  fi

  default_backend_build_cmd
}

run_backend_command_inline() {
  command_name=$1
  command_value=$2
  dir=$(backend_dir)

  if [ -z "$command_value" ]; then
    printf '%s\n' "No external backend command is configured for $command_name."
    printf '%s\n' "Set MEDITATION_BACKEND_DIR and optionally MEDITATION_BACKEND_${command_name}_CMD in .env.local."
    return 1
  fi

  if [ -n "$dir" ]; then
    printf '%s\n' "Running backend $command_name command in $dir"
    (
      cd "$dir"
      sh -lc "$command_value"
    )
    return
  fi

  printf '%s\n' "Running backend $command_name command from the frontend workspace."
  (
    cd "$ROOT_DIR"
    sh -lc "$command_value"
  )
}

runtime_dir() {
  printf '%s\n' "$(resolve_path "${MEDITATION_RUNTIME_DIR:-local-data/runtime}")"
}

runtime_pid_dir() {
  printf '%s\n' "$(runtime_dir)/pids"
}

runtime_log_dir() {
  printf '%s\n' "$(runtime_dir)/logs"
}

ensure_runtime_dirs() {
  mkdir -p "$(runtime_pid_dir)" "$(runtime_log_dir)"
}

component_pid_file() {
  printf '%s/%s.pid\n' "$(runtime_pid_dir)" "$1"
}

component_log_file() {
  printf '%s/%s.log\n' "$(runtime_log_dir)" "$1"
}

read_pid_file() {
  pid_file=$(component_pid_file "$1")
  if [ -f "$pid_file" ]; then
    tr -d ' \n\r' < "$pid_file"
    return
  fi

  printf '\n'
}

pid_is_running() {
  pid=$1
  if [ -z "$pid" ]; then
    return 1
  fi

  kill -0 "$pid" 2>/dev/null
}

remove_pid_file() {
  rm -f "$(component_pid_file "$1")"
}

cleanup_stale_pid_file() {
  name=$1
  pid=$(read_pid_file "$name")

  if [ -n "$pid" ] && ! pid_is_running "$pid"; then
    remove_pid_file "$name"
  fi
}

component_is_running() {
  name=$1
  cleanup_stale_pid_file "$name"
  pid=$(read_pid_file "$name")
  pid_is_running "$pid"
}

write_pid_file() {
  name=$1
  pid=$2
  printf '%s\n' "$pid" > "$(component_pid_file "$name")"
}

port_in_use() {
  port=$1

  if command -v lsof >/dev/null 2>&1; then
    if lsof -iTCP:"$port" -sTCP:LISTEN -n -P >/dev/null 2>&1; then
      return 0
    fi
  fi

  if command -v nc >/dev/null 2>&1; then
    if nc -z 127.0.0.1 "$port" >/dev/null 2>&1; then
      return 0
    fi
  fi

  return 1
}

ensure_component_stopped() {
  name=$1
  port=${2:-}
  url=${3:-}

  if component_is_running "$name"; then
    printf '%s\n' "Managed $name process is already running."
    printf '%s\n' "Use the stop helper before starting it again."
    return 1
  fi

  if [ -n "$url" ] && url_is_reachable "$url"; then
    printf '%s\n' "Configured $name URL is already responding at $url."
    printf '%s\n' "Stop the other process or change the configured port before starting the managed stack."
    return 1
  fi

  if [ -n "$port" ] && port_in_use "$port"; then
    printf '%s\n' "Port $port is already in use by another process."
    printf '%s\n' "Free the port or change the configured port before starting the managed stack."
    return 1
  fi

  return 0
}

wait_for_http() {
  url=$1
  timeout_seconds=${2:-60}
  watched_pid=${3:-}
  attempt=0

  while [ "$attempt" -lt "$timeout_seconds" ]; do
    if url_is_reachable "$url"; then
      return 0
    fi

    if [ -n "$watched_pid" ] && ! pid_is_running "$watched_pid"; then
      return 2
    fi

    sleep 1
    attempt=$((attempt + 1))
  done

  return 1
}

url_is_reachable() {
  url=$1
  curl -fsS --max-time 2 "$url" >/dev/null 2>&1
}

append_log_header() {
  name=$1
  message=$2
  log_file=$(component_log_file "$name")
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  printf '\n[%s] %s\n' "$timestamp" "$message" >> "$log_file"
}

print_log_tail() {
  name=$1
  lines=${2:-20}
  log_file=$(component_log_file "$name")

  if [ ! -f "$log_file" ]; then
    printf '%s\n' "No log file found for $name at $log_file"
    return 0
  fi

  tail -n "$lines" "$log_file"
}

print_log_tail_since_offset() {
  name=$1
  offset=${2:-0}
  lines=${3:-20}
  log_file=$(component_log_file "$name")

  if [ ! -f "$log_file" ]; then
    printf '%s\n' "No log file found for $name at $log_file"
    return 0
  fi

  start_byte=$((offset + 1))
  tail -c +"$start_byte" "$log_file" 2>/dev/null | tail -n "$lines"
}

log_since_offset_contains() {
  name=$1
  offset=${2:-0}
  pattern=$3
  log_file=$(component_log_file "$name")

  if [ ! -f "$log_file" ]; then
    return 1
  fi

  start_byte=$((offset + 1))
  tail -c +"$start_byte" "$log_file" 2>/dev/null | grep -F "$pattern" >/dev/null 2>&1
}

stop_component() {
  name=$1
  pid=$(read_pid_file "$name")

  if [ -z "$pid" ]; then
    remove_pid_file "$name"
    return 0
  fi

  if ! pid_is_running "$pid"; then
    remove_pid_file "$name"
    return 0
  fi

  kill "$pid" 2>/dev/null || true

  attempt=0
  while [ "$attempt" -lt 20 ]; do
    if ! pid_is_running "$pid"; then
      remove_pid_file "$name"
      return 0
    fi

    sleep 1
    attempt=$((attempt + 1))
  done

  if pid_is_running "$pid"; then
    kill -9 "$pid" 2>/dev/null || true
  fi

  remove_pid_file "$name"
}

h2_db_dir() {
  printf '%s\n' "$(resolve_path "${MEDITATION_H2_DB_DIR:-local-data/h2}")"
}

h2_db_name() {
  printf '%s\n' "${MEDITATION_H2_DB_NAME:-meditation}"
}

create_temp_dir() {
  prefix=$1
  mktemp -d "${TMPDIR:-/tmp}/${prefix}.XXXXXX"
}

backend_target_dir() {
  dir=$(backend_dir)

  if [ -z "$dir" ]; then
    printf '\n'
    return
  fi

  printf '%s\n' "$dir/target"
}

deploy_dir() {
  printf '%s\n' "$(resolve_path "${MEDITATION_DEPLOY_DIR:-local-data/deploy}")"
}

deploy_frontend_dir() {
  printf '%s\n' "$(deploy_dir)/frontend"
}

deploy_backend_dir() {
  printf '%s\n' "$(deploy_dir)/backend"
}

deploy_nginx_dir() {
  printf '%s\n' "$(deploy_dir)/nginx"
}

deploy_backend_jar_path() {
  printf '%s\n' "$(deploy_backend_dir)/meditation-backend.jar"
}

deploy_backend_env_example_path() {
  printf '%s\n' "$(deploy_backend_dir)/meditation-backend.env.example"
}

deploy_nginx_config_path() {
  printf '%s\n' "$(deploy_nginx_dir)/meditation.conf"
}

nginx_server_name() {
  printf '%s\n' "${MEDITATION_NGINX_SERVER_NAME:-_}"
}

nginx_listen_port() {
  printf '%s\n' "${MEDITATION_NGINX_LISTEN_PORT:-80}"
}

backend_jar_path() {
  if [ -n "${MEDITATION_BACKEND_JAR_PATH:-}" ]; then
    printf '%s\n' "$(resolve_path "$MEDITATION_BACKEND_JAR_PATH")"
    return
  fi

  packaged_jar=$(deploy_backend_jar_path)
  if [ -f "$packaged_jar" ]; then
    printf '%s\n' "$packaged_jar"
    return
  fi

  target_dir=$(backend_target_dir)
  if [ -z "$target_dir" ] || [ ! -d "$target_dir" ]; then
    printf '\n'
    return
  fi

  jar_path=$(find "$target_dir" -maxdepth 1 -type f -name '*.jar' ! -name '*.original' | sort | tail -n 1)
  printf '%s\n' "$jar_path"
}
