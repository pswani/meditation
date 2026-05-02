import Foundation
import Testing
#if canImport(MeditationNativeCore)
@testable import MeditationNativeCore
#else
@testable import MeditationNative
#endif

@Test func jsonFileStoreRoundTripsSnapshot() throws {
    let tempDirectory = FileManager.default.temporaryDirectory
        .appendingPathComponent(UUID().uuidString, isDirectory: true)
    let fileURL = tempDirectory.appendingPathComponent("snapshot.json")
    let store = JSONFileStore<AppSnapshot>(fileURL: fileURL)

    try store.save(SampleData.snapshot)
    let loaded = try store.load()

    #expect(loaded == SampleData.snapshot)
}

@Test func repositorySeedsWhenNoFileExists() throws {
    let tempDirectory = FileManager.default.temporaryDirectory
        .appendingPathComponent(UUID().uuidString, isDirectory: true)
    let fileURL = tempDirectory.appendingPathComponent("snapshot.json")
    let repository = LocalAppSnapshotRepository(
        store: JSONFileStore<AppSnapshot>(fileURL: fileURL),
        environment: .localOnly
    )

    let snapshot = try repository.loadOrSeed(seed: SampleData.snapshot)

    #expect(snapshot == SampleData.snapshot)
    #expect(FileManager.default.fileExists(atPath: fileURL.path))
}

@Test func decodesLegacyV1SnapshotWithoutVersionField() throws {
    let json = """
    {
        "timerDraft": { "mode": "fixed-duration", "durationMinutes": 20 },
        "recentSessionLogs": [],
        "customPlays": [],
        "playlists": [],
        "sankalpas": []
    }
    """
    let data = try #require(json.data(using: .utf8))
    let snapshot = try JSONDecoder().decode(AppSnapshot.self, from: data)
    #expect(snapshot.version == AppSnapshot.currentVersion)
    #expect(snapshot.recentSessionLogs.isEmpty)
}

@Test func decodesLegacyAppSyncStateWithoutVersionOrNewFields() throws {
    let json = """
    {
        "connectionState": "pending-sync",
        "pendingMutations": [],
        "lastAttemptedSyncAt": null,
        "lastSuccessfulSyncAt": null
    }
    """
    let data = try #require(json.data(using: .utf8))
    let state = try JSONDecoder().decode(AppSyncState.self, from: data)
    #expect(state.version == AppSyncState.currentVersion)
    #expect(state.mutationQueueOverflowed == false)
    #expect(state.needsFullResync == false)
}
