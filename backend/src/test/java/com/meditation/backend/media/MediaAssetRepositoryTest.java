package com.meditation.backend.media;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class MediaAssetRepositoryTest {

  @Autowired
  private MediaAssetRepository mediaAssetRepository;

  @Test
  void returnsActiveCustomPlayAssetsSortedByLabel() {
    List<MediaAssetEntity> assets = mediaAssetRepository.findByAssetKindAndActiveTrueOrderByLabelAsc("custom-play");

    assertEquals(3, assets.size());
    assertEquals("Ajapa Breath Cycle (15 min)", assets.get(0).getLabel());
    assertEquals("Tratak Focus Bellset (10 min)", assets.get(1).getLabel());
    assertEquals("Vipassana Sit (20 min)", assets.get(2).getLabel());
  }
}
