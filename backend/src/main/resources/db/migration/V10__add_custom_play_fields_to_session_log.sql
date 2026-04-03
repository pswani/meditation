ALTER TABLE session_log
    ADD COLUMN custom_play_name VARCHAR(160);

ALTER TABLE session_log
    ADD COLUMN custom_play_recording_label VARCHAR(500);
