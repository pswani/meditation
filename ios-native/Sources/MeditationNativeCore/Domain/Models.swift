import Foundation

public struct TimerSettingsDraft: Codable, Equatable, Sendable {
    public enum Mode: String, Codable, CaseIterable, Sendable {
        case fixedDuration = "fixed-duration"
        case openEnded = "open-ended"
    }

    public var mode: Mode
    public var durationMinutes: Int
    public var meditationType: MeditationType?
    public var startSoundName: String?
    public var endSoundName: String?
    public var intervalSoundName: String?
    public var intervalMinutes: Int?

    public init(
        mode: Mode,
        durationMinutes: Int,
        meditationType: MeditationType?,
        startSoundName: String? = nil,
        endSoundName: String? = nil,
        intervalSoundName: String? = nil,
        intervalMinutes: Int? = nil
    ) {
        self.mode = mode
        self.durationMinutes = durationMinutes
        self.meditationType = meditationType
        self.startSoundName = startSoundName
        self.endSoundName = endSoundName
        self.intervalSoundName = intervalSoundName
        self.intervalMinutes = intervalMinutes
    }
}

public struct SessionLogContext: Codable, Equatable, Sendable {
    public var playlistRunID: UUID?
    public var playlistName: String?
    public var playlistItemIndex: Int?
    public var playlistItemCount: Int?
    public var customPlayID: UUID?
    public var customPlayName: String?
    public var recordingLabel: String?
    public var linkedMediaIdentifier: String?

    public init(
        playlistRunID: UUID? = nil,
        playlistName: String? = nil,
        playlistItemIndex: Int? = nil,
        playlistItemCount: Int? = nil,
        customPlayID: UUID? = nil,
        customPlayName: String? = nil,
        recordingLabel: String? = nil,
        linkedMediaIdentifier: String? = nil
    ) {
        self.playlistRunID = playlistRunID
        self.playlistName = playlistName
        self.playlistItemIndex = playlistItemIndex
        self.playlistItemCount = playlistItemCount
        self.customPlayID = customPlayID
        self.customPlayName = customPlayName
        self.recordingLabel = recordingLabel
        self.linkedMediaIdentifier = linkedMediaIdentifier
    }
}

public struct SessionLog: Identifiable, Codable, Equatable, Sendable {
    public var id: UUID
    public var meditationType: MeditationType
    public var source: SessionSource
    public var status: SessionStatus
    public var startedAt: Date
    public var endedAt: Date
    public var completedDurationSeconds: Int
    public var plannedDurationSeconds: Int?
    public var timerMode: TimerSettingsDraft.Mode?
    public var notes: String?
    public var context: SessionLogContext?

    public init(
        id: UUID = UUID(),
        meditationType: MeditationType,
        source: SessionSource,
        status: SessionStatus,
        startedAt: Date,
        endedAt: Date,
        completedDurationSeconds: Int,
        plannedDurationSeconds: Int? = nil,
        timerMode: TimerSettingsDraft.Mode? = nil,
        notes: String? = nil,
        context: SessionLogContext? = nil
    ) {
        self.id = id
        self.meditationType = meditationType
        self.source = source
        self.status = status
        self.startedAt = startedAt
        self.endedAt = endedAt
        self.completedDurationSeconds = completedDurationSeconds
        self.plannedDurationSeconds = plannedDurationSeconds
        self.timerMode = timerMode
        self.notes = notes
        self.context = context
    }
}

public struct ManualLogDraft: Codable, Equatable, Sendable {
    public var meditationType: MeditationType?
    public var durationMinutes: Int
    public var endedAt: Date
    public var notes: String

    public init(
        meditationType: MeditationType? = nil,
        durationMinutes: Int = 20,
        endedAt: Date = Date(),
        notes: String = ""
    ) {
        self.meditationType = meditationType
        self.durationMinutes = durationMinutes
        self.endedAt = endedAt
        self.notes = notes
    }
}

