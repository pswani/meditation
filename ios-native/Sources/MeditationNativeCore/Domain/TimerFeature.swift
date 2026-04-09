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
