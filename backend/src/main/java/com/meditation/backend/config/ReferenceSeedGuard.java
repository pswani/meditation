package com.meditation.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class ReferenceSeedGuard implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(ReferenceSeedGuard.class);

  private final JdbcTemplate jdbcTemplate;

  public ReferenceSeedGuard(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  @Override
  public void run(ApplicationArguments args) {
    Integer count = jdbcTemplate.queryForObject(
        "SELECT COUNT(*) FROM meditation_type_ref", Integer.class);
    if (count == null || count == 0) {
      throw new IllegalStateException(
          "Reference data is missing: meditation_type_ref is empty. " +
          "Ensure Flyway migration V2 has run successfully.");
    }
    log.info("Reference data check passed: {} meditation type(s) found.", count);
  }
}
