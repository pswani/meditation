#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

print_usage() {
  printf '%s\n' "Usage: ./scripts/package-deploy.sh [--skip-build] [--bundle-dir PATH]"
}

skip_build=0
bundle_dir=""

while [ "$#" -gt 0 ]; do
  case "$1" in
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

if [ -n "$bundle_dir" ]; then
  MEDITATION_DEPLOY_DIR=$bundle_dir
fi

if [ "$skip_build" -eq 0 ]; then
  "$SCRIPT_DIR/prod-build.sh"
fi

frontend_dist_dir=$(resolve_path "dist")
deploy_root=$(deploy_dir)
frontend_output_dir=$(deploy_frontend_dir)
backend_output_dir=$(deploy_backend_dir)
nginx_output_dir=$(deploy_nginx_dir)
nginx_output_path=$(deploy_nginx_config_path)
backend_output_jar=$(deploy_backend_jar_path)
backend_env_example=$(deploy_backend_env_example_path)
backend_jar=$(backend_jar_path)

if [ "$backend_jar" = "$backend_output_jar" ]; then
  target_dir=$(backend_target_dir)
  if [ -n "$target_dir" ] && [ -d "$target_dir" ]; then
    backend_jar=$(find "$target_dir" -maxdepth 1 -type f -name '*.jar' ! -name '*.original' | sort | tail -n 1)
  fi
fi

if [ ! -d "$frontend_dist_dir" ]; then
  printf '%s\n' "Frontend dist directory not found at $frontend_dist_dir"
  printf '%s\n' "Run ./scripts/prod-build.sh first or omit --skip-build."
  exit 1
fi

if [ -z "$backend_jar" ] || [ ! -f "$backend_jar" ]; then
  printf '%s\n' "Backend jar not found."
  printf '%s\n' "Run ./scripts/prod-build.sh first or set MEDITATION_BACKEND_JAR_PATH."
  exit 1
fi

rm -rf "$frontend_output_dir" "$backend_output_dir" "$nginx_output_dir"
mkdir -p "$frontend_output_dir" "$backend_output_dir" "$nginx_output_dir"

cp -R "$frontend_dist_dir"/. "$frontend_output_dir"/
cp "$backend_jar" "$backend_output_jar"

"$SCRIPT_DIR/render-nginx-config.sh" --output "$nginx_output_path"

cat > "$backend_env_example" <<EOF
# Copy this file to a secure runtime env file on the server and adjust values as needed.
MEDITATION_BACKEND_PORT=$(backend_port)
MEDITATION_BACKEND_BIND_HOST=$(backend_bind_host)
MEDITATION_H2_DB_DIR=/var/lib/meditation/h2
MEDITATION_H2_DB_NAME=$(h2_db_name)
MEDITATION_MEDIA_STORAGE_ROOT=/var/lib/meditation/media
EOF

printf '%s\n' "Deployment bundle prepared under $deploy_root"
printf '%s\n' "Frontend static files: $frontend_output_dir"
printf '%s\n' "Backend jar: $backend_output_jar"
printf '%s\n' "nginx config: $nginx_output_path"
printf '%s\n' "Backend env example: $backend_env_example"
