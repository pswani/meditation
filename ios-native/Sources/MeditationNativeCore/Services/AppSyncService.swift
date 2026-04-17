import Foundation

public struct RemoteMediaAsset: Codable, Equatable, Sendable {
    public var id: String
    public var label: String
    public var meditationType: MeditationType
    public var durationSeconds: Int
    public var filePath: String
    public var relativePath: String

    public init(
        id: String,
        label: String,
        meditationType: MeditationType,
        durationSeconds: Int,
        filePath: String,
        relativePath: String
    ) {
        self.id = id
        self.label = label
        self.meditationType = meditationType
        self.durationSeconds = durationSeconds
        self.filePath = filePath
        self.relativePath = relativePath
    }
}

public struct RemoteAppState: Equatable, Sendable {
    public var snapshot: AppSnapshot
    public var summary: SummarySnapshot?
    public var mediaAssets: [RemoteMediaAsset]
    public var syncNoticeMessage: String?

    public init(
        snapshot: AppSnapshot,
        summary: SummarySnapshot?,
        mediaAssets: [RemoteMediaAsset],
        syncNoticeMessage: String? = nil
    ) {
        self.snapshot = snapshot
        self.summary = summary
        self.mediaAssets = mediaAssets
        self.syncNoticeMessage = syncNoticeMessage
    }
}

public enum AppSyncError: Error, Equatable, Sendable {
    case offline
    case backendUnavailable
    case invalidResponse(String)
    case server(statusCode: Int, message: String)
}

public enum AppSyncFeature {
    public static func enqueue(_ mutation: SyncMutation, into state: AppSyncState) -> AppSyncState {
        var updatedState = state
        if let existingIndex = updatedState.pendingMutations.firstIndex(where: { $0.id == mutation.id }) {
            updatedState.pendingMutations[existingIndex] = mutation
        } else {
            updatedState.pendingMutations.append(mutation)
        }
        return updatedState
    }

    public static func reconcile(
        remoteState: RemoteAppState,
        localSnapshot: AppSnapshot,
        pendingMutations: [SyncMutation]
    ) -> AppSnapshot {
        var mergedSnapshot = remoteState.snapshot
        mergedSnapshot.lastUsedPracticeTarget = localSnapshot.lastUsedPracticeTarget
        mergedSnapshot.customPlays = mergeDeviceOnlyCustomPlayFields(
            remoteCustomPlays: remoteState.snapshot.customPlays,
            localCustomPlays: localSnapshot.customPlays
        )
        mergedSnapshot.sankalpas = mergeDeviceOnlySankalpaFields(
            remoteSankalpas: remoteState.snapshot.sankalpas,
            localSankalpas: localSnapshot.sankalpas
        )
        mergedSnapshot.summary = remoteState.summary ?? SummaryFeature.makeStoredSummarySnapshot(from: mergedSnapshot.recentSessionLogs)

        for mutation in pendingMutations {
            mergedSnapshot = applyQueuedMutation(mutation, to: mergedSnapshot)
        }

        if remoteState.summary == nil {
            mergedSnapshot.summary = SummaryFeature.makeStoredSummarySnapshot(from: mergedSnapshot.recentSessionLogs)
        }
        return mergedSnapshot
    }

    public static func applyQueuedMutation(_ mutation: SyncMutation, to snapshot: AppSnapshot) -> AppSnapshot {
        var updatedSnapshot = snapshot

        switch mutation.domain {
        case .timerSettings:
            if let timerSettings = mutation.payload.timerSettings {
                updatedSnapshot.timerDraft = timerSettings
            }
        case .sessionLog:
            if let sessionLog = mutation.payload.sessionLog {
                updatedSnapshot.recentSessionLogs = upsert(sessionLog, into: updatedSnapshot.recentSessionLogs)
                    .sorted { $0.endedAt > $1.endedAt }
            }
        case .customPlay:
            if mutation.operation == .delete, let recordID = mutation.recordID {
                updatedSnapshot.customPlays.removeAll { $0.id == recordID }
            } else if let customPlay = mutation.payload.customPlay {
                updatedSnapshot.customPlays = upsert(customPlay, into: updatedSnapshot.customPlays)
            }
        case .playlist:
            if mutation.operation == .delete, let recordID = mutation.recordID {
                updatedSnapshot.playlists.removeAll { $0.id == recordID }
            } else if let playlist = mutation.payload.playlist {
                updatedSnapshot.playlists = upsert(playlist, into: updatedSnapshot.playlists)
            }
        case .sankalpa:
            if mutation.operation == .delete, let recordID = mutation.recordID {
                updatedSnapshot.sankalpas.removeAll { $0.id == recordID }
            } else if let sankalpa = mutation.payload.sankalpa {
                updatedSnapshot.sankalpas = upsert(sankalpa, into: updatedSnapshot.sankalpas)
            }
        }

        updatedSnapshot.summary = SummaryFeature.makeStoredSummarySnapshot(from: updatedSnapshot.recentSessionLogs)
        return updatedSnapshot
    }

