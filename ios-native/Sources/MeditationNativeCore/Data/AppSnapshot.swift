import Foundation

public struct AppSnapshot: Codable, Equatable, Sendable {
    // Increment on each breaking schema change (adding non-optional fields, removing fields, etc.)
    public static let currentVersion = 2

    public var version: Int
    public var timerDraft: TimerSettingsDraft
    public var lastUsedPracticeTarget: LastUsedPracticeTarget?
    public var activeRuntime: ActivePracticeSnapshot?
    public var recentSessionLogs: [SessionLog]
    public var customPlays: [CustomPlay]
    public var playlists: [Playlist]
    public var sankalpas: [Sankalpa]
    public var summary: SummarySnapshot

    public init(
        timerDraft: TimerSettingsDraft,
        lastUsedPracticeTarget: LastUsedPracticeTarget? = nil,
        activeRuntime: ActivePracticeSnapshot? = nil,
        recentSessionLogs: [SessionLog],
        customPlays: [CustomPlay],
        playlists: [Playlist],
        sankalpas: [Sankalpa],
        summary: SummarySnapshot
    ) {
        self.version = Self.currentVersion
        self.timerDraft = timerDraft
        self.lastUsedPracticeTarget = lastUsedPracticeTarget
        self.activeRuntime = activeRuntime
        self.recentSessionLogs = recentSessionLogs
        self.customPlays = customPlays
        self.playlists = playlists
        self.sankalpas = sankalpas
        self.summary = summary
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let version = try container.decodeIfPresent(Int.self, forKey: .version) ?? 1

        self.timerDraft = try container.decode(TimerSettingsDraft.self, forKey: .timerDraft)
        self.lastUsedPracticeTarget = try container.decodeIfPresent(LastUsedPracticeTarget.self, forKey: .lastUsedPracticeTarget)
        self.activeRuntime = try container.decodeIfPresent(ActivePracticeSnapshot.self, forKey: .activeRuntime)
        self.recentSessionLogs = try container.decode([SessionLog].self, forKey: .recentSessionLogs)
        self.customPlays = try container.decode([CustomPlay].self, forKey: .customPlays)
        self.playlists = try container.decode([Playlist].self, forKey: .playlists)
        self.sankalpas = try container.decode([Sankalpa].self, forKey: .sankalpas)

        if version < 2 {
            // v1 → v2: summary field added; synthesize from session logs
            self.summary = SummaryFeature.makeStoredSummarySnapshot(from: self.recentSessionLogs)
        } else {
            self.summary = try container.decode(SummarySnapshot.self, forKey: .summary)
        }

        self.version = Self.currentVersion
    }

    private enum CodingKeys: String, CodingKey {
        case version
        case timerDraft
        case lastUsedPracticeTarget
        case activeRuntime
        case recentSessionLogs
        case customPlays
        case playlists
        case sankalpas
        case summary
    }
}
