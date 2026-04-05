package com.meditation.backend.reference;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class ReferenceDataSeedTest {

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @Test
  void meditationTypeSeedOrderMatchesSharedReferenceData() {
    List<String> seededMeditationTypes = jdbcTemplate.queryForList(
        "select code from meditation_type_ref where active = true order by sort_order asc",
        String.class
    );

    assertEquals(ReferenceData.MEDITATION_TYPES, seededMeditationTypes);
  }
}
