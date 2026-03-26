package com.meditation.backend.media;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MediaAssetRepository extends JpaRepository<MediaAssetEntity, String> {

  List<MediaAssetEntity> findByAssetKindAndActiveTrueOrderByLabelAsc(String assetKind);
}
