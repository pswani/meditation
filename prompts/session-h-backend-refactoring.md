# Session H — Backend: SankalpaService Refactoring & Concurrent Sync Test

## Context

This is a meditation app with a Spring Boot 3.3.4 / Java 21 backend.
Working branch: `review-fixes`. Sessions E–G address quick fixes and infrastructure. This session tackles two larger structural items from `CODE-REVIEW-2026-04-24.md` that require deeper reading before coding.

Run `./mvnw test` from `backend/` to verify. This session will take more time than E–G — read the full `SankalpaService` before writing any code.

**Issues addressed (2):**
- B-H11: `SankalpaService` is a 700-line god class — extract domain sub-objects
- B-M17: No test for concurrent sync — two simultaneous PUTs should produce one winner (stale detection)

These two changes are independent. Do B-M17 first (it is smaller and tests existing behavior before you restructure the class it tests).

---

## B-M17: Concurrent sync test for CustomPlay upsert

**Problem:** The sync protocol's stale-write detection is the backbone of multi-client consistency. There is no test confirming that two simultaneous `PUT` requests produce exactly one winner and one stale response.

**Context:** `SyncClockSkewInterceptor` enforces clock skew. `SyncRequestSupport.isStaleMutation` compares `existingUpdatedAt` to the client-supplied `X-Meditation-Sync-Queued-At` header. The winner is whichever request has the later `syncQueuedAt` value relative to the stored `updatedAt`.

### Files to read first

- `backend/src/test/java/com/meditation/backend/customplay/CustomPlayControllerTest.java` — read the full file to understand existing test patterns and the `application-test.yml` clock skew setting (`9999999999` seconds, i.e., never reject for clock skew)
- `backend/src/main/java/com/meditation/backend/sync/SyncRequestSupport.java` — understand `isStaleMutation`
- `backend/src/main/java/com/meditation/backend/customplay/CustomPlayController.java`
- `backend/src/main/resources/application-test.yml`

### Changes

Add a new test class `backend/src/test/java/com/meditation/backend/customplay/CustomPlayConcurrentSyncTest.java`:

```java
package com.meditation.backend.customplay;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CustomPlayConcurrentSyncTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private CustomPlayRepository customPlayRepository;

  private static final String CP_ID = "cp-concurrent-test";
  private static final String MEDIA_ASSET_ID = "media-vipassana-sit-20"; // seeded in V2

  @BeforeEach
  void cleanUp() {
    customPlayRepository.deleteAll();
  }

  @Test
  void concurrentPutsYieldOneAppliedAndOneStaleMutation() throws Exception {
    // Seed the custom play with an initial state so both concurrent requests see an
    // existing entity and must compete via stale-write detection.
    Instant seedTime = Instant.parse("2026-01-01T10:00:00Z");
    performPut(CP_ID, "Initial Play", seedTime.toString());

    // Two clients try to update simultaneously, each with their own syncQueuedAt.
    // Client A's syncQueuedAt is earlier → its PUT should be rejected as stale once
    // Client B's has been applied (or vice versa, depending on race outcome).
    Instant clientATime = Instant.parse("2026-01-01T10:01:00Z");
    Instant clientBTime = Instant.parse("2026-01-01T10:02:00Z"); // B is later → B should win

    CountDownLatch startLatch = new CountDownLatch(1);
    ExecutorService executor = Executors.newFixedThreadPool(2);

    Future<MockHttpServletResponse> futureA = executor.submit(() -> {
      startLatch.await();
      return performPut(CP_ID, "Updated by A", clientATime.toString());
    });

    Future<MockHttpServletResponse> futureB = executor.submit(() -> {
      startLatch.await();
      return performPut(CP_ID, "Updated by B", clientBTime.toString());
    });

    startLatch.countDown();

    MockHttpServletResponse responseA = futureA.get();
    MockHttpServletResponse responseB = futureB.get();
    executor.shutdown();

    // One response must have X-Meditation-Sync-Result: applied, the other: stale.
    List<String> outcomes = List.of(
        responseA.getHeader("X-Meditation-Sync-Result"),
        responseB.getHeader("X-Meditation-Sync-Result")
    );

    assertThat(outcomes).containsExactlyInAnyOrder("applied", "stale");

    // The stored entity must reflect the winner (B, which has the later syncQueuedAt).
    CustomPlayEntity stored = customPlayRepository.findById(CP_ID).orElseThrow();
    assertThat(stored.getUpdatedAt()).isEqualTo(clientBTime);
  }

  private MockHttpServletResponse performPut(String id, String name, String syncQueuedAt)
      throws Exception {
    return mockMvc.perform(
            MockMvcRequestBuilders.put("/api/custom-plays/" + id)
                .contentType(APPLICATION_JSON)
                .header("X-Meditation-Sync-Queued-At", syncQueuedAt)
                .content("""
                    {
                      "id": "%s",
                      "name": "%s",
                      "meditationType": "Vipassana",
                      "durationMinutes": 20,
                      "startSound": "None",
                      "endSound": "Temple Bell",
                      "mediaAssetId": "%s",
                      "recordingLabel": null,
                      "favorite": false
                    }
                    """.formatted(id, name, MEDIA_ASSET_ID)))
        .andReturn()
        .getResponse();
  }
}
```