public struct CustomPlay: Identifiable, Codable, Equatable, Sendable {
    public var id: UUID
    public var name: String
    public var meditationType: MeditationType
    public var durationSeconds: Int
    public var startSoundName: String?
    public var endSoundName: String?
    public var recordingLabel: String?
    public var linkedMediaIdentifier: String?
    public var media: CustomPlayMedia?
    public var isFavorite: Bool

    public init(
        id: UUID = UUID(),
        name: String,
        meditationType: MeditationType,
        durationSeconds: Int,
        startSoundName: String? = nil,
        endSoundName: String? = nil,
        recordingLabel: String? = nil,
        linkedMediaIdentifier: String? = nil,
        media: CustomPlayMedia? = nil,
        isFavorite: Bool = false
    ) {
        self.id = id
        self.name = name
        self.meditationType = meditationType
        self.durationSeconds = durationSeconds
        self.startSoundName = startSoundName
        self.endSoundName = endSoundName
        self.recordingLabel = recordingLabel
        self.linkedMediaIdentifier = linkedMediaIdentifier
        self.media = media
        self.isFavorite = isFavorite
    }
}

public enum CustomPlayMediaAsset: String, CaseIterable, Codable, Sendable {
    case vipassanaSit20 = "Vipassana Sit (20 min)"

    public var id: String {
        switch self {
        case .vipassanaSit20:
            return "media-vipassana-sit-20"
        }
    }

    public var meditationType: MeditationType {
        switch self {
        case .vipassanaSit20:
            return .vipassana
        }
    }

    public var durationSeconds: Int {
        switch self {
        case .vipassanaSit20:
            return 1_200
        }
    }

    public var label: String {
        rawValue
    }

    public var relativePath: String {
        switch self {
        case .vipassanaSit20:
            return "custom-plays/vipassana-sit-20.mp3"
        }
    }

    public var bundledResourceName: String {
        switch self {
        case .vipassanaSit20:
            return "vipassana-sit-20"
        }
    }

    public var bundledResourceExtension: String {
        "mp3"
    }

    public var legacyIdentifiers: [String] {
        switch self {
        case .vipassanaSit20:
            return ["native-media-vipassana-sit-20"]
        }
    }

    public static func resolve(identifier: String?) -> CustomPlayMediaAsset? {
        guard let trimmedIdentifier = identifier?.trimmingCharacters(in: .whitespacesAndNewlines),
              trimmedIdentifier.isEmpty == false
        else {
            return nil
        }

        return allCases.first { asset in
            asset.id == trimmedIdentifier || asset.legacyIdentifiers.contains(trimmedIdentifier)
        }
    }
}

public enum CustomPlayMediaSource: String, Codable, Sendable {
    case bundledSample = "bundled-sample"
    case remote
    case legacyPlaceholder = "legacy-placeholder"
}

public struct CustomPlayMedia: Codable, Equatable, Sendable {
    public var id: String
    public var label: String
    public var source: CustomPlayMediaSource
    public var relativePath: String
    public var filePath: String?
    public var bundledAsset: CustomPlayMediaAsset?

    public init(
        id: String,
        label: String,
        source: CustomPlayMediaSource,
        relativePath: String,
        filePath: String? = nil,
        bundledAsset: CustomPlayMediaAsset? = nil
    ) {
        self.id = id
        self.label = label
        self.source = source
        self.relativePath = relativePath
        self.filePath = filePath
        self.bundledAsset = bundledAsset
    }

    public static func bundledSample(_ asset: CustomPlayMediaAsset) -> CustomPlayMedia {
        CustomPlayMedia(
            id: asset.id,
            label: asset.label,
            source: .bundledSample,
            relativePath: asset.relativePath,
            bundledAsset: asset
        )
    }

    public static func remote(
        id: String,
        label: String,
        relativePath: String,
        filePath: String
    ) -> CustomPlayMedia {
        CustomPlayMedia(
            id: id,
            label: label,
            source: .remote,
            relativePath: relativePath,
            filePath: filePath
        )
    }

