import Foundation

public enum SyncConnectionState: String, Codable, Equatable, Sendable {
    case localOnly = "local-only"
    case syncing
    case upToDate = "up-to-date"
    case pendingSync = "pending-sync"
    case offline
    case backendUnavailable = "backend-unavailable"
    case invalidBackendResponse = "invalid-backend-response"
}

public enum SyncMutationDomain: String, Codable, Equatable, Sendable {
    case timerSettings = "timer-settings"
    case sessionLog = "session-log"
    case customPlay = "custom-play"
    case playlist
    case sankalpa
}

public enum SyncMutationOperation: String, Codable, Equatable, Sendable {
    case upsert
    case delete
}

public struct SyncMutationPayload: Codable, Equatable, Sendable {
    public var timerSettings: TimerSettingsDraft?
    public var sessionLog: SessionLog?
    public var customPlay: CustomPlay?
    public var playlist: Playlist?
    public var sankalpa: Sankalpa?

    public init(
        timerSettings: TimerSettingsDraft? = nil,
        sessionLog: SessionLog? = nil,
        customPlay: CustomPlay? = nil,
        playlist: Playlist? = nil,
        sankalpa: Sankalpa? = nil
    ) {
        self.timerSettings = timerSettings
        self.sessionLog = sessionLog
        self.customPlay = customPlay
        self.playlist = playlist
        self.sankalpa = sankalpa
    }
}

public struct SyncMutation: Identifiable, Codable, Equatable, Sendable {
    public var domain: SyncMutationDomain
    public var operation: SyncMutationOperation
    public var recordID: UUID?
    public var queuedAt: Date
    public var payload: SyncMutationPayload

    public init(
        domain: SyncMutationDomain,
        operation: SyncMutationOperation,
        recordID: UUID? = nil,
        queuedAt: Date = Date(),
        payload: SyncMutationPayload = SyncMutationPayload()
    ) {
        self.domain = domain
        self.operation = operation
        self.recordID = recordID
        self.queuedAt = queuedAt
        self.payload = payload
    }

    public var id: String {
        let recordSegment = recordID?.uuidString ?? "singleton"
        return "\(domain.rawValue)-\(recordSegment)"
    }

    public static func timerSettingsUpsert(_ draft: TimerSettingsDraft, queuedAt: Date = Date()) -> SyncMutation {
        SyncMutation(
            domain: .timerSettings,
            operation: .upsert,
            queuedAt: queuedAt,
            payload: SyncMutationPayload(timerSettings: draft)
        )
    }

    public static func sessionLogUpsert(_ sessionLog: SessionLog, queuedAt: Date = Date()) -> SyncMutation {
        SyncMutation(
            domain: .sessionLog,
            operation: .upsert,
            recordID: sessionLog.id,
            queuedAt: queuedAt,
            payload: SyncMutationPayload(sessionLog: sessionLog)
        )
    }

    public static func customPlayUpsert(_ customPlay: CustomPlay, queuedAt: Date = Date()) -> SyncMutation {
        SyncMutation(
            domain: .customPlay,
            operation: .upsert,
            recordID: customPlay.id,
            queuedAt: queuedAt,
            payload: SyncMutationPayload(customPlay: customPlay)
        )
    }

    public static func customPlayDelete(id: UUID, queuedAt: Date = Date()) -> SyncMutation {
        SyncMutation(domain: .customPlay, operation: .delete, recordID: id, queuedAt: queuedAt)
    }

    public static func playlistUpsert(_ playlist: Playlist, queuedAt: Date = Date()) -> SyncMutation {
        SyncMutation(
            domain: .playlist,
            operation: .upsert,
            recordID: playlist.id,
            queuedAt: queuedAt,
            payload: SyncMutationPayload(playlist: playlist)
        )
    }

    public static func playlistDelete(id: UUID, queuedAt: Date = Date()) -> SyncMutation {
        SyncMutation(domain: .playlist, operation: .delete, recordID: id, queuedAt: queuedAt)
    }

