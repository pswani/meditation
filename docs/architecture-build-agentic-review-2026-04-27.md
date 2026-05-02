# Architecture, Build, and Agentic Usage Review

**Date:** 2026-04-27
**Scope:** Mac deployment architecture, build/deploy scripts, and Codex/Claude Code agentic workflow patterns.

---

## Part 1: Deployment Architecture

### Current Shape

```
Internet / LAN
    │
  [nginx] (Homebrew, port 80/443)
    │  /                → local-data/deploy/frontend (static)
    │  /api/            → 127.0.0.1:8080 (Spring Boot)
    │  /media/          → 127.0.0.1:8080 (Spring Boot)
    │
[Spring Boot JAR] (launchd, loopback-only)
    │
[H2 file DB]  [media filesystem]
```

**Verdict: The topology is sound for its purpose.** Running nginx as the public face with the backend on a loopback bind is the right call. launchd for service management is the correct macOS primitive. This is not a toy setup — it mirrors a real production pattern adapted for macOS.

---

### Issues and Recommendations

#### ARCH-1 — H2 has no backup tooling (Priority: High)

The runbook says "Keep backups of `/opt/meditation/shared/h2`" but nothing automates this. H2 file mode cannot be hot-copied safely (the DB engine holds the files open).

**Recommendation:** Add a `scripts/backup-h2.sh` that:
1. Calls the H2 `SHUTDOWN COMPACT` command over JDBC or temporarily stops the backend via launchctl
2. Copies the `.mv.db` file to a timestamped archive directory
3. Keeps the last N snapshots

Wire it as a launchd calendar job (`StartCalendarInterval`) running nightly. Until then, any disk failure is a full data loss event.

#### ARCH-2 — launchd plist has no restart throttle (Priority: High)

The plist sets `KeepAlive true` with no `ThrottleInterval`. If the backend panics at startup (bad env file, missing jar, port already in use), launchd will restart it in a tight loop and consume significant CPU.

**Fix:** Add `ThrottleInterval` to the plist template in `render-launchd-plist.sh`:

```xml
<key>ThrottleInterval</key>
<integer>15</integer>
```

This makes launchd wait 15 seconds between restart attempts.

#### ARCH-3 — nginx config missing timeouts and security headers (Priority: Medium)

The generated nginx config has no:
- `proxy_read_timeout` / `proxy_connect_timeout` / `proxy_send_timeout` — defaults to 60s, which is fine for API calls but leaves `/media/` audio proxy unbounded for streaming
- `client_max_body_size` — no upload ceiling
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`
- `gzip` for API JSON responses

**Recommendation:** Extend `render-nginx-config.sh` with these blocks:

```nginx
gzip on;
gzip_types application/json text/plain;

add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

location /api/ {
    proxy_read_timeout 30s;
    proxy_connect_timeout 5s;
    proxy_send_timeout 30s;
    proxy_request_buffering off;
    ...
}