    public static func applyAuthoritativeMutationResult(
        mutation: SyncMutation,
        remoteState: RemoteAppState,
        to snapshot: AppSnapshot
    ) -> AppSnapshot {
        var updatedSnapshot = snapshot

        switch mutation.domain {
        case .timerSettings:
            updatedSnapshot.timerDraft = remoteState.snapshot.timerDraft
        case .sessionLog:
            updatedSnapshot.recentSessionLogs = remoteState.snapshot.recentSessionLogs
        case .customPlay:
            updatedSnapshot.customPlays = mergeDeviceOnlyCustomPlayFields(
                remoteCustomPlays: remoteState.snapshot.customPlays,
                localCustomPlays: snapshot.customPlays
            )
        case .playlist:
            updatedSnapshot.playlists = remoteState.snapshot.playlists
        case .sankalpa:
            updatedSnapshot.sankalpas = mergeDeviceOnlySankalpaFields(
                remoteSankalpas: remoteState.snapshot.sankalpas,
                localSankalpas: snapshot.sankalpas
            )
        }

        updatedSnapshot.summary = remoteState.summary ?? SummaryFeature.makeStoredSummarySnapshot(from: updatedSnapshot.recentSessionLogs)
        return updatedSnapshot
    }

    public static func mergeDeviceOnlyCustomPlayFields(
        remoteCustomPlays: [CustomPlay],
        localCustomPlays: [CustomPlay]
    ) -> [CustomPlay] {
        let localByID = Dictionary(uniqueKeysWithValues: localCustomPlays.map { ($0.id, $0) })
        return remoteCustomPlays.map { remoteCustomPlay in
            guard let localCustomPlay = localByID[remoteCustomPlay.id] else {
                return remoteCustomPlay
            }

            var mergedCustomPlay = remoteCustomPlay
            if mergedCustomPlay.media == nil,
               let localMedia = localCustomPlay.media,
               localMedia.source != .legacyPlaceholder {
                mergedCustomPlay.media = localCustomPlay.media
            }
            if mergedCustomPlay.recordingLabel == nil {
                mergedCustomPlay.recordingLabel = localCustomPlay.recordingLabel
            }
            if mergedCustomPlay.linkedMediaIdentifier == nil {
                mergedCustomPlay.linkedMediaIdentifier = localCustomPlay.linkedMediaIdentifier
            }
            return mergedCustomPlay
        }
    }

    public static func mergeDeviceOnlySankalpaFields(
        remoteSankalpas: [Sankalpa],
        localSankalpas: [Sankalpa]
    ) -> [Sankalpa] {
        let localByID = Dictionary(uniqueKeysWithValues: localSankalpas.map { ($0.id, $0) })
        return remoteSankalpas.map { remoteSankalpa in
            guard let localSankalpa = localByID[remoteSankalpa.id] else {
                return remoteSankalpa
            }

            var mergedSankalpa = remoteSankalpa
            if mergedSankalpa.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                mergedSankalpa.title = localSankalpa.title
            }
            return mergedSankalpa
        }
    }

    private static func upsert<Value: Identifiable & Equatable>(_ value: Value, into values: [Value]) -> [Value] {
        var updatedValues = values
        if let existingIndex = updatedValues.firstIndex(where: { $0.id == value.id }) {
            updatedValues[existingIndex] = value
        } else {
            updatedValues.append(value)
        }
        return updatedValues
    }
}

public protocol AppSyncClient: Sendable {
    func fetchRemoteState(localSnapshot: AppSnapshot, timeZoneIdentifier: String) async throws -> RemoteAppState
    func applyMutation(
        _ mutation: SyncMutation,
        localSnapshot: AppSnapshot,
        timeZoneIdentifier: String
    ) async throws -> RemoteAppState
}

public struct LiveAppSyncClient: AppSyncClient {
    private let baseURL: URL
    private let session: URLSession
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder

