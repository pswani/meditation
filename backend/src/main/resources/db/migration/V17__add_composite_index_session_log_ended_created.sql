-- Summary and list queries order by ended_at DESC, created_at DESC; the composite
-- index replaces the single-column ix_session_log_ended_at for those query plans.
DROP INDEX IF EXISTS ix_session_log_ended_at;
CREATE INDEX ix_session_log_ended_created ON session_log(ended_at DESC, created_at DESC);
