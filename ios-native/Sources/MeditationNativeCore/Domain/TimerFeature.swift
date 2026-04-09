import Foundation

public enum TimerValidationError: String, Error, Equatable, Sendable {
    case durationMustBeGreaterThanZero
    case meditationTypeRequired
    case intervalMustBeGreaterThanZero
    case intervalRequiresSound
    case intervalMustFitWithinSession

    public var message: String {
        switch self {
        case .durationMustBeGreaterThanZero:
            return "Enter a duration greater than 0 minutes."
        case .meditationTypeRequired:
            return "Choose a meditation type."
        case .intervalMustBeGreaterThanZero:
            return "Choose an interval greater than 0 minutes."
        case .intervalRequiresSound:
            return "Choose an interval sound to enable interval cues."
        case .intervalMustFitWithinSession:
            return "Each interval must be shorter than the total session."
        }
    }
}

public enum ManualLogValidationError: String, Error, Equatable, Sendable {
    case meditationTypeRequired
    case durationMustBeGreaterThanZero
    case timestampRequired

    public var message: String {
        switch self {
        case .meditationTypeRequired:
            return "Choose a meditation type."
        case .durationMustBeGreaterThanZero:
            return "Enter a duration greater than 0 minutes."
        case .timestampRequired:
            return "Choose when the session happened."
        }
    }
}

public enum CustomPlayValidationError: String, Error, Equatable, Sendable {
    case nameRequired
    case meditationTypeRequired
    case durationMustBeGreaterThanZero
    case mediaRequired

    public var message: String {
        switch self {
        case .nameRequired:
            return "Enter a name for the custom play."
        case .meditationTypeRequired:
            return "Choose a meditation type."
        case .durationMustBeGreaterThanZero:
            return "Choose a duration greater than 0 minutes."
        case .mediaRequired:
            return "Choose bundled placeholder audio before saving."
        }
    }
}

public enum PlaylistValidationError: String, Error, Equatable, Sendable {
    case nameRequired
    case itemsRequired
    case gapMustNotBeNegative
    case itemTitleRequired
    case itemDurationMustBeGreaterThanZero
    case meditationTypeRequired
    case customPlayRequired
    case customPlayMissing
    case customPlayNeedsMedia

    public var message: String {
        switch self {
        case .nameRequired:
            return "Enter a playlist name."
        case .itemsRequired:
            return "Add at least 1 item to the playlist."
        case .gapMustNotBeNegative:
            return "Choose a gap of 0 seconds or more."
        case .itemTitleRequired:
            return "Enter a title for each timer item."
        case .itemDurationMustBeGreaterThanZero:
            return "Choose an item duration greater than 0 minutes."
        case .meditationTypeRequired:
            return "Choose a meditation type."
        case .customPlayRequired:
            return "Choose a saved custom play for this playlist item."
        case .customPlayMissing:
            return "A linked custom play is no longer available."
        case .customPlayNeedsMedia:
            return "A linked custom play still needs bundled placeholder audio before this playlist can run."
        }
    }
}

public struct TimerSessionConfiguration: Equatable, Sendable {
    public var mode: TimerSettingsDraft.Mode
    public var durationSeconds: Int?
    public var meditationType: MeditationType
    public var startSoundName: String?
    public var endSoundName: String?
    public var intervalSoundName: String?
    public var intervalMinutes: Int?

    public init(
        mode: TimerSettingsDraft.Mode,
        durationSeconds: Int?,
        meditationType: MeditationType,
        startSoundName: String?,
        endSoundName: String?,
        intervalSoundName: String?,
        intervalMinutes: Int?
    ) {
        self.mode = mode
        self.durationSeconds = durationSeconds
        self.meditationType = meditationType
        self.startSoundName = startSoundName
        self.endSoundName = endSoundName
        self.intervalSoundName = intervalSoundName
        self.intervalMinutes = intervalMinutes
    }
}

public struct ActiveTimerSession: Identifiable, Equatable, Sendable {
    public var id: UUID
    public var configuration: TimerSessionConfiguration
    public var startedAt: Date
    public var accumulatedPauseSeconds: TimeInterval
    public var pausedAt: Date?
    public var lastCompletedIntervalCount: Int

    public init(
        id: UUID = UUID(),
        configuration: TimerSessionConfiguration,
        startedAt: Date,
        accumulatedPauseSeconds: TimeInterval = 0,
        pausedAt: Date? = nil,
        lastCompletedIntervalCount: Int = 0
    ) {
        self.id = id
        self.configuration = configuration
        self.startedAt = startedAt
        self.accumulatedPauseSeconds = accumulatedPauseSeconds
        self.pausedAt = pausedAt
        self.lastCompletedIntervalCount = lastCompletedIntervalCount
    }

