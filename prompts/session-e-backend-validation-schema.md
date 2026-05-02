# Session E — Backend: Validation, Schema Guards & Config Fixes

## Context

This is a meditation app with a Spring Boot 3.3.4 / Java 21 backend, React/TypeScript web client, and a Swift iOS client.
We are working on branch `review-fixes`. Sessions A–D fix top-10 cross-cutting issues. This session addresses Backend & Database findings from `CODE-REVIEW-2026-04-24.md`.

The backend lives at `backend/`. Run `./mvnw test` (after creating the wrapper) or `mvn test` from the `backend/` directory to verify changes.

**Issues addressed (11 total):**
- B-H6: Integer request fields accept negatives — no Bean Validation on DTOs
- B-H9: H2 in production — no startup guard
- B-M1: Transactional boundary missing on `CustomPlayService.saveCustomPlay`
- B-M3: Missing composite index on `session_log(ended_at, created_at)`
- B-M12: `MediaAssetEntity.updatedAt` not auto-updated via `@UpdateTimestamp`
- B-M13: MIME type is free-form text with no whitelist constraint
- B-L1: `DELETE` endpoints return 404 when entity not found (should be idempotent 204)
- B-L5: `SummaryService` recomputes from full session log on every request with no cache
- B-L8: `timer_settings` has no constraint enforcing the single `default` row
- B-L10: Playlist item `position_index` has no contiguity validation
- B-L12: Maven wrapper (`mvnw`) not present — builds depend on system Maven

**Already confirmed fixed (do NOT re-fix):**
- B-H1: `GlobalExceptionHandler` exists with `@RestControllerAdvice`
- B-H4: `SyncClockSkewInterceptor` enforces 300 s clock skew tolerance
- B-H7: CORS restricted to `Content-Type, X-Meditation-Sync-Queued-At, X-Requested-With`
- B-H10: Actuator restricted to `health,info`
- B-M16: `spring.jpa.open-in-view=false` already set
- B-L3: `application-prod.yml` already exists

---

## B-H6: Bean Validation on request DTOs

**Problem:** Request DTOs are plain Java records with no `@Min`/`@Max`/`@Positive` annotations. Validation happens inconsistently at the service layer (e.g., `TimerSettingsService.java:105`) but is missing on many other DTOs. The `spring-boot-starter-validation` dependency is not in `pom.xml`.

**Files to read first:**
- `backend/pom.xml` — confirm `spring-boot-starter-validation` is absent
- `backend/src/main/java/com/meditation/backend/customplay/CustomPlayUpsertRequest.java`
- `backend/src/main/java/com/meditation/backend/sessionlog/SessionLogUpsertRequest.java`
- `backend/src/main/java/com/meditation/backend/playlist/PlaylistItemUpsertRequest.java` (if it exists) or `PlaylistUpsertRequest.java`
- `backend/src/main/java/com/meditation/backend/customplay/CustomPlayController.java` — check if `@Valid` is present on `@RequestBody`

**Changes:**

1. In `backend/pom.xml`, add inside `<dependencies>`:
   ```xml
   <dependency>
     <groupId>org.springframework.boot</groupId>
     <artifactId>spring-boot-starter-validation</artifactId>
   </dependency>
   ```

2. Annotate `CustomPlayUpsertRequest`:
   - `durationMinutes`: add `@Positive` (must be > 0)

3. Annotate `SessionLogUpsertRequest`:
   - `completedDurationSeconds`: add `@PositiveOrZero`
   - `intervalMinutes`: add `@Min(0)`

4. In `PlaylistUpsertRequest` and `PlaylistItemUpsertRequest` (read first to confirm field names):
   - Any `durationMinutes` field: add `@Positive`
   - Any `positionIndex` field: add `@Min(0)`