    public static func sankalpaUpsert(_ sankalpa: Sankalpa, queuedAt: Date = Date()) -> SyncMutation {
        SyncMutation(
            domain: .sankalpa,
            operation: .upsert,
            recordID: sankalpa.id,
            queuedAt: queuedAt,
            payload: SyncMutationPayload(sankalpa: sankalpa)
        )
    }

    public static func sankalpaDelete(id: UUID, queuedAt: Date = Date()) -> SyncMutation {
        SyncMutation(domain: .sankalpa, operation: .delete, recordID: id, queuedAt: queuedAt)
    }
}

public struct AppSyncState: Codable, Equatable, Sendable {
    public static let currentVersion = 1

    public var version: Int
    public var connectionState: SyncConnectionState
    public var pendingMutations: [SyncMutation]
    public var lastAttemptedSyncAt: Date?
    public var lastSuccessfulSyncAt: Date?
    public var lastErrorMessage: String?
    public var lastNoticeMessage: String?
    public var lastRemoteSummary: SummarySnapshot?
    /// Set when the pending mutations queue was truncated due to exceeding the cap.
    public var mutationQueueOverflowed: Bool
    /// Set when sync state was recovered from corruption; triggers a full server pull.
    public var needsFullResync: Bool

    public init(
        connectionState: SyncConnectionState = .localOnly,
        pendingMutations: [SyncMutation] = [],
        lastAttemptedSyncAt: Date? = nil,
        lastSuccessfulSyncAt: Date? = nil,
        lastErrorMessage: String? = nil,
        lastNoticeMessage: String? = nil,
        lastRemoteSummary: SummarySnapshot? = nil,
        mutationQueueOverflowed: Bool = false,
        needsFullResync: Bool = false
    ) {
        self.version = Self.currentVersion
        self.connectionState = connectionState
        self.pendingMutations = pendingMutations
        self.lastAttemptedSyncAt = lastAttemptedSyncAt
        self.lastSuccessfulSyncAt = lastSuccessfulSyncAt
        self.lastErrorMessage = lastErrorMessage
        self.lastNoticeMessage = lastNoticeMessage
        self.lastRemoteSummary = lastRemoteSummary
        self.mutationQueueOverflowed = mutationQueueOverflowed
        self.needsFullResync = needsFullResync
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        _ = try container.decodeIfPresent(Int.self, forKey: .version) ?? 1

        self.connectionState = try container.decode(SyncConnectionState.self, forKey: .connectionState)
        self.pendingMutations = try container.decode([SyncMutation].self, forKey: .pendingMutations)
        self.lastAttemptedSyncAt = try container.decodeIfPresent(Date.self, forKey: .lastAttemptedSyncAt)
        self.lastSuccessfulSyncAt = try container.decodeIfPresent(Date.self, forKey: .lastSuccessfulSyncAt)
        self.lastErrorMessage = try container.decodeIfPresent(String.self, forKey: .lastErrorMessage)
        self.lastNoticeMessage = try container.decodeIfPresent(String.self, forKey: .lastNoticeMessage)
        self.lastRemoteSummary = try container.decodeIfPresent(SummarySnapshot.self, forKey: .lastRemoteSummary)
        self.mutationQueueOverflowed = try container.decodeIfPresent(Bool.self, forKey: .mutationQueueOverflowed) ?? false
        self.needsFullResync = try container.decodeIfPresent(Bool.self, forKey: .needsFullResync) ?? false
        self.version = Self.currentVersion
    }

    private enum CodingKeys: String, CodingKey {
        case version
        case connectionState
        case pendingMutations
        case lastAttemptedSyncAt
        case lastSuccessfulSyncAt
        case lastErrorMessage
        case lastNoticeMessage
        case lastRemoteSummary
        case mutationQueueOverflowed
        case needsFullResync
    }

    public static let localOnly = AppSyncState()

    public var pendingMutationCount: Int {
        pendingMutations.count
    }
}