    public var isPaused: Bool {
        pausedAt != nil
    }

    public var isFixedDuration: Bool {
        configuration.mode == .fixedDuration
    }

    public func elapsedSeconds(at now: Date) -> Int {
        let effectiveNow = pausedAt ?? now
        let rawElapsed = effectiveNow.timeIntervalSince(startedAt) - accumulatedPauseSeconds
        return max(0, Int(rawElapsed.rounded(.down)))
    }

    public func remainingSeconds(at now: Date) -> Int? {
        guard let durationSeconds = configuration.durationSeconds else {
            return nil
        }

        return max(0, durationSeconds - elapsedSeconds(at: now))
    }

    public func targetEndAt() -> Date? {
        guard let durationSeconds = configuration.durationSeconds else {
            return nil
        }

        return startedAt
            .addingTimeInterval(TimeInterval(durationSeconds))
            .addingTimeInterval(accumulatedPauseSeconds)
    }

    public mutating func pause(at now: Date) {
        guard pausedAt == nil else {
            return
        }

        pausedAt = now
    }

    public mutating func resume(at now: Date) {
        guard let pausedAt else {
            return
        }

        accumulatedPauseSeconds += now.timeIntervalSince(pausedAt)
        self.pausedAt = nil
    }

    public mutating func nextDueIntervalCount(at now: Date) -> Int? {
        guard
            let intervalMinutes = configuration.intervalMinutes,
            let intervalSoundName = configuration.intervalSoundName,
            intervalSoundName.isEmpty == false
        else {
            return nil
        }

        let intervalSeconds = intervalMinutes * 60
        guard intervalSeconds > 0 else {
            return nil
        }

        let completedIntervalCount = elapsedSeconds(at: now) / intervalSeconds
        guard completedIntervalCount > lastCompletedIntervalCount else {
            return nil
        }

        lastCompletedIntervalCount = completedIntervalCount
        return completedIntervalCount
    }

    public func makeSessionLog(status: SessionStatus, endedAt: Date) -> SessionLog {
        let actualDurationSeconds = elapsedSeconds(at: endedAt)
        let completedDurationSeconds: Int

        switch status {
        case .completed:
            if let plannedDurationSeconds = configuration.durationSeconds {
                completedDurationSeconds = min(actualDurationSeconds, plannedDurationSeconds)
            } else {
                completedDurationSeconds = actualDurationSeconds
            }
        case .endedEarly, .inProgress:
            completedDurationSeconds = actualDurationSeconds
        }

        return SessionLog(
            meditationType: configuration.meditationType,
            source: .timer,
            status: status,
            startedAt: startedAt,
            endedAt: endedAt,
            completedDurationSeconds: completedDurationSeconds,
            plannedDurationSeconds: configuration.durationSeconds,
            timerMode: configuration.mode
        )
    }
}

public struct ActiveCustomPlaySession: Identifiable, Equatable, Sendable {
    public var id: UUID
    public var customPlay: CustomPlay
    public var startedAt: Date
    public var accumulatedPauseSeconds: TimeInterval
    public var pausedAt: Date?

    public init(
        id: UUID = UUID(),
        customPlay: CustomPlay,
        startedAt: Date,
        accumulatedPauseSeconds: TimeInterval = 0,
        pausedAt: Date? = nil
    ) {
        self.id = id
        self.customPlay = customPlay
        self.startedAt = startedAt
        self.accumulatedPauseSeconds = accumulatedPauseSeconds
        self.pausedAt = pausedAt
    }

    public var isPaused: Bool {
        pausedAt != nil
    }

    public func elapsedSeconds(at now: Date) -> Int {
        let effectiveNow = pausedAt ?? now
        let rawElapsed = effectiveNow.timeIntervalSince(startedAt) - accumulatedPauseSeconds
        return max(0, Int(rawElapsed.rounded(.down)))
    }

    public func remainingSeconds(at now: Date) -> Int {
        max(0, customPlay.durationSeconds - elapsedSeconds(at: now))
    }

    public mutating func pause(at now: Date) {
        guard pausedAt == nil else {
            return
        }

        pausedAt = now
    }

    public mutating func resume(at now: Date) {
        guard let pausedAt else {
            return
        }

        accumulatedPauseSeconds += now.timeIntervalSince(pausedAt)
        self.pausedAt = nil
    }