    public var isPlayable: Bool {
        switch source {
        case .bundledSample:
            return bundledAsset != nil
        case .remote:
            return filePath?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false || relativePath.isEmpty == false
        case .legacyPlaceholder:
            return false
        }
    }

    public func canResolvePlaybackURL(apiBaseURL: URL?) -> Bool {
        guard isPlayable else {
            return false
        }

        switch source {
        case .bundledSample:
            return bundledAsset != nil
        case .remote:
            if let trimmedFilePath = filePath?.trimmingCharacters(in: .whitespacesAndNewlines),
               trimmedFilePath.isEmpty == false,
               let url = URL(string: trimmedFilePath),
               url.scheme != nil {
                return true
            }

            return apiBaseURL != nil
        case .legacyPlaceholder:
            return false
        }
    }

    public var sourceSummary: String {
        switch source {
        case .bundledSample:
            return "Bundled sample"
        case .remote:
            return "Backend linked"
        case .legacyPlaceholder:
            return "Legacy placeholder"
        }
    }

    public func updatedIdentifier(_ identifier: String?) -> CustomPlayMedia {
        guard let trimmedIdentifier = identifier?.trimmingCharacters(in: .whitespacesAndNewlines),
              trimmedIdentifier.isEmpty == false
        else {
            return self
        }

        var updatedMedia = self
        updatedMedia.id = trimmedIdentifier
        return updatedMedia
    }

    private enum CodingKeys: String, CodingKey {
        case id
        case label
        case source
        case relativePath
        case filePath
        case bundledAsset
    }

    private enum LegacyCodingKeys: String, CodingKey {
        case asset
    }

    private enum LegacyCustomPlayMediaAsset: String, Codable {
        case templeBellLoop = "Temple Bell loop"
        case gongLoop = "Gong loop"
    }

    public init(from decoder: Decoder) throws {
        if let container = try? decoder.container(keyedBy: CodingKeys.self),
           container.contains(.id) || container.contains(.source) || container.contains(.label) {
            id = try container.decode(String.self, forKey: .id)
            label = try container.decode(String.self, forKey: .label)
            source = try container.decode(CustomPlayMediaSource.self, forKey: .source)
            relativePath = try container.decode(String.self, forKey: .relativePath)
            filePath = try container.decodeIfPresent(String.self, forKey: .filePath)
            bundledAsset = try container.decodeIfPresent(CustomPlayMediaAsset.self, forKey: .bundledAsset)
            return
        }

        let legacyContainer = try decoder.container(keyedBy: LegacyCodingKeys.self)
        let legacyAsset = try legacyContainer.decode(LegacyCustomPlayMediaAsset.self, forKey: .asset)
        id = "legacy-\(legacyAsset.rawValue.lowercased().replacingOccurrences(of: " ", with: "-"))"
        label = legacyAsset.rawValue
        source = .legacyPlaceholder
        relativePath = ""
        filePath = nil
        bundledAsset = nil
    }
}

public struct CustomPlayDraft: Codable, Equatable, Sendable {
    public var id: UUID?
    public var name: String
    public var meditationType: MeditationType?
    public var durationMinutes: Int
    public var startSoundName: String?
    public var endSoundName: String?
    public var recordingLabel: String
    public var linkedMediaIdentifier: String
    public var media: CustomPlayMedia?
    public var isFavorite: Bool

    public init(
        id: UUID? = nil,
        name: String = "",
        meditationType: MeditationType? = nil,
        durationMinutes: Int = 20,
        startSoundName: String? = nil,
        endSoundName: String? = nil,
        recordingLabel: String = "",
        linkedMediaIdentifier: String = "",
        media: CustomPlayMedia? = nil,
        isFavorite: Bool = false
    ) {
        self.id = id
        self.name = name
        self.meditationType = meditationType
        self.durationMinutes = durationMinutes
        self.startSoundName = startSoundName
        self.endSoundName = endSoundName
        self.recordingLabel = recordingLabel
        self.linkedMediaIdentifier = linkedMediaIdentifier
        self.media = media
        self.isFavorite = isFavorite
    }
}