location /media/ {
    proxy_read_timeout 120s;    # audio files can take time
    proxy_buffering off;        # stream audio rather than buffer
    ...
}
```

#### ARCH-4 — nginx config hardcodes port 8080 during install (Priority: Medium)

In `prod-macos-setup.sh`, `render_installed_nginx_config` passes `--backend-port 8080` literally:

```sh
--backend-host 127.0.0.1 --backend-port 8080
```

If `MEDITATION_BACKEND_PORT` is set to a non-default value in the env file, the nginx config will still point at 8080, causing a split between the launchd-launched backend and the nginx proxy target.

**Fix:** Change line 249 to use `$(backend_port)`:
```sh
--backend-host 127.0.0.1 --backend-port "$(backend_port)"
```

#### ARCH-5 — Certbot modifies nginx config; next install overwrites it (Priority: Medium)

`certbot --nginx` rewrites the nginx server block with TLS directives. But `render_installed_nginx_config` in the next `install-app` run regenerates the file from scratch, dropping the TLS listen and certificate path that certbot added.

**Recommendation:** Two options:
- (A) Add a flag `--skip-nginx-render` that skips rewriting the config when TLS is already active
- (B) Teach `render-nginx-config.sh` to accept a `--ssl-cert` and `--ssl-key` path so the rendered config is TLS-ready from the start, and certbot is only used for initial certificate acquisition

Option B is cleaner. At minimum, document in the runbook that a post-install certbot run will be needed after every `install-app`.

#### ARCH-6 — No JVM tuning flags for the production backend (Priority: Medium)

`prod-backend-run.sh` launches the JAR with:
```sh
exec "$java_command" -jar "$backend_jar" --server.address=... --server.port=...
```

No heap size, GC configuration, or startup flags. On a Mac Mini with shared RAM, an unbounded heap can cause the system to swap. Spring Boot with H2 is lightweight, but explicit limits protect the host.

**Recommendation:** Add default JVM flags and make them overridable:

```sh
jvm_opts=${MEDITATION_JVM_OPTS:--Xms64m -Xmx256m -XX:+UseG1GC -XX:MaxGCPauseMillis=200}
exec "$java_command" $jvm_opts -jar "$backend_jar" ...
```

Document `MEDITATION_JVM_OPTS` in `.env.example`.

#### ARCH-7 — No log rotation for the backend log (Priority: Medium)

Both stdout and stderr go to `/opt/meditation/runtime-production/logs/backend-production.log`. Spring Boot logs verbosely at startup and for every request. Without rotation, this file will grow unbounded.

**Recommendation:** Add a `newsyslog` config file (macOS's log rotation tool) at `/etc/newsyslog.d/meditation.conf`:

```
/opt/meditation/runtime-production/logs/backend-production.log 644 7 10240 * J
```

This rotates when the log hits 10 MB and keeps 7 archives. Alternatively, configure Spring Boot's rolling file appender via `application.properties`.

#### ARCH-8 — Two overlapping production start mechanisms (Priority: Low)

There are two ways to run the production backend:
1. `launchd` via `prod-macos-control.sh` — the documented production path
2. `prod-backend-start.sh` — writes a pid file under `local-data/`, a local-dev pattern

This creates confusion: what happens if someone runs `prod-backend-start.sh` while launchd is also running the backend? Port conflict, silent PID file clobber.

**Recommendation:** Rename `prod-backend-start.sh` / `prod-backend-stop.sh` / `prod-backend-status.sh` to `dev-backend-start.sh` etc., or add a guard that checks if the launchd service is active before allowing the legacy scripts to proceed.

---

## Part 2: Build Scripts Review

### Overall Assessment

The script suite is well above average for a solo/small-team project. POSIX-compatible `sh` throughout (with `set -eu`), a unified pipeline entry point, dry-run support, smoke testing, and a repo hygiene gate are all strong practices.

---

### Issues and Recommendations

#### BUILD-1 — `run_step` uses `sh -lc` which is unsafe for paths with spaces and leaks login env (Priority: High)

Both `prod-macos-setup.sh` and `prod-macos-control.sh` use this pattern:

```sh
run_step() {
  ...
  sh -lc "$command_text"
}
```

This has two problems:

1. **Quoting/injection:** `command_text` is a single string containing the full command. Any path with a space breaks it silently, and special characters can cause unintended parsing.
2. **Login shell overhead:** `-l` sources `/etc/profile`, `.bash_profile`, etc. on every step. This is slow, can pick up unexpected env changes, and is inconsistent with the current shell's state.

**Recommendation:** Change to direct `eval` with proper quoting, or better — refactor `run_step` to accept the command as multiple arguments:

```sh
run_step() {
  description=$1; shift
  printf '%s\n' "$description"
  if [ "$dry_run" -eq 1 ]; then
    printf '  [dry-run] %s\n' "$*"
    return 0
  fi
  "$@"
}
```

Then call it as: `run_step "Installing frontend bundle" sudo rm -rf "$prod_frontend_dir"`. This eliminates the string-eval and sh-lc overhead.

#### BUILD-2 — Shared functions duplicated across scripts (Priority: High)

These functions appear in both `prod-macos-setup.sh` and `prod-macos-control.sh`:
- `require_macos`
- `ensure_brew_on_path`
- `brew_prefix`
- `run_step`
- `prod_app_root`
- `prod_runtime_dir`
- `prod_launchd_label`
- `prod_launchd_plist_path`
- `prod_nginx_site_path`

If one is updated, the other is silently stale. Move all of these into `common.sh`. The current `common.sh` already has the right structure for this — just extend it.

#### BUILD-3 — CI does not cache Maven dependencies (Priority: High)

`ci.yml` caches npm but not Maven:

```yaml
- uses: actions/setup-node@v4
  with:
    cache: npm          # ✓ cached
- uses: actions/setup-java@v4
  with:
    distribution: temurin
    java-version: '21'  # ✗ no cache key
```

Every CI run downloads all backend Maven dependencies from scratch. For a Spring Boot project this is 50-100+ artifacts.

**Fix:**

```yaml
- uses: actions/setup-java@v4
  with:
    distribution: temurin
    java-version: '21'
    cache: maven