5. For every `@PutMapping` or `@PostMapping` controller method that takes `@RequestBody`, add `@Valid` before the `@RequestBody` parameter. Read each of these controllers:
   - `CustomPlayController.java`
   - `SessionLogController.java`
   - `PlaylistController.java`
   - `SankalpaController.java`
   - `TimerSettingsController.java`

   The `GlobalExceptionHandler` already handles `MethodArgumentNotValidException` (Spring's validation exception); confirm it returns 400 — if not, add a handler for it that formats it the same way as the existing `HttpMessageNotReadableException` handler.

---

## B-H9: H2-in-production startup guard

**Problem:** `application-prod.yml` overrides the datasource to PostgreSQL via `${MEDITATION_DB_URL}`, but if someone runs with the wrong `--spring.profiles.active`, the app silently starts against an H2 file. A startup guard prevents silent data loss.

**Files to read first:**
- `backend/src/main/java/com/meditation/backend/MeditationBackendApplication.java`
- `backend/src/main/resources/application.yml`
- `backend/src/main/resources/application-prod.yml`

**Changes:**

Create a new file `backend/src/main/java/com/meditation/backend/config/DataSourceGuard.java`:

```java
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
```

---

## B-M1: @Transactional on CustomPlayService.saveCustomPlay

**Problem:** `CustomPlayService.saveCustomPlay` issues multiple repository calls (read + write) with no surrounding transaction. A partial failure between `existsByIdAndAssetKindAndActiveTrue` validation and `customPlayRepository.save(entity)` leaves no rollback path.

**Files to read first:**
- `backend/src/main/java/com/meditation/backend/customplay/CustomPlayService.java`

**Changes:**

Add `@Transactional` to `saveCustomPlay` (import `org.springframework.transaction.annotation.Transactional`):

```java
@Transactional
public SyncMutationResult<CustomPlayResponse> saveCustomPlay(
    String customPlayId,
    CustomPlayUpsertRequest request,
    String syncQueuedAtRaw
) {
```

Also add `@Transactional` to `deleteCustomPlay` for consistency.

---

## B-M3: Composite index on session_log(ended_at, created_at)

**Problem:** V1 creates `ix_session_log_ended_at` (single column). Summary and list queries sort or filter by both `ended_at` and `created_at`, causing an in-memory sort on the unindexed column.

**Files to read first:**
- `backend/src/main/resources/db/migration/` — confirm the next version number (should be V17 if V16 is the latest)
- `backend/src/main/resources/db/migration/V1__create_core_reference_and_domain_tables.sql` — check the existing single-column index name

**Changes:**

Create `backend/src/main/resources/db/migration/V17__add_composite_index_session_log_ended_created.sql`:

```sql
-- Summary and list queries order by ended_at DESC, created_at DESC; the composite
-- index replaces the single-column ix_session_log_ended_at for those query plans.
DROP INDEX IF EXISTS ix_session_log_ended_at;
CREATE INDEX ix_session_log_ended_created ON session_log(ended_at DESC, created_at DESC);
```

Note: H2 supports `DESC` on individual index columns. If the existing index name differs from `ix_session_log_ended_at`, use the actual name from V1.

---

## B-M12: @UpdateTimestamp on MediaAssetEntity.updatedAt

**Problem:** `MediaAssetEntity.updatedAt` has no `@UpdateTimestamp` (Hibernate) annotation. Service methods that don't explicitly update the field leave it stale, so caching clients never see a fresh signal.

**Files to read first:**
- `backend/src/main/java/com/meditation/backend/media/MediaAssetEntity.java`
- `backend/src/main/java/com/meditation/backend/media/MediaAssetService.java` — check if it manually sets `updatedAt`

**Changes:**

In `MediaAssetEntity.java`, add the Hibernate annotation to the `updatedAt` field:

```java
import org.hibernate.annotations.UpdateTimestamp;

@UpdateTimestamp
@Column(name = "updated_at", nullable = false)
private Instant updatedAt;
```

If `MediaAssetService` manually sets `updatedAt` before saving, keep that path unchanged — `@UpdateTimestamp` overrides it to the current time on every save, which is the desired behavior.

---

## B-M13: MIME type whitelist validation

**Problem:** `media_asset.mime_type` is `varchar(100)` with no constraint. A client can set `image/svg+xml` on an audio record.

**Files to read first:**
- `backend/src/main/java/com/meditation/backend/media/MediaAssetService.java` — find the save/create path
- `backend/src/main/resources/db/migration/` — confirm current latest migration version

**Changes:**

1. In `MediaAssetService.java`, in the validation method (read the file to find it), add an allowed MIME type check:

   ```java
   private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
       "audio/mpeg", "audio/wav", "audio/aac", "audio/ogg", "audio/mp4",
       "audio/x-m4a", "audio/flac"
   );

   // in validateRequest or equivalent:
   if (!ALLOWED_MIME_TYPES.contains(request.mimeType())) {
       throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
           "Unsupported MIME type: " + request.mimeType());
   }
   ```

2. Add a DB-level constraint in a new migration (use the next version number after V17 — check after creating V17):

   Create `V18__add_mime_type_constraint.sql`:
   ```sql
   ALTER TABLE media_asset ADD CONSTRAINT chk_media_asset_mime_type
       CHECK (mime_type IN (
           'audio/mpeg', 'audio/wav', 'audio/aac', 'audio/ogg', 'audio/mp4',
           'audio/x-m4a', 'audio/flac'
       ));
   ```

   Note: The seed data in V2 may have existing MIME types in the media_asset rows — read V2 to confirm they are in the allowed list, and update V2's seed data if necessary (or update the existing rows in V18 before adding the constraint).

---

## B-L1: Idempotent DELETE responses

**Problem:** DELETE endpoints return 404 when the entity is not found. Clients that retry a DELETE after a transient network error receive an error instead of the idempotent 204.

**Files to read first:**
- `backend/src/main/java/com/meditation/backend/customplay/CustomPlayController.java`
- `backend/src/main/java/com/meditation/backend/playlist/PlaylistController.java`
- `backend/src/main/java/com/meditation/backend/sankalpa/SankalpaController.java`
- `backend/src/main/java/com/meditation/backend/sessionlog/SessionLogController.java` (if DELETE exists)

**Changes:**

For each DELETE controller method, when the service returns a result indicating the record was not found (e.g., `outcome == "deleted"` with a null body), return `204 No Content` rather than a 404. Do NOT change the behavior for `stale` outcomes — those should continue to return the stale payload with 200.

The services already return `"deleted"` with a null payload when the entity is not found, so the controller just needs to treat both "entity existed and was deleted" and "entity did not exist" identically: respond with 204 and no body.

---

## B-L5: Cache SummaryService responses

**Problem:** `SummaryService.getSummary` recomputes from the full session log table on every request with no caching. For a user with years of history this is an expensive scan on every page load.

**Files to read first:**
- `backend/pom.xml` — check if `spring-boot-starter-cache` and a cache provider are present
- `backend/src/main/java/com/meditation/backend/summary/SummaryService.java`
- `backend/src/main/java/com/meditation/backend/MeditationBackendApplication.java`
- `backend/src/main/resources/application.yml`

**Changes:**

1. In `pom.xml`, add (if not present):
   ```xml
   <dependency>
     <groupId>org.springframework.boot</groupId>
     <artifactId>spring-boot-starter-cache</artifactId>
   </dependency>
   <dependency>
     <groupId>com.github.ben-manes.caffeine</groupId>
     <artifactId>caffeine</artifactId>
   </dependency>
   ```

2. Add `@EnableCaching` to `MeditationBackendApplication` (or to a dedicated `CacheConfig` class in `config/`).

3. In `application.yml`, add a Caffeine cache spec:
   ```yaml
   spring:
     cache:
       type: caffeine
       caffeine:
         spec: maximumSize=50,expireAfterWrite=60s
   ```

4. Annotate `SummaryService.getSummary` with:
   ```java
   @Cacheable(value = "summary", key = "#startAtRaw + '_' + #endAtRaw + '_' + #timeZoneRaw + '_' + #meditationTypeRaw + '_' + #sourceRaw")
   ```

5. When a session log is saved or deleted, the summary cache must be evicted. Find `SessionLogService.saveSessionLog` and any delete method — add `@CacheEvict(value = "summary", allEntries = true)` to each mutation method.

---

## B-L8: Timer settings uniqueness constraint

**Problem:** `timer_settings` is designed as a single-row table with a hardcoded `id = 'default'`. There is no DB constraint preventing additional rows from being inserted.

**Files to read first:**
- `backend/src/main/resources/db/migration/V3__add_session_log_sync_and_timer_settings.sql`

**Changes:**

Add a constraint to the migration script for the next version (if it isn't already in an existing migration). Since we cannot edit committed migrations, create a new migration:

Create `V19__add_timer_settings_single_row_constraint.sql`:
```sql
-- timer_settings is a single-row configuration table; only the 'default' row is valid.
ALTER TABLE timer_settings ADD CONSTRAINT chk_timer_settings_default_only
    CHECK (id = 'default');
```

Note: Verify the next available migration number by checking the highest V-number in `db/migration/` after creating V17 and V18.

---

## B-L10: Position index contiguity validation

**Problem:** `PlaylistService.savePlaylist` accepts any `position_index` values (e.g., `[0, 2, 5]`), which the UI assumes are contiguous starting at 0.

**Files to read first:**
- `backend/src/main/java/com/meditation/backend/playlist/PlaylistService.java` — find `savePlaylist` and any `validateRequest` helper
- `backend/src/main/java/com/meditation/backend/playlist/PlaylistUpsertRequest.java`
- `backend/src/main/java/com/meditation/backend/playlist/PlaylistItemUpsertRequest.java`

**Changes:**

In `PlaylistService.validateRequest` (or wherever items are validated), add a contiguity check after reading the items list:

```java
// Validate that position indices are exactly 0, 1, 2, ... in order
List<Integer> positions = items.stream()
    .map(PlaylistItemUpsertRequest::positionIndex) // adjust to actual field name
    .sorted()
    .toList();
for (int i = 0; i < positions.size(); i++) {
    if (positions.get(i) != i) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
            "Playlist item position indices must be contiguous starting at 0.");
    }
}
```

---

## B-L12: Maven wrapper

**Problem:** `mvnw` is absent. Builds require whatever version of Maven is installed on the machine. A wrapper pins the version and makes CI builds reproducible.

**Changes:**

From the `backend/` directory, run:
```
mvn wrapper:wrapper
```

This generates `mvnw`, `mvnw.cmd`, and `.mvn/wrapper/maven-wrapper.properties`. Commit all three files. Add `.mvn/wrapper/maven-wrapper.jar` to `.gitignore` if it is generated (modern Maven wrapper plugin generates a shell-only wrapper without a jar; confirm by checking what is generated).

---

## Verification

From `backend/`:
1. Run `./mvnw test` (or `mvn test` if the wrapper is generated last).
2. All existing tests must pass — pay particular attention to `GlobalExceptionHandlerTest`, `CustomPlayControllerTest`, `PlaylistControllerTest`, `SankalpaControllerTest`, `TimerSettingsControllerTest`.
3. Confirm that a request with `durationMinutes: -1` to `PUT /api/custom-plays/{id}` returns 400.
4. Confirm that `DELETE /api/custom-plays/nonexistent` returns 204.
5. Confirm that `DELETE /api/custom-plays/nonexistent` called twice still returns 204.
6. Confirm that Flyway migrations run cleanly (the test suite runs them on H2 in-memory).

## After finishing

Commit all changes on branch `review-fixes` with a message like:
```
fix(backend): validation, schema guards, and config fixes (B-H6, B-H9, B-M1, B-M3, B-M12, B-M13, B-L1, B-L5, B-L8, B-L10, B-L12)
```