**Notes on the test design:**
- The test seeds an initial entity so both concurrent requests see `existingEntity != null` and stale-write detection activates.
- Client B's `syncQueuedAt` is 1 minute later than A's. Whichever PUT runs second will see the entity already updated with the winner's timestamp and return `stale`.
- Because the two requests race, the exact winner depends on thread scheduling. The assertion checks `containsExactlyInAnyOrder("applied", "stale")` rather than pinning which client wins.
- The final state assertion (`stored.getUpdatedAt()` = `clientBTime`) only holds if B wins. If A wins first and B's later timestamp makes it the "applied" one, adjust the assertion. Read `SyncRequestSupport.isStaleMutation` carefully: if `syncQueuedAt` is *after* `existingUpdatedAt`, the mutation is NOT stale. So B (with the later timestamp) will never be stale — it will always win if A runs first. If B runs first, A arrives and sees B's timestamp; A's `syncQueuedAt` (clientATime = 10:01) < B's `updatedAt` (10:02) → A is stale. Either way B's data ends up stored. The final assertion is therefore deterministic.

---

## B-H11: Extract SankalpaService sub-classes

**Problem:** `SankalpaService` is ~700 lines mixing timezone math, cadence calculation, observance-entry maintenance, progress projection, and sync reconciliation. It is the hardest file to reason about and the first place new Sankalpa bugs land.

**Goal:** Extract three focused helper classes, keeping `SankalpaService` as the coordinator. Each extracted class should be independently testable. Do NOT change any behavior — this is a refactor only.

### Files to read first (read ALL of these before writing any code)

- `backend/src/main/java/com/meditation/backend/sankalpa/SankalpaService.java` — read the full file
- `backend/src/main/java/com/meditation/backend/sankalpa/SankalpaGoalEntity.java`
- `backend/src/main/java/com/meditation/backend/sankalpa/SankalpaObservanceEntryEntity.java`
- `backend/src/main/java/com/meditation/backend/sankalpa/SankalpaGoalUpsertRequest.java`
- `backend/src/main/java/com/meditation/backend/sankalpa/SankalpaProgressResponse.java`
- `backend/src/main/java/com/meditation/backend/sankalpa/SankalpaObservanceDayResponse.java`
- `backend/src/main/java/com/meditation/backend/sankalpa/SankalpaRecurringWeekResponse.java`
- `backend/src/test/java/com/meditation/backend/sankalpa/SankalpaControllerTest.java` — understand what is already tested

### Extraction plan

After reading the full `SankalpaService`, identify and extract these three concerns:

#### 1. `SankalpaCadencePolicy` (new class in `sankalpa/`)

**Responsibility:** Pure, stateless calculation of whether a Sankalpa is on track, what its deadline is, and what the current progress value is given a goal type, cadence, and session log data.

