# Session F — Backend: Data Quality & Service Hardening

## Context

This is a meditation app with a Spring Boot 3.3.4 / Java 21 backend.
Working branch: `review-fixes`. Session E covers validation, schema, and config changes. This session covers data quality and service-level correctness issues from `CODE-REVIEW-2026-04-24.md`.

Run `mvn test` (or `./mvnw test` after Session E adds the Maven wrapper) from `backend/` to verify changes.

**Issues addressed (9 total):**
- B-H2 + B-H3: V14 drops FKs without documented rationale; denormalized name fields have no refresh path
- B-M4: Float arithmetic on Sankalpa progress (should use BigDecimal)
- B-M5: `BigDecimal.stripTrailingZeros()` called before persist changes scale
- B-M10: Observance replace via delete-then-insert is not properly guarded
- B-M11: `external_id` on `PlaylistItemEntity` is mutable with no guard
- B-M14: Sankalpa `createdAt` is accepted blindly from the client request
- B-M15: No startup check that reference data was seeded
- B-L6: `Instant.parse` exception catching is scattered across service classes
- B-M2: `PlaylistService.listPlaylists` loads all items unbounded (no pagination)

---

## B-H2 + B-H3: Document V14/V16 FK rationale and snapshot design intent

**Problem:** `V14__drop_session_log_library_foreign_keys.sql` drops two FKs with no explanation.
Reviewers see the drop and conclude referential integrity was abandoned. `V16__restore_session_log_library_foreign_keys.sql` restores them with `ON DELETE SET NULL`, but the rationale is also undocumented. The `session_log` table denormalizes `customPlayName` and `playlistName` — it is not clear whether these are intentional point-in-time snapshots or a mistake.

**Files to read first:**
- `backend/src/main/resources/db/migration/V14__drop_session_log_library_foreign_keys.sql`
- `backend/src/main/resources/db/migration/V16__restore_session_log_library_foreign_keys.sql`
- `backend/src/main/java/com/meditation/backend/sessionlog/SessionLogService.java` — read the full save path to confirm snapshot fields are written at log time

**Changes:**

1. Add a header comment to `V14`:
   ```sql
   -- V14: Drop FKs temporarily so library items (custom plays, playlists) can be
   -- deleted without cascading hard-deletes into session_log. Restored in V16 with
   -- ON DELETE SET NULL, which nulls the FK column while preserving the name snapshot.
   -- See V10 for the denormalized name fields (custom_play_name, playlist_name) that
   -- serve as intentional point-in-time record of what was played.
   ```

2. Add a header comment to `V16`:
   ```sql
   -- V16: Restore referential integrity dropped in V14. FKs now use ON DELETE SET NULL
   -- so deleting a custom play or playlist nulls the FK column in session_log while
   -- leaving the name snapshot (custom_play_name, playlist_name) intact. This means
   -- historical logs retain the name of what was played even after the library item
   -- is deleted. The name fields are intentionally point-in-time and are NOT updated
   -- if the library item is renamed after the session was logged.
   ```

3. In `SessionLogService.java`, find the method that saves a session log and add a one-line comment above the line that sets `customPlayName` / `playlistName`, confirming the snapshot intent:
   ```java
   // Snapshot: capture name at log time; not updated if library item is renamed later.
   ```

---

## B-M4: BigDecimal for Sankalpa progress arithmetic

**Problem:** `SankalpaService` computes progress as a `double` division: `(double) progressValue / targetValue`. Floating-point representation errors cause percentages to fluctuate at boundary values (e.g., 0.9999... vs 1.0).

**Files to read first:**
- `backend/src/main/java/com/meditation/backend/sankalpa/SankalpaService.java` — search for the progress calculation (look for `progressValue`, `targetValue`, `Math.min`, ratio/percentage computation)
- `backend/src/main/java/com/meditation/backend/sankalpa/SankalpaProgressResponse.java` — check the type of the progress/percentage field

**Changes:**

In `SankalpaService`, replace `double` ratio computation with `BigDecimal`:

```java
import java.math.BigDecimal;
import java.math.RoundingMode;

// Replace: double ratio = Math.min((double) progressValue / targetValue, 1.0);
// With:
BigDecimal ratio = BigDecimal.valueOf(progressValue)
    .divide(targetValue, 4, RoundingMode.HALF_UP)
    .min(BigDecimal.ONE);
```

If `SankalpaProgressResponse` uses a `double` field for the ratio, change it to `BigDecimal`. Read the response type first to decide — if clients already parse it as a number and the field was always small (0.0–1.0), switching to `BigDecimal` on the response is fine since Jackson serializes it as a JSON number.

---

## B-M5: setScale instead of stripTrailingZeros before persist

**Problem:** `SankalpaService.java` calls `request.targetValue().stripTrailingZeros()` before passing the value to the entity. `stripTrailingZeros()` changes the `scale` of the `BigDecimal` (e.g., `1.00` → `1`, `0.50` → `5E-1`). If the column is `numeric(10,2)`, the JPA provider may reject or misstore values with an unexpected scale.

