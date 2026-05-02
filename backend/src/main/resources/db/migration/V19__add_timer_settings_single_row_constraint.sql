-- timer_settings is a single-row configuration table; only the 'default' row is valid.
ALTER TABLE timer_settings ADD CONSTRAINT chk_timer_settings_default_only
    CHECK (id = 'default');