public struct LastUsedPracticeTarget: Codable, Equatable, Sendable {
    public enum Kind: String, Codable, CaseIterable, Sendable {
        case timer
        case customPlay = "custom-play"
        case playlist
    }

    public var kind: Kind
    public var title: String
    public var meditationType: MeditationType
    public var timerDraft: TimerSettingsDraft?
    public var customPlayID: UUID?
    public var playlistID: UUID?
    public var updatedAt: Date

    public init(
        kind: Kind,
        title: String,
        meditationType: MeditationType,
        timerDraft: TimerSettingsDraft? = nil,
        customPlayID: UUID? = nil,
        playlistID: UUID? = nil,
        updatedAt: Date = Date()
    ) {
        self.kind = kind
        self.title = title
        self.meditationType = meditationType
        self.timerDraft = timerDraft
        self.customPlayID = customPlayID
        self.playlistID = playlistID
        self.updatedAt = updatedAt
    }
}

public struct PlaylistItem: Identifiable, Codable, Equatable, Sendable {
    public enum Kind: String, Codable, CaseIterable, Sendable {
        case timer
        case customPlay = "custom-play"
    }

    public var id: UUID
    public var title: String
    public var kind: Kind
    public var durationSeconds: Int
    public var meditationType: MeditationType
    public var customPlayID: UUID?

    public init(
        id: UUID = UUID(),
        title: String,
        kind: Kind,
        durationSeconds: Int,
        meditationType: MeditationType,
        customPlayID: UUID? = nil
    ) {
        self.id = id
        self.title = title
        self.kind = kind
        self.durationSeconds = durationSeconds
        self.meditationType = meditationType
        self.customPlayID = customPlayID
    }
}

public struct Playlist: Identifiable, Codable, Equatable, Sendable {
    public var id: UUID
    public var name: String
    public var items: [PlaylistItem]
    public var gapSeconds: Int
    public var isFavorite: Bool

    public init(
        id: UUID = UUID(),
        name: String,
        items: [PlaylistItem],
        gapSeconds: Int = 0,
        isFavorite: Bool = false
    ) {
        self.id = id
        self.name = name
        self.items = items
        self.gapSeconds = gapSeconds
        self.isFavorite = isFavorite
    }

    public var totalDurationSeconds: Int {
        let itemDuration = items.reduce(0) { $0 + $1.durationSeconds }
        let totalGapDuration = max(0, items.count - 1) * gapSeconds
        return itemDuration + totalGapDuration
    }
}

public struct PlaylistDraftItem: Identifiable, Codable, Equatable, Sendable {
    public var id: UUID
    public var title: String
    public var kind: PlaylistItem.Kind
    public var durationMinutes: Int
    public var meditationType: MeditationType?
    public var customPlayID: UUID?

    public init(
        id: UUID = UUID(),
        title: String = "",
        kind: PlaylistItem.Kind = .timer,
        durationMinutes: Int = 10,
        meditationType: MeditationType? = nil,
        customPlayID: UUID? = nil
    ) {
        self.id = id
        self.title = title
        self.kind = kind
        self.durationMinutes = durationMinutes
        self.meditationType = meditationType
        self.customPlayID = customPlayID
    }
}

public struct PlaylistDraft: Codable, Equatable, Sendable {
    public var id: UUID?
    public var name: String
    public var items: [PlaylistDraftItem]
    public var gapSeconds: Int
    public var isFavorite: Bool

    public init(
        id: UUID? = nil,
        name: String = "",
        items: [PlaylistDraftItem] = [],
        gapSeconds: Int = 0,
        isFavorite: Bool = false
    ) {
        self.id = id
        self.name = name
        self.items = items
        self.gapSeconds = gapSeconds
        self.isFavorite = isFavorite
    }
}

public struct Sankalpa: Identifiable, Codable, Equatable, Sendable {
    public var id: UUID
    public var title: String
    public var kind: SankalpaKind
    public var targetValue: Int
    public var days: Int
    public var qualifyingDaysPerWeek: Int?
    public var meditationType: MeditationType?
    public var timeOfDayBucket: TimeOfDayBucket?
    public var observanceLabel: String?
    public var observanceRecords: [SankalpaObservanceRecord]
    public var createdAt: Date
    public var archived: Bool

