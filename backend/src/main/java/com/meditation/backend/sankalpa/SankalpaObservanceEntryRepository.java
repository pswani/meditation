package com.meditation.backend.sankalpa;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SankalpaObservanceEntryRepository extends JpaRepository<SankalpaObservanceEntryEntity, SankalpaObservanceEntryId> {

  List<SankalpaObservanceEntryEntity> findAllBySankalpaIdInOrderByObservanceDateAsc(Collection<String> sankalpaIds);

  void deleteAllBySankalpaId(String sankalpaId);
}