    public func makeSessionLog(status: SessionStatus, endedAt: Date) -> SessionLog {
        CustomPlayFeature.makeSessionLog(
            for: customPlay,
            status: status,
            startedAt: startedAt,
            endedAt: endedAt
        )
    }
}

public enum PlaylistRunPhase: Equatable, Sendable {
    case item(index: Int)
    case gap(afterItemIndex: Int)
}

public struct PlaylistRunAdvanceResult: Equatable, Sendable {
    public var logs: [SessionLog]
    public var didAdvance: Bool
    public var finishedRun: Bool

    public init(
        logs: [SessionLog] = [],
        didAdvance: Bool = false,
        finishedRun: Bool = false
    ) {
        self.logs = logs
        self.didAdvance = didAdvance
        self.finishedRun = finishedRun
    }
}

public struct ActivePlaylistSession: Identifiable, Equatable, Sendable {
    public var id: UUID
    public var playlist: Playlist
    public var phase: PlaylistRunPhase
    public var phaseStartedAt: Date
    public var phaseAccumulatedPauseSeconds: TimeInterval
    public var pausedAt: Date?

    public init(
        id: UUID = UUID(),
        playlist: Playlist,
        phase: PlaylistRunPhase = .item(index: 0),
        phaseStartedAt: Date,
        phaseAccumulatedPauseSeconds: TimeInterval = 0,
        pausedAt: Date? = nil
    ) {
        self.id = id
        self.playlist = playlist
        self.phase = phase
        self.phaseStartedAt = phaseStartedAt
        self.phaseAccumulatedPauseSeconds = phaseAccumulatedPauseSeconds
        self.pausedAt = pausedAt
    }

    public var isPaused: Bool {
        pausedAt != nil
    }

    public var currentItem: PlaylistItem? {
        switch phase {
        case .item(let index):
            return playlist.items[safe: index]
        case .gap(let afterItemIndex):
            return playlist.items[safe: afterItemIndex]
        }
    }

    public var upcomingItem: PlaylistItem? {
        switch phase {
        case .item(let index):
            return playlist.items[safe: index + 1]
        case .gap(let afterItemIndex):
            return playlist.items[safe: afterItemIndex + 1]
        }
    }

    public func currentPhaseDurationSeconds() -> Int {
        switch phase {
        case .item(let index):
            return playlist.items[safe: index]?.durationSeconds ?? 0
        case .gap:
            return playlist.gapSeconds
        }
    }

    public func elapsedSecondsInPhase(at now: Date) -> Int {
        let effectiveNow = pausedAt ?? now
        let rawElapsed = effectiveNow.timeIntervalSince(phaseStartedAt) - phaseAccumulatedPauseSeconds
        return max(0, Int(rawElapsed.rounded(.down)))
    }

    public func remainingSecondsInPhase(at now: Date) -> Int {
        max(0, currentPhaseDurationSeconds() - elapsedSecondsInPhase(at: now))
    }

    public mutating func pause(at now: Date) {
        guard pausedAt == nil else {
            return
        }

        pausedAt = now
    }

    public mutating func resume(at now: Date) {
        guard let pausedAt else {
            return
        }

        phaseAccumulatedPauseSeconds += now.timeIntervalSince(pausedAt)
        self.pausedAt = nil
    }

    public mutating func advanceIfNeeded(at now: Date) -> PlaylistRunAdvanceResult {
        var logs: [SessionLog] = []
        var didAdvance = false

        while currentPhaseDurationSeconds() > 0,
              elapsedSecondsInPhase(at: now) >= currentPhaseDurationSeconds() {
            let completedAt = phaseStartedAt.addingTimeInterval(TimeInterval(currentPhaseDurationSeconds()))

            switch phase {
            case .item(let index):
                guard let item = playlist.items[safe: index] else {
                    return PlaylistRunAdvanceResult(logs: logs, didAdvance: didAdvance, finishedRun: true)
                }

                logs.append(
                    PlaylistFeature.makePlaylistItemLog(
                        playlistName: playlist.name,
                        item: item,
                        status: .completed,
                        startedAt: phaseStartedAt,
                        endedAt: completedAt
                    )
                )

                didAdvance = true

                if index == playlist.items.count - 1 {
                    return PlaylistRunAdvanceResult(logs: logs, didAdvance: didAdvance, finishedRun: true)
                }

                if playlist.gapSeconds > 0 {
                    phase = .gap(afterItemIndex: index)
                } else {
                    phase = .item(index: index + 1)
                }

                phaseStartedAt = completedAt
                phaseAccumulatedPauseSeconds = 0
                pausedAt = nil
            case .gap(let afterItemIndex):
                didAdvance = true
                phase = .item(index: afterItemIndex + 1)
                phaseStartedAt = completedAt
                phaseAccumulatedPauseSeconds = 0
                pausedAt = nil
            }
        }

        return PlaylistRunAdvanceResult(logs: logs, didAdvance: didAdvance, finishedRun: false)
    }