    private enum CodingKeys: String, CodingKey {
        case id
        case title
        case kind
        case targetValue
        case days
        case qualifyingDaysPerWeek
        case meditationType
        case timeOfDayBucket
        case observanceLabel
        case observanceRecords
        case createdAt
        case archived
    }

    public init(
        id: UUID = UUID(),
        title: String,
        kind: SankalpaKind,
        targetValue: Int,
        days: Int,
        qualifyingDaysPerWeek: Int? = nil,
        meditationType: MeditationType? = nil,
        timeOfDayBucket: TimeOfDayBucket? = nil,
        observanceLabel: String? = nil,
        observanceRecords: [SankalpaObservanceRecord] = [],
        createdAt: Date = Date(),
        archived: Bool = false
    ) {
        self.id = id
        self.title = title
        self.kind = kind
        self.targetValue = targetValue
        self.days = days
        self.qualifyingDaysPerWeek = qualifyingDaysPerWeek
        self.meditationType = meditationType
        self.timeOfDayBucket = timeOfDayBucket
        self.observanceLabel = observanceLabel
        self.observanceRecords = observanceRecords
        self.createdAt = createdAt
        self.archived = archived
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let days = try container.decode(Int.self, forKey: .days)

        id = try container.decode(UUID.self, forKey: .id)
        title = try container.decode(String.self, forKey: .title)
        kind = try container.decode(SankalpaKind.self, forKey: .kind)
        targetValue = try container.decode(Int.self, forKey: .targetValue)
        self.days = days
        qualifyingDaysPerWeek = try container.decodeIfPresent(Int.self, forKey: .qualifyingDaysPerWeek)
        meditationType = try container.decodeIfPresent(MeditationType.self, forKey: .meditationType)
        timeOfDayBucket = try container.decodeIfPresent(TimeOfDayBucket.self, forKey: .timeOfDayBucket)
        observanceLabel = try container.decodeIfPresent(String.self, forKey: .observanceLabel)
        observanceRecords = try container.decodeIfPresent([SankalpaObservanceRecord].self, forKey: .observanceRecords) ?? []
        createdAt = try container.decodeIfPresent(Date.self, forKey: .createdAt) ?? Self.legacyCreatedAt(days: days)
        archived = try container.decodeIfPresent(Bool.self, forKey: .archived) ?? false

        if kind != .observanceBased {
            observanceRecords = []
        }
        if kind == .observanceBased {
            qualifyingDaysPerWeek = nil
            meditationType = nil
            timeOfDayBucket = nil
        }
    }

    private static func legacyCreatedAt(days: Int) -> Date {
        let today = Calendar.current.startOfDay(for: Date())
        return Calendar.current.date(byAdding: .day, value: -(max(1, days) - 1), to: today) ?? today
    }
}

public enum SankalpaObservanceRecordStatus: String, Codable, CaseIterable, Sendable {
    case observed
    case missed

    public var title: String {
        switch self {
        case .observed:
            return "Observed"
        case .missed:
            return "Missed"
        }
    }
}

public enum SankalpaObservanceDayStatus: String, Codable, CaseIterable, Sendable {
    case pending
    case observed
    case missed

    public var title: String {
        switch self {
        case .pending:
            return "Pending"
        case .observed:
            return "Observed"
        case .missed:
            return "Missed"
        }
    }
}

public enum SankalpaStatus: String, Codable, CaseIterable, Sendable {
    case active
    case completed
    case expired
    case archived
}

public enum SankalpaCadenceMode: String, Codable, CaseIterable, Sendable {
    case cumulative
    case weekly
}

public enum SankalpaRecurringWeekStatus: String, Codable, CaseIterable, Sendable {
    case met
    case active
    case missed
    case upcoming
}

