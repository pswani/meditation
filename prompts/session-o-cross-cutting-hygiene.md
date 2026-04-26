# Session O — Cross-Cutting: Repo Hygiene & Operational Fixes

## Context

Meditation app — full-stack repo at the working root.
Working branch: `review-fixes`. This session addresses operational posture and repo hygiene findings from `CODE-REVIEW-2026-04-24.md`.

**Issues addressed (10 total):**
- X-H2: H2 has no backup story — add `scripts/backup-db.sh`
- X-H3: Single-machine Mac mini architecture not explicitly documented in PLANS.md
- X-H4: Confirm `server.address=127.0.0.1` is set (already verified — document it)
- X-M1: `a.txt` (55 KB) committed at root — remove and gitignore
- X-M5: Stale EXECPLAN files at root — archive to `docs/`
- X-L1: `.agents`, `.codex` directories at top level — add content patterns to `.gitignore`
- X-L2: `.editorconfig` lacks YAML section
- X-L5: No CODEOWNERS or PR template in `.github/`
- X-L7: No deployment verification (smoke test) in `scripts/prod-release.sh`
- X-L8: `.env.example` needs an explicit note that it contains no real secrets

**Already fixed — do NOT re-implement:**
- X-H4: `server.address: 127.0.0.1` confirmed in `backend/src/main/resources/application.yml`
- X-M7: Maven wrapper addressed in Session E
- X-M8: `docs/web-offline-policy.md` addressed in Session J

---

## X-M1: Remove `a.txt` and gitignore it

**Problem:** `a.txt` (55,434 bytes) is a stale build log committed at the repo root. It is not in `.gitignore`.

**Files to read first:**
- `.gitignore` — find the right section to add the entry

**Changes:**

1. Remove the file from git tracking:
   ```bash
   git rm a.txt
   ```

2. Add to `.gitignore` (near the top, with other root-level artifacts):
   ```
   # Stale build/scratch files
   a.txt
   ```

---

## X-M5: Archive EXECPLAN files to `docs/`

**Problem:** `EXECPLAN-ios-native-bell-reliability.md` and `EXECPLAN-ux-review-followup.md` sit at the repo root. They are in-progress planning docs that should live in `docs/` to reduce root noise.

**Changes:**

1. Move both files:
   ```bash
   git mv EXECPLAN-ios-native-bell-reliability.md docs/EXECPLAN-ios-native-bell-reliability.md
   git mv EXECPLAN-ux-review-followup.md docs/EXECPLAN-ux-review-followup.md
   ```

2. Update any cross-references in other docs that link to these files (grep for `EXECPLAN` in all `.md` files to find them):
   ```bash
   grep -rn "EXECPLAN" . --include="*.md"
   ```
   Fix any relative paths that break after the move.

---

## X-H2: Add H2 database backup script

**Problem:** `docs/mac-mini-production-runbook.md` describes the Mac mini setup but has no backup/restore procedure for the H2 database file. A disk failure would be unrecoverable.

**Files to read first:**
- `docs/mac-mini-production-runbook.md` — understand the existing runbook structure and H2 file location (`/opt/meditation/data/`)
- `scripts/prod-backend-stop.sh` and `scripts/prod-backend-start.sh` — understand how the backend is stopped/started (needed for a consistent snapshot)
- `backend/src/main/resources/application.yml` — find the `spring.datasource.url` to identify the H2 file path

**Changes:**

1. Create `scripts/backup-db.sh`:
   ```sh
   #!/bin/sh
   # Consistent H2 backup: quiesce writes, copy the DB files, restart.
   # Usage: ./scripts/backup-db.sh [--dest /path/to/backup/dir]
   set -eu

   SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
   DEST="${1:-/opt/meditation/backups}"
   H2_DATA_DIR="/opt/meditation/data"
   TIMESTAMP=$(date +%Y%m%d-%H%M%S)
   BACKUP_DIR="${DEST}/db-${TIMESTAMP}"

   mkdir -p "${BACKUP_DIR}"

   printf '%s\n' "Stopping backend for consistent snapshot..."
   "${SCRIPT_DIR}/prod-backend-stop.sh"

   printf '%s\n' "Copying H2 files to ${BACKUP_DIR}..."
   cp "${H2_DATA_DIR}"/*.mv.db "${BACKUP_DIR}/" 2>/dev/null || true
   cp "${H2_DATA_DIR}"/*.trace.db "${BACKUP_DIR}/" 2>/dev/null || true

   printf '%s\n' "Restarting backend..."
   "${SCRIPT_DIR}/prod-backend-start.sh"

   printf '%s\n' "Backup complete: ${BACKUP_DIR}"
   ls -lh "${BACKUP_DIR}"
   ```

