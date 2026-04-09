import Foundation

public enum MeditationType: String, CaseIterable, Codable, Sendable {
    case vipassana = "Vipassana"
    case ajapa = "Ajapa"
    case tratak = "Tratak"
    case kriya = "Kriya"
    case sahaj = "Sahaj"
}

public enum SessionSource: String, CaseIterable, Codable, Sendable {
    case timer = "timer"
    case manual = "manual"
    case customPlay = "custom-play"
    case playlist = "playlist"
}

public enum SessionStatus: String, CaseIterable, Codable, Sendable {
    case completed
    case endedEarly = "ended-early"
    case inProgress = "in-progress"
}

public enum SankalpaKind: String, CaseIterable, Codable, Sendable {
    case durationBased = "duration-based"
    case sessionCount = "session-count"
    case observanceBased = "observance-based"
}

public enum TimeOfDayBucket: String, CaseIterable, Codable, Sendable {
    case morning
    case afternoon
    case evening
    case night
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
    public static let sessionSources = SessionSource.allCases
    public static let sankalpaKinds = SankalpaKind.allCases
    public static let timeOfDayBuckets = TimeOfDayBucket.allCases
}
