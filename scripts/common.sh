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

backend_media_root_dir() {
  printf '%s\n' "$(resolve_path "${MEDITATION_MEDIA_STORAGE_ROOT:-local-data/media}")/custom-plays"
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
  ensure_media_directory "$frontend_media_root"
  ensure_media_directory "$backend_media_root"
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

default_backend_dev_cmd() {
  dir=$(backend_dir)
  if [ -n "$dir" ] && [ -x "$dir/mvnw" ]; then
    printf '%s\n' "./mvnw -Dmaven.repo.local=../local-data/m2 spring-boot:run -Dspring-boot.run.profiles=dev"
    return
  fi

  if [ -n "$dir" ] && [ -f "$dir/pom.xml" ]; then
    printf '%s\n' "mvn -Dmaven.repo.local=../local-data/m2 spring-boot:run -Dspring-boot.run.profiles=dev"
    return
  fi

  if [ -n "$dir" ] && [ -x "$dir/gradlew" ]; then
    printf '%s\n' "./gradlew bootRun --args='--spring.profiles.active=dev'"
    return
  fi

  printf '\n'
}

default_backend_build_cmd() {
  dir=$(backend_dir)
  if [ -n "$dir" ] && [ -x "$dir/mvnw" ]; then
    printf '%s\n' "./mvnw -Dmaven.repo.local=../local-data/m2 verify"
    return
  fi

  if [ -n "$dir" ] && [ -f "$dir/pom.xml" ]; then
    printf '%s\n' "mvn -Dmaven.repo.local=../local-data/m2 verify"
    return
  fi

  if [ -n "$dir" ] && [ -x "$dir/gradlew" ]; then
    printf '%s\n' "./gradlew build"
    return
  fi

  printf '\n'
}

backend_dev_cmd() {
  if [ -n "${MEDITATION_BACKEND_DEV_CMD:-}" ]; then
    printf '%s\n' "$MEDITATION_BACKEND_DEV_CMD"
    return
  fi

  default_backend_dev_cmd
}

backend_build_cmd() {
  if [ -n "${MEDITATION_BACKEND_BUILD_CMD:-}" ]; then
    printf '%s\n' "$MEDITATION_BACKEND_BUILD_CMD"
    return
  fi

  default_backend_build_cmd
}

backend_is_configured() {
  if [ -n "$(backend_dev_cmd)" ] || [ -n "$(backend_build_cmd)" ]; then
    return 0
  fi

  return 1
}

run_backend_command() {
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
    cd "$dir"
  else
    printf '%s\n' "Running backend $command_name command from the frontend workspace."
    cd "$ROOT_DIR"
  fi

  exec sh -lc "$command_value"
}

h2_db_dir() {
  printf '%s\n' "$(resolve_path "${MEDITATION_H2_DB_DIR:-local-data/h2}")"
}

h2_db_name() {
  printf '%s\n' "${MEDITATION_H2_DB_NAME:-meditation}"
}