2. Make it executable:
   ```bash
   chmod +x scripts/backup-db.sh
   ```

3. In `docs/mac-mini-production-runbook.md`, add a "Database Backup" section after the startup steps:
   ```markdown
   ## Database Backup

   H2 data lives in `/opt/meditation/data/`. Run a consistent snapshot backup:

   ```bash
   ./scripts/backup-db.sh
   # Default destination: /opt/meditation/backups/db-YYYYMMDD-HHMMSS/
   # Custom destination:
   ./scripts/backup-db.sh /Volumes/ExternalDrive/meditation-backups
   ```

   **Recommended:** schedule this daily via launchd or cron. The script stops the
   backend briefly for a consistent copy, then restarts it.

   **Restore:** stop the backend, replace the `.mv.db` file(s) with the backup copy,
   restart.
   ```

---

## X-H3: Document Mac mini limitations and migration path in PLANS.md

**Problem:** The single-machine architecture is acknowledged in the runbook but no document explicitly labels the risks or describes the migration path to a real VPS + Postgres setup.

**Files to read first:**
- `PLANS.md` — understand existing structure

**Changes:**

In `PLANS.md`, add a section (or top-level entry):
```markdown
## Mac mini → Cloud Migration

**Current state:** Single Mac mini running nginx + Spring Boot + H2. Acceptable for single-user home use.

**Known limitations:**
- No redundancy: one hardware failure = full outage + data loss (mitigated by `scripts/backup-db.sh`)
- H2 is not suitable for multi-user or high-write workloads
- Depends on residential internet uptime and dynamic IP (mitigated by DNS)

**Migration path when needed:**
1. Provision a VPS (e.g., Hetzner CX21 or DigitalOcean Droplet)
2. Switch backend datasource to PostgreSQL (env vars in `application-prod.yml` already prepared)
3. Migrate H2 → Postgres via Flyway baseline
4. Move media storage to an object store (S3 or Backblaze B2)
5. Update nginx config (`scripts/render-nginx-config.sh`) for new host
6. Wire CI/CD deploy step (SSH + bundle install)

This is a significant project (~2 weeks) and is not planned for the near term.
```

---

## X-H4: Document that `server.address=127.0.0.1` is confirmed

**Problem:** The review flagged this as needing confirmation. It is already set.

**Files to read first:**
- `backend/src/main/resources/application.yml` — confirm `server.address: 127.0.0.1` is present

**Changes:**

In `docs/architecture.md`, in the "Recommended production topology" section (or "Current runtime architecture"), add a bullet:
```markdown
- backend binds to `127.0.0.1:8080` (confirmed via `server.address` in `application.yml`) — nginx reverse-proxies all external traffic
```

This makes the security invariant explicit and survives future config changes being noticed in review.

---

## X-L1: Add `.agents` and `.codex` content to `.gitignore`

**Problem:** `.agents` and `.codex` directories are tool scaffolding at the root. Their generated content (session files, caches) should not be tracked.

**Files to read first:**
- `.gitignore` — find a suitable section

**Changes:**

Add to `.gitignore`:
```
# AI tool scaffolding — content is machine-generated and local
.agents/
.codex/
```

Note: `prompts/` contains hand-authored session plans and SHOULD remain tracked. Do not gitignore it.

---

## X-L2: Add YAML section to `.editorconfig`

**Problem:** `.editorconfig` has rules for `*`, `*.md`, `*.{java,swift}`, and `Makefile`, but no YAML-specific section. YAML is indent-sensitive — two spaces is the standard.