public struct SankalpaObservanceRecord: Codable, Equatable, Sendable {
    public var dateKey: String
    public var status: SankalpaObservanceRecordStatus

    public init(dateKey: String, status: SankalpaObservanceRecordStatus) {
        self.dateKey = dateKey
        self.status = status
    }
}

public struct SankalpaObservanceDay: Identifiable, Equatable, Sendable {
    public var id: String {
        dateKey
    }

    public var dateKey: String
    public var status: SankalpaObservanceDayStatus
    public var isFuture: Bool

    public init(dateKey: String, status: SankalpaObservanceDayStatus, isFuture: Bool) {
        self.dateKey = dateKey
        self.status = status
        self.isFuture = isFuture
    }
}

public struct SankalpaRecurringWeekProgress: Identifiable, Equatable, Sendable {
    public var id: Int {
        weekIndex
    }

    public var weekIndex: Int
    public var startDateKey: String
    public var endDateKey: String
    public var qualifyingDayCount: Int
    public var requiredQualifyingDayCount: Int
    public var status: SankalpaRecurringWeekStatus

    public init(
        weekIndex: Int,
        startDateKey: String,
        endDateKey: String,
        qualifyingDayCount: Int,
        requiredQualifyingDayCount: Int,
        status: SankalpaRecurringWeekStatus
    ) {
        self.weekIndex = weekIndex
        self.startDateKey = startDateKey
        self.endDateKey = endDateKey
        self.qualifyingDayCount = qualifyingDayCount
        self.requiredQualifyingDayCount = requiredQualifyingDayCount
        self.status = status
    }
}

public struct SankalpaDraft: Equatable, Sendable {
    public var title: String
    public var kind: SankalpaKind
    public var cadenceMode: SankalpaCadenceMode
    public var targetValue: Int
    public var days: Int
    public var weeks: Int
    public var qualifyingDaysPerWeek: Int
    public var meditationType: MeditationType?
    public var timeOfDayBucket: TimeOfDayBucket?
    public var observanceLabel: String

    public init(
        title: String = "",
        kind: SankalpaKind = .durationBased,
        cadenceMode: SankalpaCadenceMode = .cumulative,
        targetValue: Int = 120,
        days: Int = 7,
        weeks: Int = 1,
        qualifyingDaysPerWeek: Int = 5,
        meditationType: MeditationType? = nil,
        timeOfDayBucket: TimeOfDayBucket? = nil,
        observanceLabel: String = ""
    ) {
        self.title = title
        self.kind = kind
        self.cadenceMode = cadenceMode
        self.targetValue = targetValue
        self.days = days
        self.weeks = weeks
        self.qualifyingDaysPerWeek = qualifyingDaysPerWeek
        self.meditationType = meditationType
        self.timeOfDayBucket = timeOfDayBucket
        self.observanceLabel = observanceLabel
    }
}

public struct SankalpaProgress: Identifiable, Equatable, Sendable {
    public var id: UUID {
        goal.id
    }

    public var goal: Sankalpa
    public var status: SankalpaStatus
    public var deadlineAt: Date
    public var matchedSessionCount: Int
    public var matchedDurationSeconds: Int
    public var targetSessionCount: Int
    public var targetDurationSeconds: Int
    public var metRecurringWeekCount: Int
    public var targetRecurringWeekCount: Int
    public var recurringWeeks: [SankalpaRecurringWeekProgress]
    public var matchedObservanceCount: Int
    public var missedObservanceCount: Int
    public var pendingObservanceCount: Int
    public var targetObservanceCount: Int
    public var observanceDays: [SankalpaObservanceDay]
    public var progressRatio: Double