    public init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
        self.encoder = JSONEncoder()
        self.decoder = JSONDecoder()
    }

    public func fetchRemoteState(localSnapshot: AppSnapshot, timeZoneIdentifier: String) async throws -> RemoteAppState {
        let timerSettings: BackendTimerSettingsResponse = try await request(path: "/api/settings/timer")
        let sessionLogList: BackendSessionLogListResponse = try await request(path: "/api/session-logs")
        let customPlays: [BackendCustomPlayResponse] = try await request(path: "/api/custom-plays")
        let playlists: [BackendPlaylistResponse] = try await request(path: "/api/playlists")
        let sankalpas: [BackendSankalpaProgressResponse] = try await request(
            path: "/api/sankalpas",
            queryItems: [URLQueryItem(name: "timeZone", value: timeZoneIdentifier)]
        )
        let summary: BackendSummaryResponse = try await request(
            path: "/api/summaries",
            queryItems: [URLQueryItem(name: "timeZone", value: timeZoneIdentifier)]
        )
        let mediaAssets: [BackendMediaAssetResponse] = try await request(path: "/api/media/custom-plays")

        let resolvedMediaAssets = try mediaAssets.map { try $0.toRemoteMediaAsset() }
        let remoteCustomPlays = try customPlays.map { try $0.toCustomPlay(mediaAssets: resolvedMediaAssets) }
        let snapshot = AppSnapshot(
            timerDraft: try timerSettings.toTimerSettingsDraft(),
            lastUsedPracticeTarget: localSnapshot.lastUsedPracticeTarget,
            activeRuntime: localSnapshot.activeRuntime,
            recentSessionLogs: try sessionLogList.items.map { try $0.toSessionLog() }.sorted { $0.endedAt > $1.endedAt },
            customPlays: remoteCustomPlays,
            playlists: try playlists.map { try $0.toPlaylist() },
            sankalpas: try sankalpas.map { try $0.goal.toSankalpa() },
            summary: try summary.toSummarySnapshot()
        )

        return RemoteAppState(
            snapshot: snapshot,
            summary: snapshot.summary,
            mediaAssets: resolvedMediaAssets
        )
    }

    public func applyMutation(
        _ mutation: SyncMutation,
        localSnapshot: AppSnapshot,
        timeZoneIdentifier: String
    ) async throws -> RemoteAppState {
        var syncNoticeMessage: String?

        switch mutation.domain {
        case .timerSettings:
            guard let timerSettings = mutation.payload.timerSettings else {
                throw AppSyncError.invalidResponse("Timer settings payload was missing.")
            }
            _ = try await request(
                path: "/api/settings/timer",
                method: "PUT",
                body: BackendTimerSettingsUpsertRequest(from: timerSettings),
                queuedAt: mutation.queuedAt
            ) as BackendTimerSettingsResponse
        case .sessionLog:
            guard let sessionLog = mutation.payload.sessionLog else {
                throw AppSyncError.invalidResponse("Session log payload was missing.")
            }
            _ = try await request(
                path: "/api/session-logs/\(sessionLog.id.uuidString.lowercased())",
                method: "PUT",
                body: BackendSessionLogUpsertRequest(from: sessionLog),
                queuedAt: mutation.queuedAt
            ) as BackendSessionLogResponse
        case .customPlay:
            guard let recordID = mutation.recordID else {
                throw AppSyncError.invalidResponse("Custom play id was missing.")
            }
            if mutation.operation == .delete {
                let deleteResult: BackendDeleteResult<BackendCustomPlayResponse> = try await request(
                    path: "/api/custom-plays/\(recordID.uuidString.lowercased())",
                    method: "DELETE",
                    queuedAt: mutation.queuedAt
                )
                if deleteResult.outcome == "stale" {
                    syncNoticeMessage = "A newer backend version already exists, so this custom play delete was not applied."
                }
            } else {
                guard let customPlay = mutation.payload.customPlay else {
                    throw AppSyncError.invalidResponse("Custom play payload was missing.")
                }
                let mediaAssets: [BackendMediaAssetResponse] = try await request(path: "/api/media/custom-plays")
                _ = try await request(
                    path: "/api/custom-plays/\(recordID.uuidString.lowercased())",
                    method: "PUT",
                    body: BackendCustomPlayUpsertRequest(
                        from: customPlay,
                        availableMediaAssets: try mediaAssets.map { try $0.toRemoteMediaAsset() }
                    ),
                    queuedAt: mutation.queuedAt
                ) as BackendCustomPlayResponse
            }
        case .playlist:
            guard let recordID = mutation.recordID else {
                throw AppSyncError.invalidResponse("Playlist id was missing.")
            }
            if mutation.operation == .delete {
                let deleteResult: BackendDeleteResult<BackendPlaylistResponse> = try await request(
                    path: "/api/playlists/\(recordID.uuidString.lowercased())",
                    method: "DELETE",
                    queuedAt: mutation.queuedAt
                )
                if deleteResult.outcome == "stale" {
                    syncNoticeMessage = "A newer backend version already exists, so this playlist delete was not applied."
                }
            } else {
                guard let playlist = mutation.payload.playlist else {
                    throw AppSyncError.invalidResponse("Playlist payload was missing.")
                }
                _ = try await request(
                    path: "/api/playlists/\(recordID.uuidString.lowercased())",
                    method: "PUT",
                    body: BackendPlaylistUpsertRequest(from: playlist),
                    queuedAt: mutation.queuedAt
                ) as BackendPlaylistResponse
            }
        case .sankalpa:
            guard let recordID = mutation.recordID else {
                throw AppSyncError.invalidResponse("Sankalpa id was missing.")
            }
            if mutation.operation == .delete {
                let deleteResult: BackendDeleteResult<BackendSankalpaProgressResponse> = try await request(
                    path: "/api/sankalpas/\(recordID.uuidString.lowercased())",
                    method: "DELETE",
                    queryItems: [URLQueryItem(name: "timeZone", value: timeZoneIdentifier)],
                    queuedAt: mutation.queuedAt
                )
                if deleteResult.outcome == "stale" {
                    syncNoticeMessage = "A newer backend version already exists, so this sankalpa delete was not applied."
                }
            } else {
                guard let sankalpa = mutation.payload.sankalpa else {
                    throw AppSyncError.invalidResponse("Sankalpa payload was missing.")
                }
                _ = try await request(
                    path: "/api/sankalpas/\(recordID.uuidString.lowercased())",
                    method: "PUT",
                    queryItems: [URLQueryItem(name: "timeZone", value: timeZoneIdentifier)],
                    body: BackendSankalpaUpsertRequest(from: sankalpa),
                    queuedAt: mutation.queuedAt
                ) as BackendSankalpaProgressResponse
            }
        }

        var remoteState = try await fetchRemoteState(localSnapshot: localSnapshot, timeZoneIdentifier: timeZoneIdentifier)
        remoteState.syncNoticeMessage = syncNoticeMessage
        return remoteState
    }

    private func request<Response: Decodable>(
        path: String,
        method: String = "GET",
        queryItems: [URLQueryItem] = [],
        queuedAt: Date? = nil
    ) async throws -> Response {
        try await request(path: path, method: method, queryItems: queryItems, body: Optional<String>.none, queuedAt: queuedAt)
    }

    private func request<RequestBody: Encodable, Response: Decodable>(
        path: String,
        method: String = "GET",
        queryItems: [URLQueryItem] = [],
        body: RequestBody?,
        queuedAt: Date? = nil
    ) async throws -> Response {
        guard var components = URLComponents(url: baseURL.appendingPathComponent(path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))), resolvingAgainstBaseURL: false) else {
            throw AppSyncError.invalidResponse("The API base URL is invalid.")
        }
        components.queryItems = queryItems.isEmpty ? nil : queryItems
        guard let url = components.url else {
            throw AppSyncError.invalidResponse("The request URL is invalid.")
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if body != nil {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try encoder.encode(body)
        }
        if let queuedAt {
            request.setValue(queuedAt.ISO8601Format(), forHTTPHeaderField: GeneratedSyncContract.syncQueuedAtHeader)
        }
        request.timeoutInterval = 10

        do {
            let (data, response) = try await session.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse else {
                throw AppSyncError.invalidResponse("The backend returned a non-HTTP response.")
            }

            if httpResponse.statusCode == 204 {
                return try decoder.decode(Response.self, from: Data("{}".utf8))
            }

            guard (200 ... 299).contains(httpResponse.statusCode) else {
                let serverMessage = String(data: data, encoding: .utf8) ?? "The backend request failed."
                throw AppSyncError.server(statusCode: httpResponse.statusCode, message: serverMessage)
            }

            return try decoder.decode(Response.self, from: data)
        } catch let error as AppSyncError {
            throw error
        } catch let error as URLError {
            switch error.code {
            case .notConnectedToInternet, .dataNotAllowed, .internationalRoamingOff, .networkConnectionLost:
                throw AppSyncError.offline
            case .cannotFindHost, .cannotConnectToHost, .dnsLookupFailed, .timedOut, .cannotLoadFromNetwork:
                throw AppSyncError.backendUnavailable
            default:
                throw AppSyncError.backendUnavailable
            }
        } catch {
            throw AppSyncError.invalidResponse("The backend response could not be decoded.")
        }
    }
}

