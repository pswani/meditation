import Foundation

public enum MeditationType: String, CaseIterable, Codable, Sendable {
    case vipassana = "Vipassana"
    case ajapa = "Ajapa"
    case tratak = "Tratak"
    case kriya = "Kriya"
    case sahaj = "Sahaj"
}

public enum TimerSoundOption: String, Codable, Sendable {
    case templeBell = "Temple Bell"
    case gong = "Gong"
    case softChime = "Soft Chime"
    case woodBlock = "Wood Block"
}

public enum TimerSoundCatalog {
    public static let noneLabel = "None"
    public static let selectableOptions: [TimerSoundOption] = [
        .templeBell,
        .gong,
    ]

    public static let selectableLabels = selectableOptions.map(\.rawValue)

    private static let legacyLabelMap: [String: String] = [
        TimerSoundOption.softChime.rawValue: TimerSoundOption.templeBell.rawValue,
        TimerSoundOption.woodBlock.rawValue: TimerSoundOption.gong.rawValue,
    ]

    public static func normalizeSelection(_ label: String?) -> String? {
        guard let trimmedLabel = label?.trimmingCharacters(in: .whitespacesAndNewlines),
              trimmedLabel.isEmpty == false,
              trimmedLabel != noneLabel
        else {
            return nil
        }

        let normalizedLabel = legacyLabelMap[trimmedLabel] ?? trimmedLabel
        return selectableLabels.contains(normalizedLabel) ? normalizedLabel : nil
    }

    public static func bundledFilename(for label: String?) -> String? {
        switch normalizeSelection(label) {
        case TimerSoundOption.templeBell.rawValue:
            return "temple-bell.mp3"
        case TimerSoundOption.gong.rawValue:
            return "gong.mp3"
        default:
            return nil
        }
    }

    public static func bundledResourceName(for label: String?) -> String? {
        bundledFilename(for: label)?
            .replacingOccurrences(of: ".mp3", with: "")
    }
}

public enum SessionSource: String, CaseIterable, Codable, Sendable {
    case timer = "timer"
    case manual = "manual"
    case customPlay = "custom-play"
    case playlist = "playlist"

    public var title: String {
        switch self {
        case .timer:
            return "Timer"
        case .manual:
            return "Manual"
        case .customPlay:
            return "Custom play"
        case .playlist:
            return "Playlist"
        }
    }
}

public enum SessionStatus: String, CaseIterable, Codable, Sendable {
    case completed
    case endedEarly = "ended-early"
    case inProgress = "in-progress"

    public var title: String {
        switch self {
        case .completed:
            return "Completed"
        case .endedEarly:
            return "Ended early"
        case .inProgress:
            return "In progress"
        }
    }
}

public enum SankalpaKind: String, CaseIterable, Sendable {
    case durationBased = "duration-based"
    case sessionCount = "session-count-based"
    case observanceBased = "observance-based"

    public var title: String {
        switch self {
        case .durationBased:
            return "Duration goal"
        case .sessionCount:
            return "Session-count goal"
        case .observanceBased:
            return "Observance goal"
        }
    }
}

extension SankalpaKind: Codable {
    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let rawValue = try container.decode(String.self)

        switch rawValue {
        case SankalpaKind.durationBased.rawValue:
            self = .durationBased
        case "session-count", SankalpaKind.sessionCount.rawValue:
            self = .sessionCount
        case SankalpaKind.observanceBased.rawValue:
            self = .observanceBased
        default:
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unsupported sankalpa kind: \(rawValue)")
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}

public enum TimeOfDayBucket: String, CaseIterable, Codable, Sendable {
    case morning
    case afternoon
    case evening
    case night

    public var title: String {
        switch self {
        case .morning:
            return "Morning"
        case .afternoon:
            return "Afternoon"
        case .evening:
            return "Evening"
        case .night:
            return "Night"
        }
    }

    public var detail: String {
        switch self {
        case .morning:
            return "5:00-11:59"
        case .afternoon:
            return "12:00-16:59"
        case .evening:
            return "17:00-20:59"
        case .night:
            return "21:00-4:59"
        }
    }
}

public enum AppDestination: String, CaseIterable, Codable, Sendable {
    case home = "Home"
    case practice = "Practice"
    case history = "History"
    case goals = "Goals"
    case settings = "Settings"
}

public enum ReferenceData {
    public static let primaryDestinations = AppDestination.allCases
    public static let meditationTypes = MeditationType.allCases
    public static let timerSoundOptions = TimerSoundCatalog.selectableOptions
    public static let sessionSources = SessionSource.allCases
    public static let sankalpaKinds = SankalpaKind.allCases
    public static let timeOfDayBuckets = TimeOfDayBucket.allCases
    public static let customPlayMediaAssets = CustomPlayMediaAsset.allCases
}
