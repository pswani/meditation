# Session P — Cross-Cutting: CI Coverage, Dependency Scanning & Documentation

## Context

Meditation app — full-stack repo at the working root.
Working branch: `review-fixes`. Session O addresses repo hygiene. This session addresses CI gaps, dependency scanning, structured logging, and documentation accuracy from `CODE-REVIEW-2026-04-24.md`.

Build commands:
- Web + backend: `./scripts/pipeline.sh verify` (from repo root)
- iOS Core: `swift test --package-path ios-native`

**Issues addressed (7 total):**
- X-H5: Sync contract consumed by three generators — CI must verify all three stay in sync
- X-H6: No runtime contract validation on iOS (web covered by Session K W-L13, backend by Session E @Valid)
- X-M2: 1,227-line README drifts from code reality
- X-M3: iOS CI only builds, does not run tests
- X-M4: No dependency vulnerability scanning
- X-M6: Logging is unstructured across backend, frontend, and iOS
- X-M9: `docs/architecture.md` accuracy check

**Already fixed in other sessions — do NOT re-implement:**
- X-M7: Maven wrapper — Session E
- X-M8: `docs/web-offline-policy.md` — Session J
- X-H6 web: Zod runtime validation — Session K (W-L13)
- X-H6 backend: `@Valid` annotations — Session E; GlobalExceptionHandler already exists
- W-L15: CI diff-check for generated files — Session K (includes JS+Java+Swift via single generate script)

---

## X-H5: Verify CI sync-contract check covers all three tiers

**Problem:** `contracts/sync-contract.json` is the canonical source. `scripts/generate-sync-contract.mjs` generates TypeScript, Java, and Swift outputs. CI must fail if any generated file drifts from the source.

**Files to read first:**
- `scripts/generate-sync-contract.mjs` — confirm it writes all three files (TS, Java, Swift)
- `scripts/pipeline.sh` — find the `npm run generate:sync-contract` + `git diff --exit-code` step
- `.github/workflows/ci.yml` — understand which CI job runs pipeline.sh verify

**Changes:**

1. Read `generate-sync-contract.mjs` and confirm it writes:
   - `src/generated/syncContract.ts`
   - `backend/src/main/java/com/meditation/backend/sync/GeneratedSyncContract.java`
   - `ios-native/Sources/MeditationNativeCore/Domain/GeneratedSyncContract.swift`

2. In `scripts/pipeline.sh` verify step, confirm the `git diff --exit-code` check covers all three paths (not just `src/generated/`):
   ```sh
   npm run generate:sync-contract
   git diff --exit-code src/generated/ backend/src/main/java/com/meditation/backend/sync/GeneratedSyncContract.java ios-native/Sources/MeditationNativeCore/Domain/GeneratedSyncContract.swift
   ```
   If the current `git diff --exit-code` is unscoped (checks all files), it already works — document that in a comment. If it is scoped only to `src/generated/`, widen it.

3. In `.github/workflows/ci.yml`, the ubuntu `verify` job runs `pipeline.sh verify` which covers web + backend + Swift generated files. Add a comment in the CI file explaining this:
   ```yaml
   # pipeline.sh verify runs generate:sync-contract and git diff --exit-code,
   # which covers all three generated tiers (TS, Java, Swift).
   ```

4. If the Swift generated file is NOT checked by the ubuntu job (because `git diff --exit-code` is scoped), add a step to the iOS job:
   ```yaml
   - name: Verify generated sync contract (Swift)
     run: |
       node scripts/generate-sync-contract.mjs
       git diff --exit-code ios-native/Sources/MeditationNativeCore/Domain/GeneratedSyncContract.swift
   ```

---

## X-H6: iOS Decodable contract validation with clear error messages

**Problem:** iOS decodes API responses via `Codable`. When the backend returns an unexpected shape, the Swift decoder throws a generic `DecodingError` with no context about which field failed or which endpoint was called.

**Files to read first:**
- Find where iOS makes API calls and decodes JSON responses — likely in `ios-native/Sources/MeditationNativeCore/Services/` (look for `URLSession` usage or a network client file)
- `ios-native/Sources/MeditationNativeCore/Domain/GeneratedSyncContract.swift` — understand the generated types

