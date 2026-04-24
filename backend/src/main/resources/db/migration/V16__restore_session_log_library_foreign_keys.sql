-- Restores referential integrity dropped in V14.
-- ON DELETE SET NULL: historical session logs are preserved when a library item is deleted;
-- custom_play_name / playlist_name columns retain the point-in-time name snapshot.
ALTER TABLE session_log
    ADD CONSTRAINT fk_session_log_custom_play
        FOREIGN KEY (custom_play_id) REFERENCES custom_play(id) ON DELETE SET NULL;

ALTER TABLE session_log
    ADD CONSTRAINT fk_session_log_playlist
        FOREIGN KEY (playlist_id) REFERENCES playlist(id) ON DELETE SET NULL;