    public init(
        goal: Sankalpa,
        status: SankalpaStatus,
        deadlineAt: Date,
        matchedSessionCount: Int,
        matchedDurationSeconds: Int,
        targetSessionCount: Int,
        targetDurationSeconds: Int,
        metRecurringWeekCount: Int,
        targetRecurringWeekCount: Int,
        recurringWeeks: [SankalpaRecurringWeekProgress],
        matchedObservanceCount: Int,
        missedObservanceCount: Int,
        pendingObservanceCount: Int,
        targetObservanceCount: Int,
        observanceDays: [SankalpaObservanceDay],
        progressRatio: Double
    ) {
        self.goal = goal
        self.status = status
        self.deadlineAt = deadlineAt
        self.matchedSessionCount = matchedSessionCount
        self.matchedDurationSeconds = matchedDurationSeconds
        self.targetSessionCount = targetSessionCount
        self.targetDurationSeconds = targetDurationSeconds
        self.metRecurringWeekCount = metRecurringWeekCount
        self.targetRecurringWeekCount = targetRecurringWeekCount
        self.recurringWeeks = recurringWeeks
        self.matchedObservanceCount = matchedObservanceCount
        self.missedObservanceCount = missedObservanceCount
        self.pendingObservanceCount = pendingObservanceCount
        self.targetObservanceCount = targetObservanceCount
        self.observanceDays = observanceDays
        self.progressRatio = progressRatio
    }
}

public struct SankalpaProgressGroups: Equatable, Sendable {
    public var active: [SankalpaProgress]
    public var completed: [SankalpaProgress]
    public var expired: [SankalpaProgress]
    public var archived: [SankalpaProgress]

    public init(
        active: [SankalpaProgress],
        completed: [SankalpaProgress],
        expired: [SankalpaProgress],
        archived: [SankalpaProgress]
    ) {
        self.active = active
        self.completed = completed
        self.expired = expired
        self.archived = archived
    }
}

public struct TodayActivitySummary: Equatable, Sendable {
    public var sessionLogCount: Int
    public var completedCount: Int
    public var endedEarlyCount: Int
    public var totalDurationSeconds: Int

    public init(
        sessionLogCount: Int = 0,
        completedCount: Int = 0,
        endedEarlyCount: Int = 0,
        totalDurationSeconds: Int = 0
    ) {
        self.sessionLogCount = sessionLogCount
        self.completedCount = completedCount
        self.endedEarlyCount = endedEarlyCount
        self.totalDurationSeconds = totalDurationSeconds
    }
}

public struct OverallSummary: Equatable, Sendable {
    public var totalSessionLogs: Int
    public var completedSessionLogs: Int
    public var endedEarlySessionLogs: Int
    public var totalDurationSeconds: Int
    public var averageDurationSeconds: Int
    public var manualLogs: Int
    public var guidedLogs: Int

    public init(
        totalSessionLogs: Int = 0,
        completedSessionLogs: Int = 0,
        endedEarlySessionLogs: Int = 0,
        totalDurationSeconds: Int = 0,
        averageDurationSeconds: Int = 0,
        manualLogs: Int = 0,
        guidedLogs: Int = 0
    ) {
        self.totalSessionLogs = totalSessionLogs
        self.completedSessionLogs = completedSessionLogs
        self.endedEarlySessionLogs = endedEarlySessionLogs
        self.totalDurationSeconds = totalDurationSeconds
        self.averageDurationSeconds = averageDurationSeconds
        self.manualLogs = manualLogs
        self.guidedLogs = guidedLogs
    }
}

public struct SummaryByMeditationType: Identifiable, Equatable, Sendable {
    public var id: MeditationType {
        meditationType
    }

    public var meditationType: MeditationType
    public var sessionLogs: Int
    public var totalDurationSeconds: Int

    public init(meditationType: MeditationType, sessionLogs: Int, totalDurationSeconds: Int) {
        self.meditationType = meditationType
        self.sessionLogs = sessionLogs
        self.totalDurationSeconds = totalDurationSeconds
    }
}

public struct SummaryBySource: Identifiable, Equatable, Sendable {
    public var id: SessionSource {
        source
    }

    public var source: SessionSource
    public var sessionLogs: Int
    public var completedSessionLogs: Int
    public var endedEarlySessionLogs: Int
    public var totalDurationSeconds: Int

