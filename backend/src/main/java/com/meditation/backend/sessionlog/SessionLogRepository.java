package com.meditation.backend.sessionlog;

import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SessionLogRepository extends JpaRepository<SessionLogEntity, String> {

  List<SessionLogEntity> findAllByOrderByEndedAtDescCreatedAtDesc();

  List<SessionLogEntity> findAllByEndedAtGreaterThanEqualOrderByEndedAtDescCreatedAtDesc(Instant startAt);

  List<SessionLogEntity> findAllByEndedAtLessThanEqualOrderByEndedAtDescCreatedAtDesc(Instant endAt);

  List<SessionLogEntity> findAllByEndedAtBetweenOrderByEndedAtDescCreatedAtDesc(Instant startAt, Instant endAt);

  interface SessionLogAggregateView {
    long getSessionLogCount();
    long getTotalDurationSeconds();
  }

  interface SummaryOverallView {
    long getTotalSessionLogs();
    long getCompletedSessionLogs();
    long getTotalDurationSeconds();
    long getAutoLogs();
  }

  interface SummaryByTypeView {
    String getMeditationTypeCode();
    long getSessionLogs();
    long getTotalDurationSeconds();
  }

  interface SummaryBySourceView {
    String getSource();
    long getSessionLogs();
    long getCompletedSessionLogs();
    long getTotalDurationSeconds();
  }

  interface SessionLogTimeSliceView {
    Instant getEndedAt();
    String getStatus();
    int getCompletedDurationSeconds();
  }

  @Query("""
      select sl
      from SessionLogEntity sl
      where (:startAt is null or sl.endedAt >= :startAt)
        and (:endAt is null or sl.endedAt <= :endAt)
        and (:meditationType is null or sl.meditationTypeCode = :meditationType)
        and (:source is null or sl.source = :source)
      order by sl.endedAt desc, sl.createdAt desc
      """)
  List<SessionLogEntity> findAllMatching(
      @Param("startAt") Instant startAt,
      @Param("endAt") Instant endAt,
      @Param("meditationType") String meditationType,
      @Param("source") String source
  );

  @Query(
      value = """
          select sl
          from SessionLogEntity sl
          where (:startAt is null or sl.endedAt >= :startAt)
            and (:endAt is null or sl.endedAt <= :endAt)
            and (:meditationType is null or sl.meditationTypeCode = :meditationType)
            and (:source is null or sl.source = :source)
          """,
      countQuery = """
          select count(sl)
          from SessionLogEntity sl
          where (:startAt is null or sl.endedAt >= :startAt)
            and (:endAt is null or sl.endedAt <= :endAt)
            and (:meditationType is null or sl.meditationTypeCode = :meditationType)
            and (:source is null or sl.source = :source)
          """
  )
  Page<SessionLogEntity> findPageMatching(
      @Param("startAt") Instant startAt,
      @Param("endAt") Instant endAt,
      @Param("meditationType") String meditationType,
      @Param("source") String source,
      Pageable pageable
  );

  @Query("""
      select
        count(sl) as totalSessionLogs,
        coalesce(sum(case when sl.status = 'completed' then 1 else 0 end), 0) as completedSessionLogs,
        coalesce(sum(sl.completedDurationSeconds), 0) as totalDurationSeconds,
        coalesce(sum(case when sl.source = 'auto log' then 1 else 0 end), 0) as autoLogs
      from SessionLogEntity sl
      where (:startAt is null or sl.endedAt >= :startAt)
        and (:endAt is null or sl.endedAt <= :endAt)
        and (:meditationType is null or sl.meditationTypeCode = :meditationType)
        and (:source is null or sl.source = :source)
      """)
  SummaryOverallView summarizeOverall(
      @Param("startAt") Instant startAt,
      @Param("endAt") Instant endAt,
      @Param("meditationType") String meditationType,
      @Param("source") String source
  );

  @Query("""
      select
        sl.meditationTypeCode as meditationTypeCode,
        count(sl) as sessionLogs,
        coalesce(sum(sl.completedDurationSeconds), 0) as totalDurationSeconds
      from SessionLogEntity sl
      where (:startAt is null or sl.endedAt >= :startAt)
        and (:endAt is null or sl.endedAt <= :endAt)
        and (:meditationType is null or sl.meditationTypeCode = :meditationType)
        and (:source is null or sl.source = :source)
      group by sl.meditationTypeCode
      """)
  List<SummaryByTypeView> summarizeByMeditationType(
      @Param("startAt") Instant startAt,
      @Param("endAt") Instant endAt,
      @Param("meditationType") String meditationType,
      @Param("source") String source
  );

  @Query("""
      select
        sl.source as source,
        count(sl) as sessionLogs,
        coalesce(sum(case when sl.status = 'completed' then 1 else 0 end), 0) as completedSessionLogs,
        coalesce(sum(sl.completedDurationSeconds), 0) as totalDurationSeconds
      from SessionLogEntity sl
      where (:startAt is null or sl.endedAt >= :startAt)
        and (:endAt is null or sl.endedAt <= :endAt)
        and (:meditationType is null or sl.meditationTypeCode = :meditationType)
        and (:source is null or sl.source = :source)
      group by sl.source
      """)
  List<SummaryBySourceView> summarizeBySource(
      @Param("startAt") Instant startAt,
      @Param("endAt") Instant endAt,
      @Param("meditationType") String meditationType,
      @Param("source") String source
  );

  @Query("""
      select
        sl.endedAt as endedAt,
        sl.status as status,
        sl.completedDurationSeconds as completedDurationSeconds
      from SessionLogEntity sl
      where (:startAt is null or sl.endedAt >= :startAt)
        and (:endAt is null or sl.endedAt <= :endAt)
        and (:meditationType is null or sl.meditationTypeCode = :meditationType)
        and (:source is null or sl.source = :source)
      order by sl.endedAt desc, sl.createdAt desc
      """)
  List<SessionLogTimeSliceView> findTimeSlices(
      @Param("startAt") Instant startAt,
      @Param("endAt") Instant endAt,
      @Param("meditationType") String meditationType,
      @Param("source") String source
  );

  @Query("""
      select
        count(sl) as sessionLogCount,
        coalesce(sum(sl.completedDurationSeconds), 0) as totalDurationSeconds
      from SessionLogEntity sl
      where sl.endedAt >= :startAt
        and sl.endedAt <= :endAt
        and (:meditationType is null or sl.meditationTypeCode = :meditationType)
      """)
  SessionLogAggregateView summarizeForGoalWindow(
      @Param("startAt") Instant startAt,
      @Param("endAt") Instant endAt,
      @Param("meditationType") String meditationType
  );
}
