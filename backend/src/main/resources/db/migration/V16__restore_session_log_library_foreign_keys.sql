-- V16: Restore referential integrity dropped in V14. FKs now use ON DELETE SET NULL
-- so deleting a custom play or playlist nulls the FK column in session_log while
-- leaving the name snapshot (custom_play_name, playlist_name) intact. Historical
-- logs retain the name of what was played even after the library item is deleted.
-- The name fields are intentionally point-in-time and are NOT updated if the
-- library item is renamed after the session was logged.
-- Note: if flyway checksum fails after this comment was added, run flyway repair.

-- Null out any orphaned references before adding constraints, since library items
-- may have been deleted while FKs were absent (V14 dropped them).
UPDATE session_log SET custom_play_id = NULL WHERE custom_play_id IS NOT NULL AND custom_play_id NOT IN (SELECT id FROM custom_play);
UPDATE session_log SET playlist_id = NULL WHERE playlist_id IS NOT NULL AND playlist_id NOT IN (SELECT id FROM playlist);

ALTER TABLE session_log
    ADD CONSTRAINT fk_session_log_custom_play
        FOREIGN KEY (custom_play_id) REFERENCES custom_play(id) ON DELETE SET NULL;

ALTER TABLE session_log
    ADD CONSTRAINT fk_session_log_playlist
        FOREIGN KEY (playlist_id) REFERENCES playlist(id) ON DELETE SET NULL;
