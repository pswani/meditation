#!/usr/bin/env bash
#═══════════════════════════════════════════════════════════════════════════════
# /Users/prashantwani/wrk/claude/meditation/claude-work.sh
#
# Project-specific Claude work script.
# Reads tasks from work-queue.txt (one per line) and runs the first one.
# Completed tasks are removed from the queue automatically.
# Aborts cleanly on usage-limit or permission errors and resumes on next run.
#
# Exit codes (consumed by the parent claude-work.sh):
#   0  — task completed (or nothing left to do)
#   2  — API usage limit reached; parent must stop all projects
#   3  — permission required; parent logs and continues to next project
#   1  — unexpected error
#═══════════════════════════════════════════════════════════════════════════════
set -uo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_FILE="$PROJECT_DIR/.claude-work-state"
QUEUE_FILE="$PROJECT_DIR/work-queue.txt"
LOG_FILE="${CLAUDE_WORK_LOG:-$PROJECT_DIR/.claude-work.log}"
CLAUDE="${CLAUDE_BIN:-/Users/prashantwani/.local/bin/claude}"

# Maximum wall-clock minutes to allow a single claude run before timing out.
MAX_RUNTIME_MINUTES=90

# Optional flags added to every claude invocation.
# Example: CLAUDE_FLAGS=(--dangerously-skip-permissions)
CLAUDE_FLAGS=()

# ── Logging ───────────────────────────────────────────────────────────────────
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [meditation] $*" | tee -a "$LOG_FILE"; }

# ── State helpers ─────────────────────────────────────────────────────────────
state_read() {
    NEEDS_RESUME=false
    ABORT_REASON=""
    if [[ -f "$STATE_FILE" ]]; then
        # shellcheck source=/dev/null
        source "$STATE_FILE"
    fi
}

state_write() {
    local needs_resume=$1 abort_reason=${2:-}
    cat > "$STATE_FILE" <<EOF
NEEDS_RESUME=$needs_resume
ABORT_REASON=$abort_reason
EOF
}

# ── Abort-condition detection ─────────────────────────────────────────────────
classify_exit() {
    local exit_code=$1
    local output=$2

    if echo "$output" | grep -qiE \
        'usage.?limit|rate.?limit|quota.?exceeded|overloaded|too many requests|529|529 error'; then
        return 2
    fi

    if echo "$output" | grep -qiE \
        'requires? (user )?approval|permission (required|denied)|not allowed to|tool.*not.*available|bash.*not.*permitted'; then
        return 3
    fi

    if [[ $exit_code -ne 0 ]]; then
        return 1
    fi

    return 0
}

# ── Run claude and capture output ─────────────────────────────────────────────
run_claude() {
    local prompt="$1"
    shift
    local extra_flags=("$@")

    local tmpout
    tmpout=$(mktemp)

    timeout "${MAX_RUNTIME_MINUTES}m" \
        "$CLAUDE" --print "${extra_flags[@]}" "$prompt" \
        2>&1 | tee -a "$LOG_FILE" > "$tmpout"
    local pipe_exit=${PIPESTATUS[0]}

    local output
    output=$(cat "$tmpout")
    rm -f "$tmpout"

    if [[ $pipe_exit -eq 124 ]]; then
        log "claude timed out after ${MAX_RUNTIME_MINUTES} minutes"
        echo "$output"
        return 1
    fi

    echo "$output"
    return $pipe_exit
}

# ── Main ──────────────────────────────────────────────────────────────────────
log "――― Run started ―――"

state_read

# Check queue file exists
if [[ ! -f "$QUEUE_FILE" ]]; then
    log "Queue file not found: $QUEUE_FILE — nothing to do"
    exit 0
fi

# Get first non-empty, non-comment line (raw, may include a flags prefix)
QUEUE_ENTRY=$(grep -v '^\s*#' "$QUEUE_FILE" | grep -v '^\s*$' | head -1)

if [[ -z "$QUEUE_ENTRY" ]]; then
    log "Queue is empty — nothing to do"
    exit 0
fi

# Find its line number in the file (exact match on raw entry, for removal after completion)
TASK_LINE=$(awk -v entry="$QUEUE_ENTRY" '$0 == entry {print NR; exit}' "$QUEUE_FILE")

# Parse optional per-task flags: "--flag1 --flag2 :: actual prompt"
TASK_FLAGS=()
PROMPT_ENTRY="$QUEUE_ENTRY"
if [[ "$QUEUE_ENTRY" == *" :: "* ]]; then
    flags_str="${QUEUE_ENTRY%% :: *}"
    PROMPT_ENTRY="${QUEUE_ENTRY#* :: }"
    read -ra TASK_FLAGS <<< "$flags_str"
    log "Task flags: $flags_str"
fi

# Count tasks remaining (including current)
QUEUE_REMAINING=$(grep -v '^\s*#' "$QUEUE_FILE" | grep -c '\S' || true)

# Resolve: relative file path → read file contents; anything else → use as-is
if [[ -f "$PROJECT_DIR/$PROMPT_ENTRY" ]]; then
    PROMPT_LABEL="$PROMPT_ENTRY"
    PROMPT_TEXT="$(cat "$PROJECT_DIR/$PROMPT_ENTRY")"
else
    PROMPT_LABEL="inline: ${PROMPT_ENTRY:0:60}"
    PROMPT_TEXT="$PROMPT_ENTRY"
fi

log "Task ($QUEUE_REMAINING in queue): $PROMPT_LABEL"

# ── Build the prompt and choose fresh vs resume ───────────────────────────────
EXTRA_FLAGS=()

if [[ "$NEEDS_RESUME" == "true" ]]; then
    log "Resuming previous session (abort reason: $ABORT_REASON)"
    PROMPT="$(cat <<RESUME_EOF
The previous run of this task was interrupted (reason: ${ABORT_REASON}).

Original task
─────────────
${PROMPT_TEXT}
─────────────

Please inspect the current repository state (git log --oneline -10, git status)
to understand what was completed, then finish any remaining work from the
original task above.
RESUME_EOF
)"
    EXTRA_FLAGS=(--continue)
else
    log "Starting fresh run"
    PROMPT="$PROMPT_TEXT"
fi

# ── Execute ───────────────────────────────────────────────────────────────────
log "Invoking claude (timeout ${MAX_RUNTIME_MINUTES}m) …"

output=$(run_claude "$PROMPT" "${CLAUDE_FLAGS[@]}" "${TASK_FLAGS[@]}" "${EXTRA_FLAGS[@]}")
claude_exit=$?

log "claude exited with code $claude_exit"

classify_exit "$claude_exit" "$output"
result=$?

case $result in
    0)
        log "Task completed successfully"
        sed -i '' "${TASK_LINE}d" "$QUEUE_FILE"
        log "Removed from queue: $PROMPT_LABEL"
        state_write "false" ""
        exit 0
        ;;
    2)
        log "ABORT: usage limit reached — will resume next run"
        state_write "true" "usage_limit"
        exit 2
        ;;
    3)
        log "ABORT: permission required — will resume next run"
        state_write "true" "permission"
        exit 3
        ;;
    *)
        log "ABORT: unexpected error (claude exit $claude_exit) — will resume next run"
        state_write "true" "error"
        exit 1
        ;;
esac
