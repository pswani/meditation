package com.meditation.backend.media;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class MediaAssetServiceTest {

  @Autowired
  private MediaAssetService mediaAssetService;

  @Test
  void mapsStoredRelativePathsToPublicMediaPaths() {
    List<MediaAssetResponse> assets = mediaAssetService.listCustomPlayMediaAssets();

    assertEquals(3, assets.size());
    assertEquals("/media/custom-plays/ajapa-breath-15.mp3", assets.get(0).filePath());
    assertEquals("custom-plays/ajapa-breath-15.mp3", assets.get(0).relativePath());
  }
}
