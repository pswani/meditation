package com.meditation.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "meditation.backend.sync")
public class SyncProperties {

  private long clockSkewToleranceSeconds = 300;

  public long getClockSkewToleranceSeconds() {
    return clockSkewToleranceSeconds;
  }

  public void setClockSkewToleranceSeconds(long clockSkewToleranceSeconds) {
    this.clockSkewToleranceSeconds = clockSkewToleranceSeconds;
  }
}
