package com.meditation.backend.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("prod")
public class DataSourceGuard {

  @Value("${spring.datasource.url}")
  private String datasourceUrl;

  @PostConstruct
  public void rejectH2InProd() {
    if (datasourceUrl != null && datasourceUrl.contains(":h2:")) {
      throw new IllegalStateException(
          "Production profile is active but datasource URL contains ':h2:'. " +
          "Set MEDITATION_DB_URL to a PostgreSQL connection string.");
    }
  }
}
