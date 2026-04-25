#!/usr/bin/env bash
#═══════════════════════════════════════════════════════════════════════════════
# /Users/prashantwani/wrk/claude/meditation/claude-work.sh
#
# Project-specific Claude work script.
# Runs the prompts in PROMPTS[] in order, one per cron invocation.
# Aborts cleanly on usage-limit or permission errors and resumes on next run.
#
# Exit codes (consumed by the parent claude-work.sh):
#   0  — prompt completed (or nothing left to do)
#   2  — API usage limit reached; parent must stop all projects
#   3  — permission required; parent logs and continues to next project
#   1  — unexpected error
#═══════════════════════════════════════════════════════════════════════════════
set -uo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_FILE="$PROJECT_DIR/.claude-work-state"
LOG_FILE="${CLAUDE_WORK_LOG:-$PROJECT_DIR/.claude-work.log}"
CLAUDE="${CLAUDE_BIN:-/Users/prashantwani/.local/bin/claude}"

# ── Prompt queue ──────────────────────────────────────────────────────────────
# Each entry is either:
#   • a path relative to PROJECT_DIR (file must exist)   → its content is used
#   • any other string                                   → used as the prompt text directly
#
# Sessions A, B, C are already committed; the queue starts at D.
PROMPTS=(
    "the server is not starting up clean.  I am getting this message on the console when I run ./scripts/pipeline.sh release message: Backend health did not become ready at http://127.0.0.1:8080/api/health"
    "prompts/session-c-issue-10-ios-bell-reliability.md"
    "prompts/session-d-issue-6-monster-file-splits.md"
    # Inline example (no file needed):
    # "Run the full test suite, fix any failures, and commit the result."
)

# Maximum wall-clock minutes to allow a single claude run before timing out.
MAX_RUNTIME_MINUTES=90
# ─────────────────────────────────────────────────────────────────────────────

# ── Logging ───────────────────────────────────────────────────────────────────
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [meditation] $*" | tee -a "$LOG_FILE"; }
# ─────────────────────────────────────────────────────────────────────────────

# ── State helpers ─────────────────────────────────────────────────────────────
# State file is a simple bash-sourceable key=value file:
#   CURRENT_INDEX=3
#   NEEDS_RESUME=false
#   ABORT_REASON=

state_read() {
    CURRENT_INDEX=0
    NEEDS_RESUME=false
    ABORT_REASON=""
    if [[ -f "$STATE_FILE" ]]; then
        # shellcheck source=/dev/null
        source "$STATE_FILE"
    fi
}

state_write() {
    local index=$1 needs_resume=$2 abort_reason=${3:-}
    cat > "$STATE_FILE" <<EOF
CURRENT_INDEX=$index
NEEDS_RESUME=$needs_resume
ABORT_REASON=$abort_reason
EOF
}
# ─────────────────────────────────────────────────────────────────────────────

# ── Abort-condition detection ─────────────────────────────────────────────────
# Returns:
#   0  — success (no abort condition detected)
#   2  — usage / rate limit
#   3  — permission required
#   1  — other / unknown error
classify_exit() {
    local exit_code=$1
    local output=$2

    # Usage / rate limit — check output regardless of exit code
    if echo "$output" | grep -qiE \
        'usage.?limit|rate.?limit|quota.?exceeded|overloaded|too many requests|529|529 error'; then
        return 2
    fi

    # Permission required — Claude Code tells us it cannot run a tool
    if echo "$output" | grep -qiE \
        'requires? (user )?approval|permission (required|denied)|not allowed to|tool.*not.*available|bash.*not.*permitted'; then
        return 3
    fi

    # Non-zero exit with no recognised pattern
    if [[ $exit_code -ne 0 ]]; then
        return 1
    fi

    return 0
}
# ─────────────────────────────────────────────────────────────────────────────

# ── Run claude and capture output ─────────────────────────────────────────────
run_claude() {
    local prompt="$1"
    shift
    local extra_flags=("$@")

    local tmpout
    tmpout=$(mktemp)

    # Stream output to log AND capture it; respect the timeout
    timeout "${MAX_RUNTIME_MINUTES}m" \
        "$CLAUDE" --print "${extra_flags[@]}" "$prompt" \
        2>&1 | tee -a "$LOG_FILE" > "$tmpout"
    local pipe_exit=${PIPESTATUS[0]}

    local output
    output=$(cat "$tmpout")
    rm -f "$tmpout"

    # timeout exits 124 on timeout — treat as error
    if [[ $pipe_exit -eq 124 ]]; then
        log "claude timed out after ${MAX_RUNTIME_MINUTES} minutes"
        echo "$output"
        return 1
    fi

    echo "$output"
    return $pipe_exit
}
# ─────────────────────────────────────────────────────────────────────────────

# ── Main ──────────────────────────────────────────────────────────────────────
log "――― Run started ―――"

state_read

TOTAL=${#PROMPTS[@]}

# Nothing left to do
if [[ $CURRENT_INDEX -ge $TOTAL ]]; then
    log "All $TOTAL prompts completed — nothing to do"
    exit 0
fi

PROMPT_ENTRY="${PROMPTS[$CURRENT_INDEX]}"

# Resolve: relative file path → read file; anything else → use as-is
if [[ -f "$PROJECT_DIR/$PROMPT_ENTRY" ]]; then
    PROMPT_LABEL="$PROMPT_ENTRY"
    PROMPT_TEXT="$(cat "$PROJECT_DIR/$PROMPT_ENTRY")"
else
    PROMPT_LABEL="inline[$((CURRENT_INDEX + 1))]"
    PROMPT_TEXT="$PROMPT_ENTRY"
fi

log "Prompt $((CURRENT_INDEX + 1))/$TOTAL: $PROMPT_LABEL"

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

output=$(run_claude "$PROMPT" "${EXTRA_FLAGS[@]}")
claude_exit=$?

log "claude exited with code $claude_exit"

# Classify the result
classify_exit "$claude_exit" "$output"
result=$?

case $result in
    0)
        log "Prompt completed successfully"
        NEXT_INDEX=$((CURRENT_INDEX + 1))
        if [[ $NEXT_INDEX -ge $TOTAL ]]; then
            log "All $TOTAL prompts finished"
            state_write "$NEXT_INDEX" "false" ""
        else
            log "Advancing to prompt $((NEXT_INDEX + 1))/$TOTAL: ${PROMPTS[$NEXT_INDEX]}"
            state_write "$NEXT_INDEX" "false" ""
        fi
        exit 0
        ;;
    2)
        log "ABORT: usage limit reached — will resume next run"
        state_write "$CURRENT_INDEX" "true" "usage_limit"
        exit 2
        ;;
    3)
        log "ABORT: permission required — will resume next run"
        state_write "$CURRENT_INDEX" "true" "permission"
        exit 3
        ;;
    *)
        log "ABORT: unexpected error (claude exit $claude_exit) — will resume next run"
        state_write "$CURRENT_INDEX" "true" "error"
        exit 1
        ;;
esac