**File to read first:**
- `backend/src/main/java/com/meditation/backend/sankalpa/SankalpaService.java` — line ~108 where `stripTrailingZeros()` is called

**Change:**

Replace:
```java
request.targetValue().stripTrailingZeros()
```
With:
```java
request.targetValue().setScale(2, RoundingMode.HALF_UP)
```

Import `java.math.RoundingMode` if not already imported. This normalizes to exactly 2 decimal places matching the `numeric(10,2)` column definition.

---

## B-M10: Atomic observance replace

**Problem:** `SankalpaService.replaceObservanceEntries` does `deleteAllBySankalpaId(...)` then `saveAll(...)`. The surrounding `saveSankalpa` method is `@Transactional`, which means both operations are in the same transaction and will roll back together — but the code does not assert this, and the delete-then-insert pattern is fragile if the `@Transactional` annotation is ever moved.

**File to read first:**
- `backend/src/main/java/com/meditation/backend/sankalpa/SankalpaService.java` — find `replaceObservanceEntries` (around line 173)

**Changes:**

1. Add `@Transactional` directly to `replaceObservanceEntries` as a secondary guard (Spring will join the existing transaction if one is active, or create one if called in isolation):

   ```java
   @Transactional
   private void replaceObservanceEntries(
       String sankalpaId,
       List<SankalpaObservanceRecordPayload> observanceRecords,
       Instant mutationTimestamp
   ) {
   ```

2. Add a brief comment above the method:
   ```java
   // Delete-then-insert within a single transaction; rolls back together if saveAll fails.
   ```

---

## B-M11: Immutable guard on PlaylistItemEntity.externalId

**Problem:** `PlaylistItemEntity` exposes `externalId` via a public getter. There is no setter, which is good, but the constructor allows any value to be passed in. The concern is that the service layer could construct a new entity with a different `externalId` than what was generated during migration (V5: `concat('playlist-item-', id)`), accidentally changing stable client-facing IDs.

**Files to read first:**
- `backend/src/main/java/com/meditation/backend/playlist/PlaylistItemEntity.java`
- `backend/src/main/java/com/meditation/backend/playlist/PlaylistService.java` — find where `PlaylistItemEntity` is constructed, specifically whether `externalId` is passed from the request or generated

**Changes:**

1. In `PlaylistService`, confirm how `externalId` is assigned when creating a new item. If the service passes it from the client request:
   - Validate that `externalId` follows the expected format or is non-blank.
   - Add a check: if an existing item with the same `playlistId` + `externalId` is found, confirm the `externalId` matches before updating.

2. In `PlaylistItemEntity`, add a comment on the `externalId` field and constructor parameter to document that it must not be changed after creation:

   ```java
   // Stable client-facing ID; set at creation and never updated. See V5/V6 migrations.
   @Column(name = "external_id", nullable = false, length = 64, updatable = false)
   private String externalId;
   ```

   The `updatable = false` annotation tells Hibernate to never include this column in UPDATE statements, which prevents accidental overwrites even if the field is mutated in memory.

---

## B-M14: Clamp Sankalpa createdAt to server time

**Problem:** `SankalpaService.saveSankalpa` calls `parseTimestamp(request.createdAt(), ...)` and uses the client-supplied timestamp directly. A client with a wrong clock can shift the goal window (creation date determines deadline calculations).

**Files to read first:**
- `backend/src/main/java/com/meditation/backend/sankalpa/SankalpaService.java` — line ~84 where `createdAt` is parsed from the request
- `backend/src/main/java/com/meditation/backend/sync/SyncProperties.java` — check `clockSkewToleranceSeconds`

**Changes:**

In `SankalpaService.saveSankalpa`, after parsing `createdAt` from the request, clamp it to server time if the skew exceeds the configured tolerance:

```java
Instant createdAt = parseTimestamp(request.createdAt(), "Created at must be a valid ISO timestamp.");
// Clamp client-supplied createdAt to server time if the skew is unreasonable.
// Use the same clock-skew tolerance configured for sync (SyncProperties.clockSkewToleranceSeconds).
long skewSeconds = Math.abs(Duration.between(createdAt, now).getSeconds());
if (skewSeconds > syncProperties.getClockSkewToleranceSeconds()) {
    createdAt = now;
}
```

Inject `SyncProperties` via constructor. Import `java.time.Duration`. This uses the same 300 s default that `SyncClockSkewInterceptor` enforces on sync headers.

Note: Only apply clamping for NEW entities (`existingEntity == null`). For existing entities, `createdAt` is already taken from the stored entity and the client-supplied value is ignored.

---

## B-M15: Startup check for reference data

**Problem:** If Flyway V2 is skipped in a hand-rolled deploy, the app starts and serves empty reference lists. No startup check catches this.