public struct LocalAppSyncStateRepository {
    private let store: JSONFileStore<AppSyncState>
    public let environment: AppEnvironment

    public init(store: JSONFileStore<AppSyncState>, environment: AppEnvironment) {
        self.store = store
        self.environment = environment
    }

    public func load(default defaultValue: @autoclosure () -> AppSyncState) throws -> AppSyncState {
        try store.load() ?? defaultValue()
    }

    public func save(_ syncState: AppSyncState) throws {
        try store.save(syncState)
    }

    public static func live(
        fileManager: FileManager = .default,
        environment: AppEnvironment = .localOnly
    ) -> LocalAppSyncStateRepository {
        let applicationSupportDirectory = fileManager.urls(
            for: .applicationSupportDirectory,
            in: .userDomainMask
        ).first ?? fileManager.temporaryDirectory
        let storeURL = applicationSupportDirectory
            .appendingPathComponent("MeditationNative", isDirectory: true)
            .appendingPathComponent("sync-state.json")

        return LocalAppSyncStateRepository(
            store: JSONFileStore<AppSyncState>(fileURL: storeURL),
            environment: environment
        )
    }
}

private struct BackendTimerSettingsResponse: Decodable {
    var timerMode: String
    var durationMinutes: Int?
    var lastFixedDurationMinutes: Int
    var meditationType: String
    var startSound: String
    var endSound: String
    var intervalEnabled: Bool
    var intervalMinutes: Int
    var intervalSound: String

    func toTimerSettingsDraft() throws -> TimerSettingsDraft {
        TimerSettingsDraft(
            mode: try timerMode == "fixed" ? .fixedDuration : timerMode == "open-ended" ? .openEnded : {
                throw AppSyncError.invalidResponse("Unsupported backend timer mode: \(timerMode)")
            }(),
            durationMinutes: durationMinutes ?? lastFixedDurationMinutes,
            meditationType: meditationType.isEmpty ? nil : MeditationType(rawValue: meditationType),
            startSoundName: TimerSoundCatalog.normalizeSelection(startSound.nilIfNone),
            endSoundName: TimerSoundCatalog.normalizeSelection(endSound.nilIfNone),
            intervalSoundName: intervalEnabled ? TimerSoundCatalog.normalizeSelection(intervalSound.nilIfNone) : nil,
            intervalMinutes: intervalEnabled && intervalMinutes > 0 ? intervalMinutes : nil
        )
    }
}

private struct BackendTimerSettingsUpsertRequest: Encodable {
    var timerMode: String
    var durationMinutes: Int?
    var lastFixedDurationMinutes: Int
    var meditationType: String?
    var startSound: String
    var endSound: String
    var intervalEnabled: Bool
    var intervalMinutes: Int
    var intervalSound: String

