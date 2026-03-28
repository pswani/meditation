#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

print_usage() {
  printf '%s\n' "Usage: ./scripts/render-nginx-config.sh [--output PATH]"
}

output_path=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --output)
      shift
      if [ "$#" -eq 0 ]; then
        print_usage
        exit 1
      fi
      output_path=$1
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

frontend_root=$(deploy_frontend_dir)
backend_origin="http://$(backend_bind_host):$(backend_port)"
server_name=$(nginx_server_name)
listen_port=$(nginx_listen_port)

config_text=$(cat <<EOF
server {
    listen ${listen_port};
    server_name ${server_name};

    root ${frontend_root};
    index index.html;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass ${backend_origin};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /media/ {
        proxy_pass ${backend_origin};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
)

if [ -n "$output_path" ]; then
  resolved_output=$(resolve_path "$output_path")
  mkdir -p "$(dirname "$resolved_output")"
  printf '%s\n' "$config_text" > "$resolved_output"
  printf '%s\n' "Wrote nginx config to $resolved_output"
  exit 0
fi

printf '%s\n' "$config_text"