**Files to read first:**
- `backend/src/main/java/com/meditation/backend/MeditationBackendApplication.java`
- `backend/src/main/java/com/meditation/backend/reference/ReferenceData.java` — check if there is a repository or it is a static class

**Changes:**

Create `backend/src/main/java/com/meditation/backend/config/ReferenceSeedGuard.java`:

```java
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
```

---

## B-L6: Centralize Instant.parse exception handling

**Problem:** Multiple service classes (`CustomPlayService`, `SessionLogService`, `SankalpaService`) each contain their own copy of the `try { Instant.parse(value) } catch (DateTimeParseException e) { throw ResponseStatusException(BAD_REQUEST) }` pattern. `SyncRequestSupport.parseOptionalSyncQueuedAt` already centralizes sync-header parsing; the same should be done for general timestamp parsing.

**Files to read first:**
- `backend/src/main/java/com/meditation/backend/sync/SyncRequestSupport.java`
- `backend/src/main/java/com/meditation/backend/customplay/CustomPlayService.java` — find `parseOptionalTimestamp`
- `backend/src/main/java/com/meditation/backend/sessionlog/SessionLogService.java` — find its timestamp parsing
- `backend/src/main/java/com/meditation/backend/sankalpa/SankalpaService.java` — find `parseTimestamp`

**Changes:**

1. In `SyncRequestSupport.java`, add two new static helpers:

   ```java
   public static Instant parseRequiredTimestamp(String value, String errorMessage) {
     if (value == null || value.isBlank()) {
       throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
     }
     try {
       return Instant.parse(value);
     } catch (DateTimeParseException e) {
       throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
     }
   }

   public static Instant parseOptionalTimestamp(String value, String errorMessage) {
     if (value == null || value.isBlank()) {
       return null;
     }
     try {
       return Instant.parse(value);
     } catch (DateTimeParseException e) {
       throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
     }
   }
   ```

2. Replace the local `parseTimestamp` / `parseOptionalTimestamp` methods in `CustomPlayService`, `SessionLogService`, and `SankalpaService` with calls to the new `SyncRequestSupport` helpers. Remove the now-redundant private methods from each service.

---

## B-M2: Pagination on PlaylistService.listPlaylists

**Problem:** `PlaylistService.listPlaylists` loads all playlists and all their items in a single unbounded query. For a user with many playlists, this causes a memory spike on every list call.

**Files to read first:**
- `backend/src/main/java/com/meditation/backend/playlist/PlaylistService.java` — find `listPlaylists`
- `backend/src/main/java/com/meditation/backend/playlist/PlaylistController.java` — find the GET endpoint for playlists
- `backend/src/main/java/com/meditation/backend/playlist/PlaylistRepository.java`
- `backend/src/main/java/com/meditation/backend/playlist/PlaylistResponse.java`

**Changes:**

Note: Playlists are a small collection in a personal meditation app (typically < 20). Adding a `Pageable` API requires a client-visible contract change. For this app, the pragmatic fix is to add a reasonable hard cap rather than full pagination.

In `PlaylistRepository`, add an overload:
```java
List<PlaylistEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);
```

In `PlaylistService.listPlaylists`:
```java
private static final int MAX_PLAYLISTS = 200;

public List<PlaylistResponse> listPlaylists() {
  List<PlaylistEntity> playlists = playlistRepository
      .findAllByOrderByCreatedAtDesc(PageRequest.of(0, MAX_PLAYLISTS));
  // ... rest unchanged
}
```

This is a non-breaking change — the controller signature and response format stay the same. It prevents unbounded growth without introducing a pagination API.

---

## Verification

From `backend/`:
1. Run `mvn test` — all tests must pass.
2. Confirm Flyway migrations run cleanly (V14 and V16 comments are non-functional, Flyway checksums still match since the comments are already part of the committed files — if Flyway uses checksums, add the comments in the migration files before first run, or create a `flyway.repair()` step if you encounter a checksum mismatch on an existing DB).
3. Confirm `SankalpaControllerTest` still passes with the BigDecimal and clamp changes.
4. Confirm the reference data guard logs correctly by checking the test logs — it should log "Reference data check passed: 5 meditation type(s) found."
5. Check that `PlaylistControllerTest` passes with the pagination cap change.

**Note on Flyway checksum:** If V14 and V16 have already been applied to a local H2 database, adding comments to those files will cause a Flyway checksum validation failure on the next run. The test suite uses an in-memory H2 with a fresh schema each run (from `application-test.yml`), so tests will still pass. On a running production DB, run `flyway repair` after adding the comments. Add a note in the migration file header: `-- Note: if flyway checksum fails after this comment was added, run flyway repair.`

## After finishing

Commit on branch `review-fixes`:
```
fix(backend): data quality, Sankalpa correctness, and service hardening (B-H2, B-H3, B-M2, B-M4, B-M5, B-M10, B-M11, B-M14, B-M15, B-L6)
```
