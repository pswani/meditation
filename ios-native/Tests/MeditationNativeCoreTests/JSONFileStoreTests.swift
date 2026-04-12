import Foundation
import Testing
@testable import MeditationNativeCore

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
