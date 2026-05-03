import Foundation

public protocol FileStore {
    associatedtype Value: Codable & Equatable & Sendable

    func load() throws -> Value?
    func save(_ value: Value) throws
}

public struct JSONFileStore<Value: Codable & Equatable & Sendable>: FileStore {
    public let fileURL: URL
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder

    public init(
        fileURL: URL,
        encoder: JSONEncoder = JSONEncoder(),
        decoder: JSONDecoder = JSONDecoder()
    ) {
        self.fileURL = fileURL
        self.encoder = encoder
        self.decoder = decoder
        self.encoder.outputFormatting = [.prettyPrinted, .sortedKeys]

        let fractionalFormatter = ISO8601DateFormatter()
        fractionalFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let wholeSecondFormatter = ISO8601DateFormatter()

        self.encoder.dateEncodingStrategy = .custom { date, encoder in
            var container = encoder.singleValueContainer()
            try container.encode(fractionalFormatter.string(from: date))
        }
        self.decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let string = try container.decode(String.self)
            if let date = fractionalFormatter.date(from: string) { return date }
            if let date = wholeSecondFormatter.date(from: string) { return date }
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Invalid ISO 8601 date: \(string)"
            )
        }
    }

    public func load() throws -> Value? {
        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            return nil
        }

        let data = try Data(contentsOf: fileURL)
        return try decoder.decode(Value.self, from: data)
    }

    public func save(_ value: Value) throws {
        let parentDirectory = fileURL.deletingLastPathComponent()
        try FileManager.default.createDirectory(
            at: parentDirectory,
            withIntermediateDirectories: true,
            attributes: nil
        )
        let data = try encoder.encode(value)
        try data.write(to: fileURL, options: .atomic)
    }
}

/// Wraps both AppSnapshot and AppSyncState in a single file so they are written atomically.
/// Phase 1: written alongside the individual files as a belt-and-suspenders guard against
/// cross-file inconsistency. Phase 2 will remove the individual files once proven stable.
public struct CombinedAppState: Codable, Equatable, Sendable {
    public var snapshot: AppSnapshot
    public var syncState: AppSyncState
    public var version: Int

    public init(snapshot: AppSnapshot, syncState: AppSyncState) {
        self.snapshot = snapshot
        self.syncState = syncState
        self.version = 1
    }
}

public final class CombinedAppStateStore {
    private let store: JSONFileStore<CombinedAppState>

    public init(store: JSONFileStore<CombinedAppState>) {
        self.store = store
    }

    public func save(snapshot: AppSnapshot, syncState: AppSyncState) throws {
        try store.save(CombinedAppState(snapshot: snapshot, syncState: syncState))
    }

    public func load() throws -> CombinedAppState? {
        try store.load()
    }

    public static func live(fileManager: FileManager = .default) -> CombinedAppStateStore {
        let applicationSupportDirectory = fileManager.urls(
            for: .applicationSupportDirectory,
            in: .userDomainMask
        ).first ?? fileManager.temporaryDirectory
        let storeURL = applicationSupportDirectory
            .appendingPathComponent("MeditationNative", isDirectory: true)
            .appendingPathComponent("combined-state.json")

        return CombinedAppStateStore(store: JSONFileStore<CombinedAppState>(fileURL: storeURL))
    }
}

public struct LocalAppSnapshotRepository {
    private let store: JSONFileStore<AppSnapshot>
    public let environment: AppEnvironment

    public init(store: JSONFileStore<AppSnapshot>, environment: AppEnvironment) {
        self.store = store
        self.environment = environment
    }

    public func loadOrSeed(seed: @autoclosure () -> AppSnapshot) throws -> AppSnapshot {
        if let existing = try store.load() {
            return existing
        }

        let seeded = seed()
        try store.save(seeded)
        return seeded
    }

    public func save(_ snapshot: AppSnapshot) throws {
        try store.save(snapshot)
    }

    public static func live(
        fileManager: FileManager = .default,
        environment: AppEnvironment = .localOnly
    ) -> LocalAppSnapshotRepository {
        let applicationSupportDirectory = fileManager.urls(
            for: .applicationSupportDirectory,
            in: .userDomainMask
        ).first ?? fileManager.temporaryDirectory
        let storeURL = applicationSupportDirectory
            .appendingPathComponent("MeditationNative", isDirectory: true)
            .appendingPathComponent("foundation-snapshot.json")

        return LocalAppSnapshotRepository(
            store: JSONFileStore<AppSnapshot>(fileURL: storeURL),
            environment: environment
        )
    }
}
