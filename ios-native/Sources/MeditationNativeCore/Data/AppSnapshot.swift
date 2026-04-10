import Foundation

public struct AppSnapshot: Codable, Equatable, Sendable {
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
        self.timerDraft = timerDraft
        self.lastUsedPracticeTarget = lastUsedPracticeTarget
        self.activeRuntime = activeRuntime
        self.recentSessionLogs = recentSessionLogs
        self.customPlays = customPlays
        self.playlists = playlists
        self.sankalpas = sankalpas
        self.summary = summary
    }
}