**Files to read first:**
- `.editorconfig` — verify current content

**Changes:**

Add after the `[Makefile]` block:
```ini
[*.{yml,yaml}]
indent_size = 2
```

The global `[*]` already sets `indent_style = space` and `indent_size = 2`, but making it explicit for YAML avoids ambiguity and signals intent.

---

## X-L5: Add CODEOWNERS and PR template

**Problem:** `.github/` has only `workflows/`. No `CODEOWNERS` file or pull request template exists.

**Changes:**

1. Create `.github/CODEOWNERS`:
   ```
   # Default owner for all files
   * @prashantwani
   ```
   Adjust as needed if collaborators are added.

2. Create `.github/PULL_REQUEST_TEMPLATE.md`:
   ```markdown
   ## What changed

   <!-- 1-3 bullet points describing the change -->

   ## Why

   <!-- Motivation: bug fix, issue reference, or feature need -->

   ## Test plan

   - [ ] `npm test` passes
   - [ ] `swift test` passes (if iOS changes)
   - [ ] Manual test on simulator / browser
   - [ ] No regressions in adjacent features

   ## Checklist

   - [ ] No `a.txt`, build artifacts, or secrets committed
   - [ ] Generated files regenerated (`npm run generate:sync-contract`)
   - [ ] Commit message follows project convention
   ```

---

## X-L7: Add smoke test to `scripts/prod-release.sh`

**Problem:** `prod-release.sh` packages and installs the bundle but never verifies the backend started successfully. A bad deploy goes undetected until the user notices.

**Files to read first:**
- `scripts/prod-release.sh` — read the full script to find where the backend is started and where to insert the health check
- `scripts/prod-backend-start.sh` — understand start timing

**Changes:**

After the backend start step in `prod-release.sh`, add a smoke test:
```sh
# Smoke test: wait for the backend to become healthy (up to 30 seconds)
printf '%s\n' "Waiting for backend to start..."
HEALTH_URL="http://127.0.0.1:8080/actuator/health"
MAX_ATTEMPTS=15
attempt=0
until curl --silent --fail --max-time 2 "${HEALTH_URL}" >/dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ "${attempt}" -ge "${MAX_ATTEMPTS}" ]; then
        printf '%s\n' "ERROR: Backend did not become healthy after ${MAX_ATTEMPTS} attempts."
        printf '%s\n' "Check logs: ./scripts/prod-backend-logs.sh"
        exit 1
    fi
    sleep 2
done
printf '%s\n' "Backend is healthy. Deploy complete."
```

Read the full `prod-release.sh` to find the exact insertion point (after `prod-backend-start.sh` is called). Do not insert it in the `--dry-run` path.

---

## X-L8: Document no-real-secrets in `.env.example`

**Problem:** `.env.example` is the secrets pattern — it documents variable names but should explicitly state that no real secrets are in the repo.

**Files to read first:**
- `.env.example` — read the full file

**Changes:**

Add a comment block at the very top of `.env.example`:
```sh
# .env.example — template only.
# Copy this file to .env and fill in real values for local development.
# IMPORTANT: No real credentials, tokens, or secrets are stored in this file
# or anywhere else in the repository. The .env file itself is gitignored.
```

---

## Verification

1. Run `git status` — `a.txt` removed, EXECPLAN files moved to `docs/`.
2. Run `git diff --exit-code .gitignore` — confirms new entries added.
3. Confirm `scripts/backup-db.sh` is executable: `ls -l scripts/backup-db.sh`.
4. Run `cat .github/PULL_REQUEST_TEMPLATE.md` — template is present.
5. Run `cat .github/CODEOWNERS` — owner entry is present.
6. Run `cat .editorconfig` — YAML section present.

## After finishing

Commit on branch `review-fixes`:
```
fix(repo): hygiene, backup script, PLANS docs, PR template, and smoke test (X-H2, X-H3, X-H4, X-M1, X-M5, X-L1, X-L2, X-L5, X-L7, X-L8)
```