    init(from timerSettings: TimerSettingsDraft) {
        self.timerMode = timerSettings.mode == .fixedDuration ? "fixed" : "open-ended"
        self.durationMinutes = timerSettings.mode == .fixedDuration ? max(1, timerSettings.durationMinutes) : nil
        self.lastFixedDurationMinutes = max(1, timerSettings.durationMinutes)
        self.meditationType = timerSettings.meditationType?.rawValue
        self.startSound = TimerSoundCatalog.normalizeSelection(timerSettings.startSoundName) ?? "None"
        self.endSound = TimerSoundCatalog.normalizeSelection(timerSettings.endSoundName) ?? "None"
        self.intervalEnabled = timerSettings.intervalMinutes != nil && timerSettings.intervalMinutes ?? 0 > 0
        self.intervalMinutes = max(0, timerSettings.intervalMinutes ?? 0)
        self.intervalSound = TimerSoundCatalog.normalizeSelection(timerSettings.intervalSoundName) ?? "None"
    }
}

private struct BackendSessionLogListResponse: Decodable {
    var items: [BackendSessionLogResponse]
}

private struct BackendSessionLogResponse: Decodable {
    var id: String
    var startedAt: String
    var endedAt: String
    var meditationType: String
    var timerMode: String
    var intendedDurationSeconds: Int?
    var completedDurationSeconds: Int
    var status: String
    var source: String
    var customPlayId: String?
    var customPlayName: String?
    var customPlayRecordingLabel: String?
    var playlistRunId: String?
    var playlistName: String?
    var playlistItemPosition: Int?
    var playlistItemCount: Int?

    func toSessionLog() throws -> SessionLog {
        guard let meditationType = MeditationType(rawValue: meditationType) else {
            throw AppSyncError.invalidResponse("Unsupported meditation type: \(meditationType)")
        }
        let source = try SessionSource.fromBackendValue(
            source,
            hasPlaylistContext: hasPlaylistContext,
            hasCustomPlayContext: hasCustomPlayContext
        ).unwrap("Unsupported session log source: \(source)")
        let status = try SessionStatus.fromBackend(status)
        let timerMode = try TimerSettingsDraft.Mode.fromBackend(timerMode)
        let startedAtDate = try Date.iso8601(startedAt)
        let endedAtDate = try Date.iso8601(endedAt)

        return SessionLog(
            id: UUID(uuidString: id) ?? UUID(),
            meditationType: meditationType,
            source: source,
            status: status,
            startedAt: startedAtDate,
            endedAt: endedAtDate,
            completedDurationSeconds: completedDurationSeconds,
            plannedDurationSeconds: intendedDurationSeconds,
            timerMode: timerMode,
            notes: sessionLogNotes(),
            context: sessionLogContext()
        )
    }

    private var hasPlaylistContext: Bool {
        playlistRunId?.nilIfBlank != nil
            || playlistName?.nilIfBlank != nil
            || playlistItemPosition != nil
            || playlistItemCount != nil
    }

    private var hasCustomPlayContext: Bool {
        customPlayId?.nilIfBlank != nil
            || customPlayName?.nilIfBlank != nil
            || customPlayRecordingLabel?.nilIfBlank != nil
    }

    private func sessionLogContext() -> SessionLogContext? {
        if customPlayId == nil, customPlayName == nil, customPlayRecordingLabel == nil, playlistRunId == nil, playlistName == nil {
            return nil
        }

        return SessionLogContext(
            playlistRunID: UUID(uuidString: playlistRunId ?? ""),
            playlistName: playlistName,
            playlistItemIndex: playlistItemPosition == nil ? nil : max(0, playlistItemPosition! - 1),
            playlistItemCount: playlistItemCount,
            customPlayID: UUID(uuidString: customPlayId ?? ""),
            customPlayName: customPlayName,
            recordingLabel: customPlayRecordingLabel
        )
    }

    private func sessionLogNotes() -> String? {
        if let customPlayName, customPlayName.isEmpty == false {
            return customPlayName
        }
        if let playlistName, playlistName.isEmpty == false {
            return "Playlist: \(playlistName)"
        }
        return nil
    }
}

private struct BackendSessionLogUpsertRequest: Encodable {
    var id: String
    var startedAt: String
    var endedAt: String
    var meditationType: String
    var timerMode: String
    var intendedDurationSeconds: Int?
    var completedDurationSeconds: Int
    var status: String
    var source: String
    var startSound: String
    var endSound: String
    var intervalEnabled: Bool
    var intervalMinutes: Int
    var intervalSound: String
    var playlistId: String?
    var playlistName: String?
    var playlistRunId: String?
    var playlistRunStartedAt: String?
    var playlistItemPosition: Int?
    var playlistItemCount: Int?
    var customPlayId: String?
    var customPlayName: String?
    var customPlayRecordingLabel: String?

    init(from sessionLog: SessionLog) {
        id = sessionLog.id.uuidString.lowercased()
        startedAt = sessionLog.startedAt.ISO8601Format()
        endedAt = sessionLog.endedAt.ISO8601Format()
        meditationType = sessionLog.meditationType.rawValue
        timerMode = sessionLog.timerMode?.backendValue ?? "fixed"
        intendedDurationSeconds = sessionLog.plannedDurationSeconds
        completedDurationSeconds = sessionLog.completedDurationSeconds
        status = sessionLog.status.backendValue
        source = sessionLog.source.backendValue
        startSound = "None"
        endSound = "None"
        intervalEnabled = false
        intervalMinutes = 0
        intervalSound = "None"
        playlistId = nil
        playlistName = sessionLog.context?.playlistName
        playlistRunId = sessionLog.context?.playlistRunID?.uuidString.lowercased()
        playlistRunStartedAt = nil
        playlistItemPosition = sessionLog.context?.playlistItemIndex.map { $0 + 1 }
        playlistItemCount = sessionLog.context?.playlistItemCount
        customPlayId = sessionLog.context?.customPlayID?.uuidString.lowercased()
        customPlayName = sessionLog.context?.customPlayName
        customPlayRecordingLabel = sessionLog.context?.recordingLabel
    }
}

