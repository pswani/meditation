package com.meditation.backend.sankalpa;

import com.meditation.backend.reference.ReferenceData;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class SankalpaObservanceRecalculator {

  private final SankalpaObservanceEntryRepository sankalpaObservanceEntryRepository;

  public SankalpaObservanceRecalculator(
      SankalpaObservanceEntryRepository sankalpaObservanceEntryRepository) {
    this.sankalpaObservanceEntryRepository = sankalpaObservanceEntryRepository;
  }

  // Delete-then-insert within a single transaction; rolls back together if saveAll fails.
  @Transactional
  public void replace(
      String sankalpaId,
      List<SankalpaObservanceRecordPayload> observanceRecords,
      Instant mutationTimestamp
  ) {
    sankalpaObservanceEntryRepository.deleteAllBySankalpaId(sankalpaId);

    List<SankalpaObservanceRecordPayload> normalizedRecords = normalizePayloads(observanceRecords);
    if (normalizedRecords.isEmpty()) {
      return;
    }

    sankalpaObservanceEntryRepository.saveAll(
        normalizedRecords.stream()
            .map(record -> new SankalpaObservanceEntryEntity(
                sankalpaId,
                LocalDate.parse(record.date()),
                record.status(),
                mutationTimestamp
            ))
            .toList()
    );
  }

  public static void validateRecords(
      List<SankalpaObservanceRecordPayload> observanceRecords,
      Instant createdAt,
      int days,
      ZoneId zoneId
  ) {
    for (SankalpaObservanceRecordPayload record : normalizePayloads(observanceRecords)) {
      if (!ReferenceData.isObservanceStatus(record.status())) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Observance status is invalid.");
      }
      LocalDate date;
      try {
        date = LocalDate.parse(record.date());
      } catch (DateTimeParseException exception) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Observance date must be a valid ISO date.");
      }
      LocalDate startDate = createdAt.atZone(zoneId).toLocalDate();
      LocalDate endDate = startDate.plusDays(Math.max(0, days - 1));
      if (date.isBefore(startDate) || date.isAfter(endDate)) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Observance date must fall within the sankalpa window.");
      }
    }
  }

  public static List<SankalpaObservanceRecordPayload> normalizePayloads(
      List<SankalpaObservanceRecordPayload> observanceRecords
  ) {
    if (observanceRecords == null || observanceRecords.isEmpty()) {
      return List.of();
    }

    return observanceRecords.stream()
        .filter(Objects::nonNull)
        .collect(Collectors.toMap(
            SankalpaObservanceRecordPayload::date,
            SankalpaObservanceRecordPayload::status,
            (left, right) -> right,
            LinkedHashMap::new
        ))
        .entrySet()
        .stream()
        .sorted(Map.Entry.comparingByKey())
        .map(entry -> new SankalpaObservanceRecordPayload(entry.getKey(), entry.getValue()))
        .toList();
  }
}