**Changes:**

1. Find the iOS networking layer (the function that calls `JSONDecoder().decode(...)`). Add a helper that wraps `DecodingError` with context:

```swift
extension JSONDecoder {
    func decodeWithContext<T: Decodable>(_ type: T.Type, from data: Data, endpoint: String) throws -> T {
        do {
            return try decode(type, from: data)
        } catch let error as DecodingError {
            throw AppSyncError.contractMismatch(endpoint: endpoint, underlying: error.debugDescription)
        }
    }
}
```

2. Add `contractMismatch(endpoint: String, underlying: String)` to the app's error enum (find it in the Core package — likely `AppSyncError` or similar).

3. Replace all `JSONDecoder().decode(SomeType.self, from: data)` calls in the networking layer with `decoder.decodeWithContext(SomeType.self, from: data, endpoint: "/api/...")`.

4. Log contract mismatches at `.fault` level so they appear in Console.app:
   ```swift
   case .contractMismatch(let endpoint, let underlying):
       logger.fault("Contract mismatch at \(endpoint, privacy: .public): \(underlying, privacy: .public)")
   ```

---

## X-M3: Fix iOS CI to run tests (not just build)

**Problem:** `.github/workflows/ci.yml` `ios-native` job runs `xcodebuild build` but not `xcodebuild test`. iOS regressions are only caught by `swift test` (Core package), not the app target tests.

**Files to read first:**
- `.github/workflows/ci.yml` — the full `ios-native` job
- `ios-native/MeditationNativeTests/` — confirm the test scheme name
- `ios-native/MeditationNative.xcodeproj/` — find the available schemes

**Changes:**

In `.github/workflows/ci.yml`, replace the `ios-native` job's build step with a test step:

```yaml
ios-native:
  name: iOS Native Verify
  runs-on: macos-15
  steps:
    - name: Check out repository
      uses: actions/checkout@v4

    - name: Run Swift package tests
      run: swift test --package-path ios-native

    - name: Build and test iOS app target
      run: |
        xcodebuild test \
          -project ios-native/MeditationNative.xcodeproj \
          -scheme MeditationNative \
          -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.4' \
          CODE_SIGNING_ALLOWED=NO \
          | xcpretty || true
        # Re-run without xcpretty to capture raw exit code
        xcodebuild test \
          -project ios-native/MeditationNative.xcodeproj \
          -scheme MeditationNative \
          -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.4' \
          CODE_SIGNING_ALLOWED=NO
```

Note: `xcpretty` improves readability but can swallow the exit code; the double-run pattern ensures CI fails correctly. Alternatively, use `set -o pipefail` before the xcpretty pipe.

Better pattern with pipefail:
```yaml
    - name: Build and test iOS app target
      run: |
        set -o pipefail
        xcodebuild test \
          -project ios-native/MeditationNative.xcodeproj \
          -scheme MeditationNative \
          -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.4' \
          CODE_SIGNING_ALLOWED=NO \
          | xcpretty
```

Read the current `ios-native` job carefully — if it already uses `macos-latest`, update the runner to `macos-15` which ships Xcode 16 and iOS 18 simulators. Check what simulator names are available on `macos-15` and use the correct one.

---

## X-M4: Add dependency vulnerability scanning

**Problem:** No Dependabot config, no `npm audit` in CI, no OWASP dependency-check for Maven.

**Files to read first:**
- `.github/workflows/ci.yml` — find the verify job where to add npm audit
- `backend/pom.xml` — confirm Maven structure for OWASP plugin
- Check if `.github/dependabot.yml` exists

**Changes:**

1. Create `.github/dependabot.yml`:
   ```yaml
   version: 2
   updates:
     - package-ecosystem: npm
       directory: "/"
       schedule:
         interval: weekly
       open-pull-requests-limit: 5

     - package-ecosystem: maven
       directory: "/backend"
       schedule:
         interval: weekly
       open-pull-requests-limit: 5

     - package-ecosystem: github-actions
       directory: "/"
       schedule:
         interval: monthly
   ```

