# Mac Mini Production Runbook

This runbook is for a production-style deployment on a Mac Mini.

It does not use:
- `vite`
- `vite preview`
- `npm run dev:*`
- `npm run preview:*`

The runtime shape is:
- Homebrew-managed `nginx`
- a static frontend served by `nginx`
- a Spring Boot backend jar bound to `127.0.0.1`
- `launchd` managing the backend service
- filesystem-backed H2 and media storage

## Prerequisites
- macOS admin account with `sudo`
- a public DNS record already pointed at the Mac Mini if you want HTTPS
- ports `80` and `443` reachable from the internet if you want Certbot `--nginx`
- Xcode Command Line Tools installed

## Step 1: Prepare the host

Dry run:

```bash
./scripts/prod-macos-setup.sh prepare-host --dry-run
```

Real run:

```bash
./scripts/prod-macos-setup.sh prepare-host
```

What this does:
- checks for Xcode Command Line Tools
- installs Homebrew if missing
- installs:
  - `nginx`
  - `certbot`
  - `openjdk@21`
- creates the default production directory layout under `/opt/meditation`

## Step 2: Build the production bundle

Build the bundle locally in this repo:

```bash
./scripts/package-deploy.sh
```

This produces:

```text
local-data/deploy/
  frontend/
  backend/meditation-backend.jar
  backend/meditation-backend.env.example
  nginx/meditation.conf
```

## Step 3: Install the app

Dry run:

```bash
./scripts/prod-macos-setup.sh install-app --dry-run --skip-build --bundle-dir local-data/deploy
```

Real run for LAN-only HTTP use:

```bash
./scripts/prod-macos-setup.sh install-app --bundle-dir local-data/deploy
```

Real run with TLS:

```bash
./scripts/prod-macos-setup.sh install-app \
  --bundle-dir local-data/deploy \
  --domain meditation.example.com \
  --email ops@example.com
```

What this does:
- copies the production frontend files into `/opt/meditation/app/frontend`
- copies the backend jar into `/opt/meditation/app/backend`
- installs backend support scripts into `/opt/meditation/bin`
- creates `/opt/meditation/shared/meditation.env` if it does not already exist
- renders the installed nginx site config into Homebrew nginx’s `servers/` directory
- installs `/Library/LaunchDaemons/com.meditation.backend.plist`
- starts or restarts the backend through `launchd`
- starts or restarts `nginx`
- if `--domain` and `--email` are provided, runs `certbot --nginx`

If you do not have a public domain:
- omit `--domain`
- omit `--email`
- use the app over plain HTTP on your LAN
- open `http://<Mac-Mini-LAN-IP>/` or `http://<Mac-Local-Hostname>.local/`

## Installed layout

Default layout:

```text
/opt/meditation/
  app/
    frontend/
    backend/meditation-backend.jar
  bin/
    common.sh
    prod-backend-run.sh
  shared/
    meditation.env
    h2/
    media/
  runtime-production/
    logs/
```

## Service management

Backend service:
- label: `com.meditation.backend`
- plist: `/Library/LaunchDaemons/com.meditation.backend.plist`

Common commands:

```bash
sudo launchctl print system/com.meditation.backend
curl -s http://127.0.0.1:8080/api/health
tail -n 40 /opt/meditation/runtime-production/logs/backend-production.log
sudo brew services list | grep nginx
```

## Updates

For an update:

1. Pull the latest repo changes.
2. Rebuild the deploy bundle with `./scripts/package-deploy.sh`.
3. Re-run:

```bash
./scripts/prod-macos-setup.sh install-app --bundle-dir local-data/deploy --domain meditation.example.com --email ops@example.com
```

This re-installs the frontend/backend files, refreshes the nginx config, and restarts the managed services.

## Notes

- The production host should only serve the built frontend files from `nginx`.
- The production host should not run `vite` or `vite preview`.
- If your ISP or firewall blocks inbound port `80`, Certbot’s nginx flow may fail. In that case, keep the HTTP install and switch to DNS validation manually.
- The backend still uses H2 in this repo’s early production shape. Keep backups of `/opt/meditation/shared/h2` and the media directory.