private struct BackendCustomPlayResponse: Decodable {
    var id: String
    var name: String
    var meditationType: String
    var durationMinutes: Int
    var startSound: String
    var endSound: String
    var mediaAssetId: String?
    var recordingLabel: String?
    var favorite: Bool

    func toCustomPlay(mediaAssets: [RemoteMediaAsset]) throws -> CustomPlay {
        guard let meditationType = MeditationType(rawValue: meditationType) else {
            throw AppSyncError.invalidResponse("Unsupported custom play meditation type: \(meditationType)")
        }
        let mediaAsset = resolvedMediaAsset(from: mediaAssets, meditationType: meditationType)
        return CustomPlay(
            id: UUID(uuidString: id) ?? UUID(),
            name: name,
            meditationType: meditationType,
            durationSeconds: mediaAsset?.durationSeconds ?? (durationMinutes * 60),
            startSoundName: TimerSoundCatalog.normalizeSelection(startSound.nilIfNone),
            endSoundName: TimerSoundCatalog.normalizeSelection(endSound.nilIfNone),
            recordingLabel: recordingLabel?.nilIfBlank,
            linkedMediaIdentifier: mediaAssetId?.nilIfBlank ?? mediaAsset?.id,
            media: mediaAsset?.playbackMedia,
            isFavorite: favorite
        )
    }

    private func resolvedMediaAsset(
        from mediaAssets: [RemoteMediaAsset],
        meditationType: MeditationType
    ) -> RemoteMediaAsset? {
        if let mediaAssetId {
            return mediaAssets.first(where: { $0.id == mediaAssetId })
        }

        let sameMeditationTypeAssets = mediaAssets.filter { $0.meditationType == meditationType }
        guard sameMeditationTypeAssets.isEmpty == false else {
            return nil
        }

        let normalizedName = name.normalizedMediaLookupKey
        let normalizedRecordingLabel = recordingLabel?.normalizedMediaLookupKey
        let requestedDurationSeconds = durationMinutes * 60

        if let exactLabelMatch = sameMeditationTypeAssets.onlyMatch(where: {
            let normalizedLabel = $0.label.normalizedMediaLookupKey
            return normalizedLabel == normalizedName || normalizedLabel == normalizedRecordingLabel
        }) {
            return exactLabelMatch
        }

        if let exactDurationMatch = sameMeditationTypeAssets.onlyMatch(where: {
            $0.durationSeconds == requestedDurationSeconds
        }) {
            return exactDurationMatch
        }

        return sameMeditationTypeAssets.onlyMatch(where: {
            let fileStem = URL(fileURLWithPath: $0.relativePath)
                .deletingPathExtension()
                .lastPathComponent
                .normalizedMediaLookupKey
            return fileStem == normalizedName || fileStem == normalizedRecordingLabel
        })
    }
}

private struct BackendCustomPlayUpsertRequest: Encodable {
    var id: String
    var name: String
    var meditationType: String
    var durationMinutes: Int
    var startSound: String
    var endSound: String
    var mediaAssetId: String
    var recordingLabel: String?
    var favorite: Bool
    var createdAt: String
    var updatedAt: String

    init(from customPlay: CustomPlay, availableMediaAssets: [RemoteMediaAsset]) {
        let now = Date().ISO8601Format()
        let resolvedMediaAssetID = customPlay.linkedMediaIdentifier
            ?? customPlay.media.map(\.id).flatMap { $0.nilIfBlank }
            ?? availableMediaAssets.first(where: { $0.meditationType == customPlay.meditationType })?.id
        id = customPlay.id.uuidString.lowercased()
        name = customPlay.name
        meditationType = customPlay.meditationType.rawValue
        durationMinutes = max(1, customPlay.durationSeconds / 60)
        startSound = TimerSoundCatalog.normalizeSelection(customPlay.startSoundName) ?? "None"
        endSound = TimerSoundCatalog.normalizeSelection(customPlay.endSoundName) ?? "None"
        mediaAssetId = resolvedMediaAssetID ?? ""
        recordingLabel = customPlay.recordingLabel?.nilIfBlank
        favorite = customPlay.isFavorite
        createdAt = now
        updatedAt = now
    }
}

private struct BackendPlaylistResponse: Decodable {
    var id: String
    var name: String
    var items: [BackendPlaylistItemResponse]
    var smallGapSeconds: Int
    var favorite: Bool

    func toPlaylist() throws -> Playlist {
        Playlist(
            id: UUID(uuidString: id) ?? UUID(),
            name: name,
            items: try items.map { try $0.toPlaylistItem() },
            gapSeconds: smallGapSeconds,
            isFavorite: favorite
        )
    }
}

private struct BackendPlaylistItemResponse: Decodable {
    var id: String
    var title: String
    var meditationType: String
    var durationMinutes: Int
    var customPlayId: String?