    public func makeCurrentItemEarlyStopLog(at endedAt: Date) -> SessionLog? {
        guard case .item = phase,
              let item = currentItem
        else {
            return nil
        }

        let practicedSeconds = min(item.durationSeconds, elapsedSecondsInPhase(at: endedAt))
        guard practicedSeconds > 0 else {
            return nil
        }

        let adjustedEndedAt = phaseStartedAt.addingTimeInterval(TimeInterval(practicedSeconds))
        return PlaylistFeature.makePlaylistItemLog(
            playlistName: playlist.name,
            item: item,
            status: .endedEarly,
            startedAt: phaseStartedAt,
            endedAt: adjustedEndedAt
        )
    }
}

public struct SessionLogFilter: Equatable, Sendable {
    public var meditationType: MeditationType?
    public var source: SessionSource?

    public init(
        meditationType: MeditationType? = nil,
        source: SessionSource? = nil
    ) {
        self.meditationType = meditationType
        self.source = source
    }
}

public enum CustomPlayFeature {
    public static func validateCustomPlayDraft(_ draft: CustomPlayDraft) -> [CustomPlayValidationError] {
        var errors: [CustomPlayValidationError] = []

        if draft.name.nilIfBlank == nil {
            errors.append(.nameRequired)
        }

        if draft.meditationType == nil {
            errors.append(.meditationTypeRequired)
        }

        if draft.durationMinutes <= 0 {
            errors.append(.durationMustBeGreaterThanZero)
        }

        if draft.mediaAsset == nil {
            errors.append(.mediaRequired)
        }

        return errors
    }

    public static func makeCustomPlay(
        from draft: CustomPlayDraft,
        existingID: UUID? = nil
    ) throws -> CustomPlay {
        if let firstError = validateCustomPlayDraft(draft).first {
            throw firstError
        }

        guard let meditationType = draft.meditationType else {
            throw CustomPlayValidationError.meditationTypeRequired
        }

        guard let mediaAsset = draft.mediaAsset else {
            throw CustomPlayValidationError.mediaRequired
        }

        return CustomPlay(
            id: existingID ?? draft.id ?? UUID(),
            name: draft.name.trimmingCharacters(in: .whitespacesAndNewlines),
            meditationType: meditationType,
            durationSeconds: draft.durationMinutes * 60,
            media: CustomPlayMedia(asset: mediaAsset),
            isFavorite: draft.isFavorite
        )
    }

    public static func makeDraft(from customPlay: CustomPlay) -> CustomPlayDraft {
        CustomPlayDraft(
            id: customPlay.id,
            name: customPlay.name,
            meditationType: customPlay.meditationType,
            durationMinutes: max(1, customPlay.durationSeconds / 60),
            mediaAsset: customPlay.media?.asset,
            isFavorite: customPlay.isFavorite
        )
    }

    public static func makeSessionLog(
        for customPlay: CustomPlay,
        status: SessionStatus,
        startedAt: Date,
        endedAt: Date,
        source: SessionSource = .customPlay,
        notesPrefix: String? = nil
    ) -> SessionLog {
        let actualDurationSeconds = max(0, Int(endedAt.timeIntervalSince(startedAt).rounded(.down)))
        let completedDurationSeconds: Int

        switch status {
        case .completed:
            completedDurationSeconds = min(actualDurationSeconds, customPlay.durationSeconds)
        case .endedEarly, .inProgress:
            completedDurationSeconds = actualDurationSeconds
        }

        let notePrefix = notesPrefix.map { "\($0): " } ?? ""

        return SessionLog(
            meditationType: customPlay.meditationType,
            source: source,
            status: status,
            startedAt: startedAt,
            endedAt: endedAt,
            completedDurationSeconds: completedDurationSeconds,
            plannedDurationSeconds: customPlay.durationSeconds,
            notes: "\(notePrefix)\(customPlay.name)"
        )
    }
}