```

`setup-java@v4` natively supports `cache: maven`. This alone can cut backend CI time by 60-80%.

#### BUILD-4 — No rollback on failed deploy (Priority: Medium)

`install_bundle_files` does:
```sh
sudo rm -rf "$prod_frontend_dir"
sudo mkdir -p "$prod_frontend_dir"
sudo cp -R "$bundle_frontend_dir"/. "$prod_frontend_dir"/
```

If the `cp` fails midway (disk full, permissions), the frontend is gone and the backend jar may already be overwritten. There's no way to recover without re-running a full build.

**Recommendation:** Use an atomic swap pattern:
```sh
# Copy to a new dir, then atomically rename
sudo cp -R "$bundle_frontend_dir" "${prod_frontend_dir}.new"
sudo mv "${prod_frontend_dir}" "${prod_frontend_dir}.old"
sudo mv "${prod_frontend_dir}.new" "$prod_frontend_dir"
sudo rm -rf "${prod_frontend_dir}.old"
```

For the backend jar, copy to a `.new` path then `mv`. Also keep the previous jar at `meditation-backend.jar.prev` so a one-step rollback is possible.

#### BUILD-5 — `prod-build.sh` runs `npm run build` without verifying Node version (Priority: Medium)

`prod-build.sh` calls `npm run build` but doesn't check that the active Node version satisfies the `engines.node: "20.x"` requirement in `package.json`. A mismatch silently uses the wrong Node and may produce subtly broken builds.

**Fix:** Add to `prod-build.sh`:
```sh
required_major=20
node_major=$(node -e 'process.stdout.write(String(process.versions.node.split(".")[0]))')
if [ "$node_major" != "$required_major" ]; then
  printf '%s\n' "Node $required_major.x required, found $(node --version)."
  exit 1