    func toPlaylistItem() throws -> PlaylistItem {
        guard let meditationType = MeditationType(rawValue: meditationType) else {
            throw AppSyncError.invalidResponse("Unsupported playlist meditation type: \(meditationType)")
        }
        return PlaylistItem(
            id: UUID(uuidString: id) ?? UUID(),
            title: title,
            kind: customPlayId == nil ? .timer : .customPlay,
            durationSeconds: durationMinutes * 60,
            meditationType: meditationType,
            customPlayID: UUID(uuidString: customPlayId ?? "")
        )
    }
}

private struct BackendPlaylistUpsertRequest: Encodable {
    var id: String
    var name: String
    var createdAt: String
    var updatedAt: String
    var smallGapSeconds: Int
    var items: [BackendPlaylistItemUpsertRequest]
    var favorite: Bool

    init(from playlist: Playlist) {
        let now = Date().ISO8601Format()
        id = playlist.id.uuidString.lowercased()
        name = playlist.name
        createdAt = now
        updatedAt = now
        smallGapSeconds = playlist.gapSeconds
        items = playlist.items.map { BackendPlaylistItemUpsertRequest(from: $0) }
        favorite = playlist.isFavorite
    }
}

private struct BackendPlaylistItemUpsertRequest: Encodable {
    var id: String
    var title: String
    var meditationType: String
    var durationMinutes: Int
    var customPlayId: String?

    init(from item: PlaylistItem) {
        id = item.id.uuidString.lowercased()
        title = item.title
        meditationType = item.meditationType.rawValue
        durationMinutes = max(1, item.durationSeconds / 60)
        customPlayId = item.customPlayID?.uuidString.lowercased()
    }
}

private struct BackendSankalpaProgressResponse: Decodable {
    var goal: BackendSankalpaGoalResponse
}

private struct BackendSankalpaGoalResponse: Decodable {
    var id: String
    var goalType: String
    var targetValue: Double
    var days: Int
    var qualifyingDaysPerWeek: Int?
    var meditationType: String?
    var timeOfDayBucket: String?
    var observanceLabel: String?
    var observanceRecords: [BackendSankalpaObservanceRecordResponse]
    var createdAt: String
    var archived: Bool

    func toSankalpa() throws -> Sankalpa {
        Sankalpa(
            id: UUID(uuidString: id) ?? UUID(),
            title: deriveTitle(),
            kind: try SankalpaKind(rawValue: goalType).unwrap("Unsupported sankalpa kind: \(goalType)"),
            targetValue: Int(targetValue.rounded()),
            days: days,
            qualifyingDaysPerWeek: qualifyingDaysPerWeek,
            meditationType: meditationType.flatMap(MeditationType.init(rawValue:)),
            timeOfDayBucket: timeOfDayBucket.flatMap(TimeOfDayBucket.init(rawValue:)),
            observanceLabel: observanceLabel?.nilIfBlank,
            observanceRecords: observanceRecords.map { $0.toObservanceRecord() },
            createdAt: try Date.iso8601(createdAt),
            archived: archived
        )
    }

    private func deriveTitle() -> String {
        if let observanceLabel, observanceLabel.isEmpty == false {
            return observanceLabel
        }
        if let meditationType, meditationType.isEmpty == false {
            return "\(meditationType) goal"
        }
        return goalType.replacingOccurrences(of: "-", with: " ").capitalized
    }
}

private struct BackendSankalpaObservanceRecordResponse: Codable {
    var date: String
    var status: String

    func toObservanceRecord() -> SankalpaObservanceRecord {
        SankalpaObservanceRecord(
            dateKey: date,
            status: status == "missed" ? .missed : .observed
        )
    }
}

private struct BackendSankalpaUpsertRequest: Encodable {
    var id: String
    var goalType: String
    var targetValue: Int
    var days: Int
    var qualifyingDaysPerWeek: Int?
    var meditationType: String?
    var timeOfDayBucket: String?
    var observanceLabel: String?
    var observanceRecords: [BackendSankalpaObservanceRecordResponse]
    var createdAt: String
    var archived: Bool

    init(from sankalpa: Sankalpa) {
        id = sankalpa.id.uuidString.lowercased()
        goalType = sankalpa.kind.rawValue
        targetValue = sankalpa.targetValue
        days = sankalpa.days
        qualifyingDaysPerWeek = sankalpa.qualifyingDaysPerWeek
        meditationType = sankalpa.meditationType?.rawValue
        timeOfDayBucket = sankalpa.timeOfDayBucket?.rawValue
        observanceLabel = sankalpa.observanceLabel?.nilIfBlank
        observanceRecords = sankalpa.observanceRecords.map {
            BackendSankalpaObservanceRecordResponse(date: $0.dateKey, status: $0.status.rawValue)
        }
        createdAt = sankalpa.createdAt.ISO8601Format()
        archived = sankalpa.archived
    }
}

private struct BackendSummaryResponse: Decodable {
    var overallSummary: BackendOverallSummaryResponse
    var byTypeSummary: [BackendSummaryByTypeResponse]
    var bySourceSummary: [BackendSummaryBySourceResponse]
    var byTimeOfDaySummary: [BackendSummaryByTimeOfDayResponse]