    public init(
        source: SessionSource,
        sessionLogs: Int,
        completedSessionLogs: Int,
        endedEarlySessionLogs: Int,
        totalDurationSeconds: Int
    ) {
        self.source = source
        self.sessionLogs = sessionLogs
        self.completedSessionLogs = completedSessionLogs
        self.endedEarlySessionLogs = endedEarlySessionLogs
        self.totalDurationSeconds = totalDurationSeconds
    }
}

public struct SummaryByTimeOfDay: Identifiable, Equatable, Sendable {
    public var id: TimeOfDayBucket {
        timeOfDayBucket
    }

    public var timeOfDayBucket: TimeOfDayBucket
    public var sessionLogs: Int
    public var totalDurationSeconds: Int

    public init(timeOfDayBucket: TimeOfDayBucket, sessionLogs: Int, totalDurationSeconds: Int) {
        self.timeOfDayBucket = timeOfDayBucket
        self.sessionLogs = sessionLogs
        self.totalDurationSeconds = totalDurationSeconds
    }
}

public struct LocalSummarySnapshot: Equatable, Sendable {
    public var overall: OverallSummary
    public var byMeditationType: [SummaryByMeditationType]
    public var bySource: [SummaryBySource]
    public var byTimeOfDay: [SummaryByTimeOfDay]
    public var sessionLogs: [SessionLog]

    public init(
        overall: OverallSummary,
        byMeditationType: [SummaryByMeditationType],
        bySource: [SummaryBySource],
        byTimeOfDay: [SummaryByTimeOfDay],
        sessionLogs: [SessionLog]
    ) {
        self.overall = overall
        self.byMeditationType = byMeditationType
        self.bySource = bySource
        self.byTimeOfDay = byTimeOfDay
        self.sessionLogs = sessionLogs
    }
}

public struct SummaryDateRange: Equatable, Sendable {
    public var startDate: Date
    public var endDate: Date

    public init(startDate: Date, endDate: Date) {
        self.startDate = startDate
        self.endDate = endDate
    }

    public var isValid: Bool {
        startDate <= endDate
    }
}

public enum SummaryRangePreset: String, CaseIterable, Codable, Sendable {
    case allTime = "all-time"
    case last7Days = "last-7-days"
    case last30Days = "last-30-days"
    case custom = "custom"

    public var title: String {
        switch self {
        case .allTime:
            return "All"
        case .last7Days:
            return "7d"
        case .last30Days:
            return "30d"
        case .custom:
            return "Custom"
        }
    }
}

public struct SummarySnapshot: Codable, Equatable, Sendable {
    public struct SummaryRow: Identifiable, Codable, Equatable, Sendable {
        public var id: UUID
        public var label: String
        public var value: String

        public init(id: UUID = UUID(), label: String, value: String) {
            self.id = id
            self.label = label
            self.value = value
        }
    }

    public var overallRows: [SummaryRow]
    public var byMeditationTypeRows: [SummaryRow]
    public var bySourceRows: [SummaryRow]
    public var byTimeOfDayRows: [SummaryRow]

    private enum CodingKeys: String, CodingKey {
        case overallRows
        case byMeditationTypeRows
        case bySourceRows
        case byTimeOfDayRows
    }

    public init(
        overallRows: [SummaryRow],
        byMeditationTypeRows: [SummaryRow],
        bySourceRows: [SummaryRow] = [],
        byTimeOfDayRows: [SummaryRow] = []
    ) {
        self.overallRows = overallRows
        self.byMeditationTypeRows = byMeditationTypeRows
        self.bySourceRows = bySourceRows
        self.byTimeOfDayRows = byTimeOfDayRows
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        overallRows = try container.decodeIfPresent([SummaryRow].self, forKey: .overallRows) ?? []
        byMeditationTypeRows = try container.decodeIfPresent([SummaryRow].self, forKey: .byMeditationTypeRows) ?? []
        bySourceRows = try container.decodeIfPresent([SummaryRow].self, forKey: .bySourceRows) ?? []
        byTimeOfDayRows = try container.decodeIfPresent([SummaryRow].self, forKey: .byTimeOfDayRows) ?? []
    }
}