2. In `.github/workflows/ci.yml`, in the `verify` job after `npm ci`, add:
   ```yaml
   - name: npm audit (production dependencies)
     run: npm audit --audit-level=high --omit=dev
     continue-on-error: true  # Don't block on advisories yet; review findings
   ```
   Start with `continue-on-error: true` so you can review the initial audit output before blocking CI.

3. Add OWASP dependency-check to `backend/pom.xml` in the `<plugins>` section under `<build>`:
   ```xml
   <plugin>
     <groupId>org.owasp</groupId>
     <artifactId>dependency-check-maven</artifactId>
     <version>10.0.3</version>
     <configuration>
       <failBuildOnCVSS>9</failBuildOnCVSS>
       <suppressionFile>${project.basedir}/../.owasp-suppressions.xml</suppressionFile>
     </configuration>
   </plugin>
   ```

4. Create an empty suppressions file `backend/.owasp-suppressions.xml`:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <suppressions xmlns="https://jeremylong.github.io/DependencyCheck/dependency-suppression.1.3.xsd">
     <!-- Add CVE suppressions here with justification comments -->
   </suppressions>
   ```

5. Add to the CI verify job (run weekly, not on every PR — OWASP check is slow):
   ```yaml
   - name: OWASP dependency check (backend)
     if: github.event_name == 'schedule'
     run: |
       cd backend
       ./mvnw org.owasp:dependency-check-maven:check
   ```
   Add a `schedule:` trigger to the workflow for weekly runs:
   ```yaml
   on:
     pull_request:
     push:
     schedule:
       - cron: '0 6 * * 1'  # Every Monday at 06:00 UTC
   ```

---

## X-M6: Structured logging

**Problem:** Backend uses default Spring logging; frontend uses `console.warn`; iOS uses `print`. For operability, structured logging improves log analysis.

**Note on scope:** Full log aggregation infrastructure is out of scope for a single-user Mac mini. The goal here is to ensure log output is structured (JSON) so that `tail -F | jq` works, and to eliminate `print()` in iOS in favor of `Logger`.

### Backend: Logback JSON encoder

**Files to read first:**
- `backend/src/main/resources/logback-spring.xml` — check if it exists
- `backend/pom.xml` — check if `logstash-logback-encoder` is already a dependency

**Changes:**

1. Add to `backend/pom.xml` `<dependencies>`:
   ```xml
   <dependency>
     <groupId>net.logstash.logback</groupId>
     <artifactId>logstash-logback-encoder</artifactId>
     <version>7.4</version>
   </dependency>
   ```

2. Create `backend/src/main/resources/logback-spring.xml`:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <configuration>
     <springProfile name="prod">
       <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
         <encoder class="net.logstash.logback.encoder.LogstashEncoder"/>
       </appender>
       <root level="INFO">
         <appender-ref ref="JSON"/>
       </root>
     </springProfile>

     <springProfile name="!prod">
       <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
         <encoder>
           <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
         </encoder>
       </appender>
       <root level="INFO">
         <appender-ref ref="CONSOLE"/>
       </root>
     </springProfile>
   </configuration>
   ```

   This enables JSON logging only in `prod` profile (where `tail | jq` is useful) and keeps human-readable output for dev.

### Frontend: Replace console.warn with a structured error sink

**Files to read first:**
- `src/utils/apiClient.ts` — find `console.warn` and `console.error` calls
- `src/features/timer/syncQueue.ts` — find `console.warn` calls for sync failures
- Search broadly: `grep -rn "console\.warn\|console\.error" src/ | grep -v "\.test\."` to find all instances

**Changes:**

1. Create `src/utils/errorSink.ts`:
   ```ts
   type ErrorContext = Record<string, unknown>;

   export function reportError(message: string, context?: ErrorContext): void {
     // Structured output: JSON lines when not in interactive console
     const entry = { level: 'error', message, ...context, ts: new Date().toISOString() };
     console.error(JSON.stringify(entry));
   }

   export function reportWarning(message: string, context?: ErrorContext): void {
     const entry = { level: 'warn', message, ...context, ts: new Date().toISOString() };
     console.warn(JSON.stringify(entry));
   }
   ```

2. Replace the 3–5 most important `console.warn` calls in `syncQueue.ts` and `apiClient.ts` with `reportWarning`/`reportError`. Do not attempt to replace every console call — focus on sync failure paths and API error paths where structured context (URL, status code, retry count) is valuable.