public enum PlaylistFeature {
    public static func validatePlaylistDraft(
        _ draft: PlaylistDraft,
        availableCustomPlays: [CustomPlay]
    ) -> [PlaylistValidationError] {
        var errors: [PlaylistValidationError] = []

        if draft.name.nilIfBlank == nil {
            errors.append(.nameRequired)
        }

        if draft.gapSeconds < 0 {
            errors.append(.gapMustNotBeNegative)
        }

        if draft.items.isEmpty {
            errors.append(.itemsRequired)
        }

        for item in draft.items {
            switch item.kind {
            case .timer:
                if item.title.nilIfBlank == nil {
                    errors.append(.itemTitleRequired)
                }
                if item.durationMinutes <= 0 {
                    errors.append(.itemDurationMustBeGreaterThanZero)
                }
                if item.meditationType == nil {
                    errors.append(.meditationTypeRequired)
                }
            case .customPlay:
                guard let customPlayID = item.customPlayID else {
                    errors.append(.customPlayRequired)
                    continue
                }

                guard let customPlay = availableCustomPlays.first(where: { $0.id == customPlayID }) else {
                    errors.append(.customPlayMissing)
                    continue
                }

                if customPlay.media == nil {
                    errors.append(.customPlayNeedsMedia)
                }
            }
        }

        return errors
    }

    public static func makePlaylist(
        from draft: PlaylistDraft,
        availableCustomPlays: [CustomPlay],
        existingID: UUID? = nil
    ) throws -> Playlist {
        if let firstError = validatePlaylistDraft(draft, availableCustomPlays: availableCustomPlays).first {
            throw firstError
        }

        let resolvedItems = try draft.items.map { draftItem in
            switch draftItem.kind {
            case .timer:
                guard let meditationType = draftItem.meditationType else {
                    throw PlaylistValidationError.meditationTypeRequired
                }

                return PlaylistItem(
                    id: draftItem.id,
                    title: draftItem.title.trimmingCharacters(in: .whitespacesAndNewlines),
                    kind: .timer,
                    durationSeconds: draftItem.durationMinutes * 60,
                    meditationType: meditationType
                )
            case .customPlay:
                guard let customPlayID = draftItem.customPlayID else {
                    throw PlaylistValidationError.customPlayRequired
                }

                guard let customPlay = availableCustomPlays.first(where: { $0.id == customPlayID }) else {
                    throw PlaylistValidationError.customPlayMissing
                }

                guard customPlay.media != nil else {
                    throw PlaylistValidationError.customPlayNeedsMedia
                }

                return PlaylistItem(
                    id: draftItem.id,
                    title: customPlay.name,
                    kind: .customPlay,
                    durationSeconds: customPlay.durationSeconds,
                    meditationType: customPlay.meditationType,
                    customPlayID: customPlay.id
                )
            }
        }

        return Playlist(
            id: existingID ?? draft.id ?? UUID(),
            name: draft.name.trimmingCharacters(in: .whitespacesAndNewlines),
            items: resolvedItems,
            gapSeconds: draft.gapSeconds,
            isFavorite: draft.isFavorite
        )
    }

    public static func makeDraft(from playlist: Playlist) -> PlaylistDraft {
        PlaylistDraft(
            id: playlist.id,
            name: playlist.name,
            items: playlist.items.map { item in
                PlaylistDraftItem(
                    id: item.id,
                    title: item.title,
                    kind: item.kind,
                    durationMinutes: max(1, item.durationSeconds / 60),
                    meditationType: item.meditationType,
                    customPlayID: item.customPlayID
                )
            },
            gapSeconds: playlist.gapSeconds,
            isFavorite: playlist.isFavorite
        )
    }

    public static func validatePlaylistForRun(
        _ playlist: Playlist,
        availableCustomPlays: [CustomPlay]
    ) -> PlaylistValidationError? {
        for item in playlist.items where item.kind == .customPlay {
            guard let customPlayID = item.customPlayID else {
                return .customPlayRequired
            }

            guard let customPlay = availableCustomPlays.first(where: { $0.id == customPlayID }) else {
                return .customPlayMissing
            }

            if customPlay.media == nil {
                return .customPlayNeedsMedia
            }
        }

        return nil
    }

