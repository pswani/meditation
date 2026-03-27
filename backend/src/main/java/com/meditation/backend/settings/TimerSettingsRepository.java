package com.meditation.backend.settings;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TimerSettingsRepository extends JpaRepository<TimerSettingsEntity, String> {
}
