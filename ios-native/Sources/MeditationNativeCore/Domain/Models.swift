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
        notes: String? = nil
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
    public var media: CustomPlayMedia?
    public var isFavorite: Bool

    public init(
        id: UUID = UUID(),
        name: String,
        meditationType: MeditationType,
        durationSeconds: Int,
        media: CustomPlayMedia? = nil,
        isFavorite: Bool = false
    ) {
        self.id = id
        self.name = name
        self.meditationType = meditationType
        self.durationSeconds = durationSeconds
        self.media = media
        self.isFavorite = isFavorite
    }
}

public enum CustomPlayMediaAsset: String, CaseIterable, Codable, Sendable {
    case templeBellLoop = "Temple Bell loop"
    case gongLoop = "Gong loop"

    public var bundledResourceName: String {
        switch self {
        case .templeBellLoop:
            return "temple-bell"
        case .gongLoop:
            return "gong"
        }
    }

    public var bundledResourceExtension: String {
        "mp3"
    }
}

public struct CustomPlayMedia: Codable, Equatable, Sendable {
    public var asset: CustomPlayMediaAsset

    public init(asset: CustomPlayMediaAsset) {
        self.asset = asset
    }
}

public struct CustomPlayDraft: Codable, Equatable, Sendable {
    public var id: UUID?
    public var name: String
    public var meditationType: MeditationType?
    public var durationMinutes: Int
    public var mediaAsset: CustomPlayMediaAsset?
    public var isFavorite: Bool

    public init(
        id: UUID? = nil,
        name: String = "",
        meditationType: MeditationType? = nil,
        durationMinutes: Int = 20,
        mediaAsset: CustomPlayMediaAsset? = .templeBellLoop,
        isFavorite: Bool = false
    ) {
        self.id = id
        self.name = name
        self.meditationType = meditationType
        self.durationMinutes = durationMinutes
        self.mediaAsset = mediaAsset
        self.isFavorite = isFavorite
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
    public var meditationType: MeditationType?
    public var timeOfDayBucket: TimeOfDayBucket?
    public var observanceLabel: String?
    public var archived: Bool

    public init(
        id: UUID = UUID(),
        title: String,
        kind: SankalpaKind,
        targetValue: Int,
        days: Int,
        meditationType: MeditationType? = nil,
        timeOfDayBucket: TimeOfDayBucket? = nil,
        observanceLabel: String? = nil,
        archived: Bool = false
    ) {
        self.id = id
        self.title = title
        self.kind = kind
        self.targetValue = targetValue
        self.days = days
        self.meditationType = meditationType
        self.timeOfDayBucket = timeOfDayBucket
        self.observanceLabel = observanceLabel
        self.archived = archived
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

    public init(overallRows: [SummaryRow], byMeditationTypeRows: [SummaryRow]) {
        self.overallRows = overallRows
        self.byMeditationTypeRows = byMeditationTypeRows
    }
}
