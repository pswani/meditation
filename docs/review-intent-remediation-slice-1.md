# Review: Intent Remediation Slice 1

Date: 2026-04-01

## Findings

### [P1] `db:h2:reset` can still wipe an active default database when the backend is using a different port override
- File: `scripts/h2-reset.sh:14`
- The new reset guard only checks the currently configured `backend_port` and `backend_health_url` before deleting `$(h2_db_dir)/$(h2_db_name)`. That is not enough to make this path "safe" once the repo supports per-shell port overrides in `README.md`: a backend can be running against the same default H2 files on `8081`, while a plain `npm run db:h2:reset` in another shell still defaults to `8080` and removes the active database files. Because this slice now documents reset as the repo-owned recovery path for Flyway mismatch, we should gate deletion on the database files themselves or require an explicit force-style acknowledgement before claiming the reset is safe.

### [P2] `start:app` still waits the full timeout before showing Flyway recovery guidance after the backend crashes immediately
- Files: `scripts/app-start.sh:50`, `scripts/common.sh:372`
- The new Flyway recovery message is helpful, but `start:app` only prints it after `wait_for_http` times out. If the managed backend dies right away on a local Flyway mismatch, the script still waits up to 90 seconds because it never checks whether `backend_pid` has already exited. That makes the intended recovery path feel like a hang in the exact failure mode this slice is trying to clarify.

## Open questions and assumptions
- Assumed that developers may run the backend on a non-default port in one shell and the reset command without matching overrides in another shell, because the README documents those port overrides as optional environment variables rather than persistent shared config.
