package com.meditation.backend.media;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/media/custom-plays")
public class MediaAssetController {

  private final MediaAssetService mediaAssetService;

  public MediaAssetController(MediaAssetService mediaAssetService) {
    this.mediaAssetService = mediaAssetService;
  }

  @GetMapping
  public List<MediaAssetResponse> listCustomPlayMediaAssets() {
    return mediaAssetService.listCustomPlayMediaAssets();
  }
}
