ALTER TABLE session_log
    DROP CONSTRAINT IF EXISTS fk_session_log_custom_play;

ALTER TABLE session_log
    DROP CONSTRAINT IF EXISTS fk_session_log_playlist;