fi
```

#### BUILD-6 — `check-repo-hygiene.sh` does not flag ExecPlan and session prompt artifacts (Priority: Medium)

The hygiene checker rejects `dist/*`, `build/*`, etc. but it does not flag:
- Root-level `EXECPLAN-*.md` files
- `a.txt` (present at root — appears to be a scratch file)
- `work-queue.txt`
- `.claude-work-state`

These are operator working files that accumulate at the root and should either be cleaned before merging or added to the hygiene reject list.

**Recommendation:** Add to `matches_rejected_path`:
```sh
EXECPLAN-*.md|work-queue.txt|.claude-work-state|a.txt)
  return 0
  ;;
```

Or move these to `.gitignore`.

#### BUILD-7 — nginx config `/media/` proxy is unrestricted at the nginx layer (Priority: Low)

The nginx config proxies all of `/media/` to the backend. The backend validates `custom-plays/` and `sounds/` subdirs, but nginx doesn't restrict the path prefix at its level. If the backend ever adds a `/media/internal/` path that should not be public, nginx will expose it.

**Recommendation:** Change the catch-all `/media/` location to explicit allowed prefixes:

```nginx
location /media/custom-plays/ { proxy_pass ...; }
location /media/sounds/ { proxy_pass ...; }
```

#### BUILD-8 — `pipeline.sh verify` runs `npm run build` before the smoke check but not between CI steps (Priority: Low)

`run_verify` calls:
```sh
npm run typecheck && npm run lint && npm run test
npm run generate:sync-contract
# stale-check
npm run build
# backend build + smoke
```

The frontend build happens after tests, which is correct. But the sync-contract stale check happens before the build, meaning `src/generated/syncContract.ts` is checked from the current working tree, not from the freshly-generated version. A stale-but-present file would pass the git diff check even if regeneration would produce a different file.

**Fix:** Move `npm run generate:sync-contract` + the stale git diff check to run *before* `npm run build` but also *after* a fresh generation, and add `--quiet` to `git diff` to keep the output clean in CI.

---

## Part 3: Agentic Usage Review

### Current Shape

The project uses two AI coding tools:
- **Codex CLI** (`codex exec`) for structured batch work — the Pile → Group → Bundle staged workflow in `prompts/` and `scripts/codex/`
- **Claude Code** (the current tool) for interactive session work and direct fixes

The staged workflow design in `docs/codex-staged-workflow-design.md` is one of the more thoughtful AI-assisted delivery systems I've seen in a solo project. The decomposition model, reasoning profiles, and cleanup discipline are genuine best practices.

---

### Issues and Recommendations

#### AGENT-1 — Context re-reading overhead on every bundle is significant (Priority: High)

Every bundle prompt (`run-milestone-workflow.md`) instructs the agent to read 8-10 documents before starting:

```
AGENTS.md, PLANS.md, README.md, docs/codex-staged-workflow-design.md,
prompts/reasoning-effort-profiles.md, requirements/decisions.md,
requirements/session-handoff.md, docs/architecture.md, docs/ux-spec.md ...
```

For a 20-bundle pile, this is 160–200 document reads before any real work begins. At typical token prices this adds up, and more importantly it pulls the agent's context window toward boilerplate.

**Recommendation:** Create a `CONTEXT.md` or `SESSION_START.md` at the repo root (or reference it from AGENTS.md) that is a single dense summary of:
- Current repo state (not a dump, but pointers to what matters *now*)
- Which pile is active
- The single most important constraint to respect

Keep it under 200 lines. Update it after each group closes out. Bundles should read AGENTS.md + this file + their group plan, and only reach into other docs when the task is directly relevant to them. This alone could cut per-bundle cold-start overhead by 50%.

#### AGENT-2 — No parallelism for independent bundles within a group (Priority: High)

The workflow design defaults to one thread per group. But several groups mix completely independent concerns — for example, the backend rate limiting bundle (B-H5) and the frontend error handling bundle have no shared state. Running them sequentially wastes time when the context is not actually shared.

**Recommendation:** Extend the group README format to declare which bundles can be run in parallel:

```markdown
## Thread strategy
- Bundles 1 and 2: run in parallel (no shared files)
- Bundle 3: runs after bundle 1 (depends on output)
```

Then use `scripts/codex/run-bundle.sh` with `--print` to generate the two `codex exec` commands and run them in separate terminals. The group review step waits for both branches to merge before running.

This is specifically high-value for web vs. iOS bundles — they never share files and can always be parallelized.

#### AGENT-3 — Session prompts (session-a through session-p) bypass the pile structure (Priority: Medium)

There are 16 session prompt files directly in `prompts/` that don't follow the pile → group → bundle hierarchy. They were written as direct Codex session instructions and are more detailed and actionable than the generic pile template. But they sit outside the cleanup discipline (they stay in the repo on main, there's no associated integration branch or closeout step).

**Recommendation:** Decide on one authoritative prompt format. The session prompts are excellent — specific file paths, exact change descriptions, verification steps. The pile/group/bundle structure adds governance on top.

The best path: keep the session prompts as the *bundle-level implementation prompt* (the `01-implement-*.md` equivalent) and wrap a thin group structure around them. Then the cleanup and merge discipline applies naturally.

#### AGENT-4 — Codex CLI may be the wrong tool for this stack now (Priority: Medium)

The `scripts/codex/` helpers call `codex exec` which is the OpenAI Codex CLI. This project also has a `.claude/` directory and is actively using Claude Code. These are different products with different models, context windows, and tool sets.

The Codex CLI (`codex exec`) uses a sandboxed execution environment with limited filesystem access. Claude Code's `claude` CLI can use all tools — read, write, bash, web fetch — and has a larger context window with better long-context performance on large codebases.

**Recommendation:** Migrate `scripts/codex/` to a `scripts/claude/` equivalent that calls Claude Code's non-interactive exec mode. The prompt format stays the same; only the runner changes. This gives you:
- Better code understanding on large files
- Native tool use (grep, read, write) without sandboxing workarounds
- Consistent model (no context switching between Claude for interactive work and Codex for batch work)

Until migration, document clearly which tool each script targets so future contributors don't run Codex prompts in Claude Code or vice versa.

#### AGENT-5 — No structured output or failure capture from agent runs (Priority: Medium)

`run_or_print_codex_exec` runs the agent and exits. There is no:
- Capture of exit code
- Log of what the agent did (commit hash, files changed)
- Report written to a file for human review before merge
- Slack/notification hook for long-running group executions

When an agent fails mid-group, the operator must manually inspect git log and the terminal buffer to understand what happened.

**Recommendation:** Wrap `codex exec` (or `claude`) with a thin harness:

```sh
run_agent() {
  log_file="local-data/agent-runs/$(date +%Y%m%d-%H%M%S)-${group_name}.log"
  mkdir -p "$(dirname "$log_file")"
  "$@" 2>&1 | tee "$log_file"
  exit_code=${PIPESTATUS[0]}
  echo "Exit code: $exit_code" >> "$log_file"
  echo "Git state after run:" >> "$log_file"
  git log --oneline -5 >> "$log_file"
  return $exit_code
}
```

Keep these logs under `local-data/agent-runs/` (already in `.gitignore`) so you can review what happened without polluting the repo.

#### AGENT-6 — ExecPlans accumulate at the repo root (Priority: Medium)

`EXECPLAN-ios-native-bell-reliability.md` and `EXECPLAN-ux-review-followup.md` are at the repo root. AGENTS.md says to fold durable outcomes into docs and remove obsolete ExecPlans. These appear to be completed or partially completed plans that were not cleaned up.

**Recommendation:** Move completed ExecPlans to `local-data/execplans/` (gitignored) or delete them. If content is still valuable, extract the decision log into `requirements/decisions.md` and remove the file.

#### AGENT-7 — AGENTS.md context documents are good but could be smarter about loading order (Priority: Low)

AGENTS.md instructs agents to read many docs unconditionally. For a backend-only task like schema migration, reading `docs/ux-spec.md` and `docs/screen-inventory.md` is irrelevant but still costs tokens.

**Recommendation:** Restructure AGENTS.md with conditional loading:

```markdown
## Always read first (all tasks)
- README.md (§ Overview)
- requirements/session-handoff.md
- requirements/decisions.md

## Read for backend tasks
- docs/architecture.md (§ Current backend module structure, § Media storage conventions)
- backend/src/main/resources/application.properties

## Read for frontend tasks
- docs/ux-spec.md
- docs/screen-inventory.md
- docs/architecture.md (§ Front-end architecture, § Offline-first foundations)

## Read for iOS tasks
- docs/ios-native/README.md
- docs/ios-native/parity-review-2026-04-10.md
```

This gives agents a clear scope-based reading list rather than a flat unconditional list.

#### AGENT-8 — Reasoning effort profiles are defined but the escalation rule is only documented, not enforced (Priority: Low)

The escalation rule "low verification → if fails → high diagnosis → rerun low" is correct but relies on the operator or agent to follow it. In practice, when a verification step fails, the operator often just reruns at the same effort level or abandons.

**Recommendation:** Add a `scripts/codex/verify-with-escalation.sh` that:
1. Runs the verification command at low effort
2. On failure, automatically escalates to a diagnosis run at high effort with a context-rich prompt
3. Re-runs verification at low effort after the diagnosis run

This makes the escalation rule automatic rather than aspirational.

---

## Summary Table

| ID | Area | Priority | One-line Description |
|----|------|----------|----------------------|
| ARCH-1 | Deployment | High | Add automated H2 backup with launchd calendar job |
| ARCH-2 | Deployment | High | Add `ThrottleInterval` to launchd plist to prevent restart storm |
| ARCH-3 | Deployment | Medium | Add nginx timeouts, security headers, and gzip to generated config |
| ARCH-4 | Deployment | Medium | Fix hardcoded port 8080 in `render_installed_nginx_config` |
| ARCH-5 | Deployment | Medium | Handle Certbot config preservation across `install-app` reruns |
| ARCH-6 | Deployment | Medium | Add JVM heap/GC flags and make them overridable via env |
| ARCH-7 | Deployment | Medium | Add log rotation for backend production log |
| ARCH-8 | Deployment | Low | Rename legacy backend start scripts to clarify dev vs prod intent |
| BUILD-1 | Scripts | High | Replace `sh -lc` in `run_step` with direct arg-array invocation |
| BUILD-2 | Scripts | High | Deduplicate shared functions into `common.sh` |
| BUILD-3 | Scripts | High | Add `cache: maven` to CI `setup-java` step |
| BUILD-4 | Scripts | Medium | Add atomic swap deploy to prevent partial-install failures |
| BUILD-5 | Scripts | Medium | Verify Node version in `prod-build.sh` before building |
| BUILD-6 | Scripts | Medium | Flag ExecPlan artifacts and scratch files in repo hygiene checker |
| BUILD-7 | Scripts | Low | Restrict nginx `/media/` proxy to explicit allowed subpaths |
| BUILD-8 | Scripts | Low | Reorder sync-contract generation step in `pipeline.sh verify` |
| AGENT-1 | Agentic | High | Create compact session-context file to reduce cold-start overhead |
| AGENT-2 | Agentic | High | Add parallelism declarations to group README for independent bundles |
| AGENT-3 | Agentic | Medium | Align session prompts with pile/group/bundle structure for cleanup discipline |
| AGENT-4 | Agentic | Medium | Migrate `scripts/codex/` to Claude Code runner |
| AGENT-5 | Agentic | Medium | Add structured output capture and failure logging for agent runs |
| AGENT-6 | Agentic | Medium | Clean up stale ExecPlan files at repo root |
| AGENT-7 | Agentic | Low | Restructure AGENTS.md with scope-conditional reading lists |
| AGENT-8 | Agentic | Low | Automate the verification escalation rule in a helper script |
