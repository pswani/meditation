-- Restores referential integrity dropped in V14.
-- ON DELETE SET NULL: historical session logs are preserved when a library item is deleted;
-- custom_play_name / playlist_name columns retain the point-in-time name snapshot.

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