    func toSummarySnapshot() throws -> SummarySnapshot {
        SummarySnapshot(
            overallRows: [
                SummarySnapshot.SummaryRow(label: "Session logs", value: "\(overallSummary.totalSessionLogs)"),
                SummarySnapshot.SummaryRow(label: "Completed", value: "\(overallSummary.completedSessionLogs)"),
                SummarySnapshot.SummaryRow(label: "Ended early", value: "\(overallSummary.endedEarlySessionLogs)"),
                SummarySnapshot.SummaryRow(label: "Total duration", value: formatDuration(overallSummary.totalDurationSeconds)),
            ],
            byMeditationTypeRows: byTypeSummary.map {
                SummarySnapshot.SummaryRow(label: $0.meditationType, value: formatDuration($0.totalDurationSeconds))
            },
            bySourceRows: bySourceSummary.map {
                SummarySnapshot.SummaryRow(label: $0.source, value: formatDuration($0.totalDurationSeconds))
            },
            byTimeOfDayRows: byTimeOfDaySummary.map {
                SummarySnapshot.SummaryRow(label: $0.timeOfDayBucket.capitalized, value: formatDuration($0.totalDurationSeconds))
            }
        )
    }

    private func formatDuration(_ totalSeconds: Int) -> String {
        let hours = totalSeconds / 3_600
        let minutes = (totalSeconds % 3_600) / 60
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        }
        return "\(minutes)m"
    }
}

private struct BackendOverallSummaryResponse: Decodable {
    var totalSessionLogs: Int
    var completedSessionLogs: Int
    var endedEarlySessionLogs: Int
    var totalDurationSeconds: Int
}

private struct BackendSummaryByTypeResponse: Decodable {
    var meditationType: String
    var totalDurationSeconds: Int
}

private struct BackendSummaryBySourceResponse: Decodable {
    var source: String
    var totalDurationSeconds: Int
}

private struct BackendSummaryByTimeOfDayResponse: Decodable {
    var timeOfDayBucket: String
    var totalDurationSeconds: Int
}

private struct BackendMediaAssetResponse: Decodable {
    var id: String
    var label: String
    var meditationType: String
    var filePath: String
    var relativePath: String
    var durationSeconds: Int

    func toRemoteMediaAsset() throws -> RemoteMediaAsset {
        guard let meditationType = MeditationType(rawValue: meditationType) else {
            throw AppSyncError.invalidResponse("Unsupported media-asset meditation type: \(meditationType)")
        }
        return RemoteMediaAsset(
            id: id,
            label: label,
            meditationType: meditationType,
            durationSeconds: durationSeconds,
            filePath: filePath,
            relativePath: relativePath
        )
    }
}

private struct BackendDeleteResult<Record: Decodable>: Decodable {
    var outcome: String?
    var currentRecord: Record?
    var currentCustomPlay: Record?
    var currentPlaylist: Record?
    var currentSankalpa: Record?

    var resolvedCurrentRecord: Record? {
        currentRecord ?? currentCustomPlay ?? currentPlaylist ?? currentSankalpa
    }
}

private extension RemoteMediaAsset {
    var playbackMedia: CustomPlayMedia {
        .remote(
            id: id,
            label: label,
            relativePath: relativePath,
            filePath: filePath
        )
    }
}

private extension Array {
    func onlyMatch(where predicate: (Element) -> Bool) -> Element? {
        let matches = filter(predicate)
        guard matches.count == 1 else {
            return nil
        }

        return matches[0]
    }
}

private extension String {
    var normalizedMediaLookupKey: String {
        lowercased().filter { $0.isLetter || $0.isNumber }
    }
}

private extension TimerSettingsDraft.Mode {
    static func fromBackend(_ value: String) throws -> TimerSettingsDraft.Mode {
        switch value {
        case "fixed":
            return .fixedDuration
        case "open-ended":
            return .openEnded
        default:
            throw AppSyncError.invalidResponse("Unsupported timer mode: \(value)")
        }
    }

    var backendValue: String {
        switch self {
        case .fixedDuration:
            return "fixed"
        case .openEnded:
            return "open-ended"
        }
    }
}

private extension SessionStatus {
    static func fromBackend(_ value: String) throws -> SessionStatus {
        switch value {
        case "completed":
            return .completed
        case "ended early":
            return .endedEarly
        case "in progress":
            return .inProgress
        default:
            throw AppSyncError.invalidResponse("Unsupported session status: \(value)")
        }
    }

    var backendValue: String {
        switch self {
        case .completed:
            return "completed"
        case .endedEarly:
            return "ended early"
        case .inProgress:
            return "in progress"
        }
    }
}

private extension Optional {
    func unwrap(_ message: String) throws -> Wrapped {
        guard let value = self else {
            throw AppSyncError.invalidResponse(message)
        }
        return value
    }
}

private extension Date {
    static func iso8601(_ value: String) throws -> Date {
        let fractionalFormatter = ISO8601DateFormatter()
        fractionalFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

        let plainFormatter = ISO8601DateFormatter()
        plainFormatter.formatOptions = [.withInternetDateTime]

        if let date = fractionalFormatter.date(from: value) ?? plainFormatter.date(from: value) {
            return date
        }
        throw AppSyncError.invalidResponse("Invalid ISO-8601 timestamp: \(value)")
    }
}

private extension String {
    var nilIfBlank: String? {
        let trimmed = trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }

    var nilIfNone: String? {
        nilIfBlank == "None" ? nil : nilIfBlank
    }
}
