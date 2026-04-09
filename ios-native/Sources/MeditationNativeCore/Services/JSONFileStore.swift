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

public struct LocalAppSnapshotRepository: Sendable {
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