### iOS: Replace print() with Logger

**Files to read first:**
- Search for `print(` in `ios-native/MeditationNative/` and `ios-native/Sources/MeditationNativeCore/` to find all occurrences:
  ```bash
  grep -rn "^\s*print(" ios-native/
  ```

**Changes:**

1. For each `print(...)` call in production code (not tests), replace with `Logger`:
   ```swift
   import OSLog
   private let logger = Logger(subsystem: "com.meditation.native", category: "sync")

   // Before:
   print("AppSyncService: enqueued \(mutation.domain)")

   // After:
   logger.debug("AppSyncService: enqueued \(mutation.domain, privacy: .public)")
   ```

2. Do not replace `print()` in test files — `print()` in tests is fine for debugging.

3. Use the subsystem `"com.meditation.native"` consistently (established in Session L).

---

## X-M2: README restructure

**Problem:** The README is 1,227 lines and mixes current state, future plans, and operational details. New contributors get a misleading picture.

**Files to read first:**
- `README.md` — read the full file to understand its current sections
- `docs/README.md` — understand what's already in docs

**Changes:**

The goal is to make `README.md` accurate and brief — not to do a full rewrite. Focus on:

1. **Remove or clearly mark aspirational items.** Scan for bullet points describing things that don't exist yet (e.g., features marked as "planned", "will be", "future"). Either delete them or move them to `PLANS.md`.

2. **Remove stale "what changed" entries** that belong in a changelog, not a README. If there is a section like "Recent changes" or a bullet list of recent additions, remove it — that's what `git log` is for.

3. **Trim the "Current Status" section** to facts verifiable by reading the code. Remove any bullet that could not be confirmed by a new contributor reading the repo today.

4. **Add a "Docs index"** near the top pointing to:
   - `docs/mac-mini-production-runbook.md`
   - `docs/architecture.md`
   - `PLANS.md`
   - `AGENTS.md`

5. **Target: under 400 lines.** Do not try to perfect prose — just cut what is redundant or aspirational. A shorter, accurate README is better than a long, partially-correct one.

Read the full README before making changes. Do not delete sections that contain accurate, useful information for a new contributor (build instructions, toolchain baseline, workspace entry points).

---

## X-M9: Verify `docs/architecture.md` accuracy

**Problem:** The review warns that `docs/architecture.md` may claim more than the code delivers — specifically around DDD or hexagonal architecture patterns.

**Files to read first:**
- `docs/architecture.md` — read the full file (240 lines)
- `backend/src/main/java/com/meditation/backend/` — scan the package structure to understand the actual architecture

**Changes:**

1. Read the full `docs/architecture.md`.

2. For each architectural claim, verify it against the actual code:
   - If the doc says "hexagonal / ports-and-adapters": check if there are actual port interfaces separating domain from infrastructure. If not (typical Spring Boot CRUD structure), change the claim to accurately describe the layered approach used.
   - If the doc says "domain-driven design": check if there are bounded contexts, aggregates, or domain events. If not, remove or soften the claim.
   - If the doc describes features or patterns that don't exist in the code, remove or mark as "planned".

3. Add an accuracy date at the top of the file:
   ```markdown
   > Architecture as of April 2026. Update this document when the runtime shape changes.
   ```

4. The doc should describe what the code IS, not what it aspires to be. Keep the "Recommended production topology" section — it's accurate and useful.

---

## Verification

1. Run `./scripts/pipeline.sh verify` — passes, including the sync-contract diff check.
2. Run `swift test --package-path ios-native` — Core package tests pass.
3. Run `cat .github/dependabot.yml` — Dependabot config present.
4. Run `npm audit --omit=dev 2>&1 | tail -5` — audit runs (findings OK for now).
5. Run `wc -l README.md` — line count reduced from 1,227.
6. Run `cat docs/architecture.md` — no aspirational claims that misrepresent the codebase.

## After finishing

Commit on branch `review-fixes`:
```
fix(ci): iOS tests in CI, Dependabot, structured logging, README trim, and contract validation (X-H5, X-H6, X-M2, X-M3, X-M4, X-M6, X-M9)
```