    public static func makePlaylistItemLog(
        playlistName: String,
        item: PlaylistItem,
        status: SessionStatus,
        startedAt: Date,
        endedAt: Date
    ) -> SessionLog {
        let actualDurationSeconds = max(0, Int(endedAt.timeIntervalSince(startedAt).rounded(.down)))
        let completedDurationSeconds: Int

        switch status {
        case .completed:
            completedDurationSeconds = min(actualDurationSeconds, item.durationSeconds)
        case .endedEarly, .inProgress:
            completedDurationSeconds = actualDurationSeconds
        }

        return SessionLog(
            meditationType: item.meditationType,
            source: .playlist,
            status: status,
            startedAt: startedAt,
            endedAt: endedAt,
            completedDurationSeconds: completedDurationSeconds,
            plannedDurationSeconds: item.durationSeconds,
            notes: "Playlist: \(playlistName) • Item: \(item.title)"
        )
    }
}

public enum TimerFeature {
    public static func validateTimerDraft(_ draft: TimerSettingsDraft) -> [TimerValidationError] {
        var errors: [TimerValidationError] = []

        if draft.mode == .fixedDuration, draft.durationMinutes <= 0 {
            errors.append(.durationMustBeGreaterThanZero)
        }

        if draft.meditationType == nil {
            errors.append(.meditationTypeRequired)
        }

        if draft.intervalSoundName != nil || draft.intervalMinutes != nil {
            if draft.intervalSoundName == nil {
                errors.append(.intervalRequiresSound)
            }

            if let intervalMinutes = draft.intervalMinutes {
                if intervalMinutes <= 0 {
                    errors.append(.intervalMustBeGreaterThanZero)
                }

                if draft.mode == .fixedDuration, intervalMinutes >= draft.durationMinutes {
                    errors.append(.intervalMustFitWithinSession)
                }
            } else {
                errors.append(.intervalMustBeGreaterThanZero)
            }
        }

        return errors
    }

    public static func makeConfiguration(from draft: TimerSettingsDraft) throws -> TimerSessionConfiguration {
        if let firstError = validateTimerDraft(draft).first {
            throw firstError
        }

        guard let meditationType = draft.meditationType else {
            throw TimerValidationError.meditationTypeRequired
        }

        return TimerSessionConfiguration(
            mode: draft.mode,
            durationSeconds: draft.mode == .fixedDuration ? draft.durationMinutes * 60 : nil,
            meditationType: meditationType,
            startSoundName: draft.startSoundName,
            endSoundName: draft.endSoundName,
            intervalSoundName: draft.intervalSoundName,
            intervalMinutes: draft.intervalMinutes
        )
    }

    public static func makeActiveSession(
        from draft: TimerSettingsDraft,
        now: Date = Date()
    ) throws -> ActiveTimerSession {
        ActiveTimerSession(
            configuration: try makeConfiguration(from: draft),
            startedAt: now
        )
    }

    public static func validateManualLogDraft(_ draft: ManualLogDraft) -> [ManualLogValidationError] {
        var errors: [ManualLogValidationError] = []

        if draft.meditationType == nil {
            errors.append(.meditationTypeRequired)
        }

        if draft.durationMinutes <= 0 {
            errors.append(.durationMustBeGreaterThanZero)
        }

        if draft.endedAt.timeIntervalSince1970 <= 0 {
            errors.append(.timestampRequired)
        }

        return errors
    }

    public static func makeManualLog(from draft: ManualLogDraft) throws -> SessionLog {
        if let firstError = validateManualLogDraft(draft).first {
            throw firstError
        }

        guard let meditationType = draft.meditationType else {
            throw ManualLogValidationError.meditationTypeRequired
        }

        let durationSeconds = draft.durationMinutes * 60
        let startedAt = draft.endedAt.addingTimeInterval(TimeInterval(-durationSeconds))

        return SessionLog(
            meditationType: meditationType,
            source: .manual,
            status: .completed,
            startedAt: startedAt,
            endedAt: draft.endedAt,
            completedDurationSeconds: durationSeconds,
            notes: draft.notes.nilIfBlank
        )
    }

    public static func filteredSessionLogs(
        _ logs: [SessionLog],
        using filter: SessionLogFilter
    ) -> [SessionLog] {
        logs
            .filter { log in
                let meditationTypeMatches = filter.meditationType.map { log.meditationType == $0 } ?? true
                let sourceMatches = filter.source.map { log.source == $0 } ?? true
                return meditationTypeMatches && sourceMatches
            }
            .sorted { $0.endedAt > $1.endedAt }
    }
}

private extension String {
    var nilIfBlank: String? {
        let trimmed = trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        guard indices.contains(index) else {
            return nil
        }

        return self[index]
    }
}
