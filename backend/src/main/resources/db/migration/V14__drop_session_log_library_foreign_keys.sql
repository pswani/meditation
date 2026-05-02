-- V14: Drop FKs temporarily so library items (custom plays, playlists) can be
-- deleted without cascading hard-deletes into session_log. Restored in V16 with
-- ON DELETE SET NULL, which nulls the FK column while preserving the name snapshot.
-- See V10 for the denormalized name fields (custom_play_name, playlist_name) that
-- serve as intentional point-in-time record of what was played.
-- Note: if flyway checksum fails after this comment was added, run flyway repair.
ALTER TABLE session_log
    DROP CONSTRAINT IF EXISTS fk_session_log_custom_play;

ALTER TABLE session_log
    DROP CONSTRAINT IF EXISTS fk_session_log_playlist;