Look for methods in `SankalpaService` that:
- Compute `progressValue` from session logs (duration-based, session-count-based)
- Determine if a goal is complete
- Calculate deadlines from `days` and `createdAt`
- Handle `qualifyingDaysPerWeek` (weekly cadence) cutoff logic

Extract these into `SankalpaCadencePolicy` as static or package-private methods. Make them accept plain values (no entity dependencies) so they can be unit-tested without a database.

#### 2. `SankalpaObservanceRecalculator` (new class in `sankalpa/`)

**Responsibility:** Given a list of `SankalpaObservanceRecordPayload` items, produce `SankalpaObservanceEntryEntity` instances to persist. Handles the delete-and-replace logic (currently in `replaceObservanceEntries`).

Extract `replaceObservanceEntries` and any helper methods that map observance payloads to entities.

#### 3. `SankalpaProgressProjector` (new class in `sankalpa/`)

**Responsibility:** Given a `SankalpaGoalEntity`, a list of `SankalpaObservanceEntryEntity` items, an `Instant` (now), and a `ZoneId`, produce a `SankalpaProgressResponse`. This is the `toProgressResponse` method and all its helper methods (`toObservanceDayResponse`, `toRecurringWeekResponse`, etc.).

#### SankalpaService after extraction

`SankalpaService` becomes a coordinator:
- Delegates progress calculation to `SankalpaProgressProjector`
- Delegates cadence/deadline logic to `SankalpaCadencePolicy`
- Delegates observance persistence to `SankalpaObservanceRecalculator`
- Retains all `@Transactional` boundaries, repository access, and sync-protocol handling

### Implementation steps

1. Create `SankalpaProgressProjector` first (it has no dependencies on the other two). Move `toProgressResponse` and all its private helper methods into it. Inject it into `SankalpaService` via constructor. Run tests after this step — they must all pass before proceeding.

2. Create `SankalpaCadencePolicy` with static methods for progress and deadline calculations. Replace calls in `SankalpaProgressProjector` (and any remaining in `SankalpaService`) with `SankalpaCadencePolicy.calculateProgress(...)` etc. Run tests.

3. Create `SankalpaObservanceRecalculator` with a method `replace(sankalpaId, records, timestamp, repository)` or equivalent. Move `replaceObservanceEntries` into it. Run tests.

4. Confirm `SankalpaService` is now under 250 lines. If it is still larger, re-read it for more extraction opportunities.

### New unit tests

After extraction, add a test class for `SankalpaCadencePolicy`:

```java
// backend/src/test/java/com/meditation/backend/sankalpa/SankalpaCadencePolicyTest.java
// Test each cadence calculation with known inputs:
// - duration-based: 5/10 sessions complete → progress = 50%
// - session-count-based: 3/5 sessions → progress = 60%
// - observance-based: 4 observed + 1 missed out of 7 days → depends on your policy
// - weekly cadence: qualifying_days_per_week = 3, week has 2 sessions → not qualifying
// Use concrete Instant/ZoneId values so tests are deterministic.
```

---

## Verification

From `backend/`:
1. Run `./mvnw test` — ALL existing tests must pass (especially `SankalpaControllerTest`).
2. `CustomPlayConcurrentSyncTest` must pass consistently (run it 5 times to check for flakiness: `mvn test -Dtest=CustomPlayConcurrentSyncTest -pl . -Dsurefire.failIfNoSpecifiedTests=false`).
3. Confirm `SankalpaService` is ≤ 300 lines after extraction.
4. Confirm `SankalpaProgressProjector`, `SankalpaCadencePolicy`, `SankalpaObservanceRecalculator` are each ≤ 200 lines.
5. Run `./mvnw test -Dtest=SankalpaCadencePolicyTest` to confirm the new policy tests run in isolation.

## After finishing

Commit on branch `review-fixes` (two commits is fine — one for the concurrent test, one for the refactoring):

```
test(backend): add concurrent sync test for CustomPlay upsert (B-M17)
refactor(backend): extract SankalpaCadencePolicy, SankalpaProgressProjector, SankalpaObservanceRecalculator from SankalpaService (B-H11)
```
