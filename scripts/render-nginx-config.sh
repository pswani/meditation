#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

print_usage() {
  printf '%s\n' "Usage: ./scripts/render-nginx-config.sh [--output PATH] [--frontend-root PATH] [--backend-host HOST] [--backend-port PORT] [--server-name NAME] [--listen-port PORT]"
}

output_path=""
frontend_root_override=""
backend_host_override=""
backend_port_override=""
server_name_override=""
listen_port_override=""

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
    --frontend-root)
      shift
      if [ "$#" -eq 0 ]; then
        print_usage
        exit 1
      fi
      frontend_root_override=$1
      ;;
    --backend-host)
      shift
      if [ "$#" -eq 0 ]; then
        print_usage
        exit 1
      fi
      backend_host_override=$1
      ;;
    --backend-port)
      shift
      if [ "$#" -eq 0 ]; then
        print_usage
        exit 1
      fi
      backend_port_override=$1
      ;;
    --server-name)
      shift
      if [ "$#" -eq 0 ]; then
        print_usage
        exit 1
      fi
      server_name_override=$1
      ;;
    --listen-port)
      shift
      if [ "$#" -eq 0 ]; then
        print_usage
        exit 1
      fi
      listen_port_override=$1
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

if [ -n "$frontend_root_override" ]; then
  frontend_root=$(resolve_path "$frontend_root_override")
else
  frontend_root=$(deploy_frontend_dir)
fi

if [ -n "$backend_host_override" ]; then
  backend_host=$backend_host_override
else
  backend_host=$(backend_bind_host)
fi

if [ -n "$backend_port_override" ]; then
  backend_port_value=$backend_port_override
else
  backend_port_value=$(backend_port)
fi

backend_origin="http://${backend_host}:${backend_port_value}"

if [ -n "$server_name_override" ]; then
  server_name=$server_name_override
else
  server_name=$(nginx_server_name)
fi

if [ -n "$listen_port_override" ]; then
  listen_port=$listen_port_override
else
  listen_port=$(nginx_listen_port)
fi

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
