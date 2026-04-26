import Foundation

@MainActor
protocol TimerSessionCoordinatorDelegate: AnyObject {
    func timerSessionDidChange(_ session: ActiveTimerSession?)
    func timerValidationMessageDidChange(_ message: String?)
    func runtimeMessageDidChange(_ message: String?)
    func insertLogs(_ logs: [SessionLog])
    func persistSnapshot()
    func startClock()
    func stopClockIfIdle()
    func syncBackgroundAudioKeepAlive()
}

@MainActor
final class TimerSessionCoordinator {
    private(set) var session: ActiveTimerSession?
    weak var delegate: TimerSessionCoordinatorDelegate?

    private let soundPlayer: TimerSoundPlaying
    private let notificationScheduler: NotificationScheduling
    private let timerCompletionBridge: TimerCompletionBridging
    private let backgroundAudioKeepAlive: BackgroundAudioKeeping

    private var sessionResumedAt: ContinuousClock.Instant?
    private var sessionResumedAtWallDate: Date?

    init(
        soundPlayer: TimerSoundPlaying,
        notificationScheduler: NotificationScheduling,
        timerCompletionBridge: TimerCompletionBridging,
        backgroundAudioKeepAlive: BackgroundAudioKeeping
    ) {
        self.soundPlayer = soundPlayer
        self.notificationScheduler = notificationScheduler
        self.timerCompletionBridge = timerCompletionBridge
        self.backgroundAudioKeepAlive = backgroundAudioKeepAlive
    }

    var effectiveTimerNow: Date {
        guard let sessionResumedAt, let wallDate = sessionResumedAtWallDate else {
            return Date()
        }
        let elapsed = ContinuousClock().now - sessionResumedAt
        let (seconds, attoseconds) = elapsed.components
        let elapsedSeconds = TimeInterval(seconds) + TimeInterval(attoseconds) / 1_000_000_000_000_000_000
        return wallDate.addingTimeInterval(elapsedSeconds)
    }

    @discardableResult
    func start(using draft: TimerSettingsDraft, at now: Date) -> Bool {
        do {
            session = try TimerFeature.makeActiveSession(from: draft, now: now)
            delegate?.timerSessionDidChange(session)
            sessionResumedAt = ContinuousClock().now
            sessionResumedAtWallDate = now
            soundPlayer.playSound(named: session?.configuration.startSoundName)
            delegate?.syncBackgroundAudioKeepAlive()
            delegate?.startClock()
            rescheduleNotificationIfNeeded()
            return true
        } catch let error as TimerValidationError {
            delegate?.timerValidationMessageDidChange(error.message)
            return false
        } catch {
            delegate?.timerValidationMessageDidChange("The timer could not start with the current setup.")
            return false
        }
    }

    func pause(at now: Date) {
        guard var currentSession = session else { return }
        currentSession.pause(at: now)
        session = currentSession
        delegate?.timerSessionDidChange(session)
        sessionResumedAt = nil
        sessionResumedAtWallDate = nil
        delegate?.syncBackgroundAudioKeepAlive()
        delegate?.persistSnapshot()
        timerCompletionBridge.cancelTimerCompletionBridge()
        Task { [weak self] in
            guard let self else { return }
            await notificationScheduler.cancelTimerCompletionNotification()
        }
    }

    func resume(at now: Date) {
        guard var currentSession = session else { return }
        let resumedAt = Date()
        currentSession.resume(at: resumedAt)
        session = currentSession
        delegate?.timerSessionDidChange(session)
        sessionResumedAt = ContinuousClock().now
        sessionResumedAtWallDate = resumedAt
        delegate?.syncBackgroundAudioKeepAlive()
        delegate?.persistSnapshot()
        rescheduleNotificationIfNeeded()
    }

    func endManually(at now: Date) {
        guard let currentSession = session else { return }
        let status: SessionStatus = currentSession.configuration.mode == .fixedDuration ? .endedEarly : .completed
        finish(status: status, endedAt: now)
    }

    func tick(at timerNow: Date) {
        guard var currentSession = session else { return }
        let previousSession = currentSession

        if !currentSession.isPaused,
           currentSession.nextDueIntervalCount(at: timerNow) != nil {
            soundPlayer.playSound(named: currentSession.configuration.intervalSoundName)
        }

        session = currentSession
        delegate?.timerSessionDidChange(session)
        if currentSession != previousSession {
            delegate?.persistSnapshot()
        }

        if currentSession.configuration.mode == .fixedDuration,
           currentSession.remainingSeconds(at: timerNow) == 0 {
            let endedAt = currentSession.targetEndAt() ?? Date()
            finish(status: .completed, endedAt: endedAt)
        }
    }

    func restore(_ session: ActiveTimerSession, at now: Date) {
        var restoredSession = session

        if !restoredSession.isPaused,
           let intervalMinutes = restoredSession.configuration.intervalMinutes,
           intervalMinutes > 0 {
            let completedIntervals = restoredSession.elapsedSeconds(at: now) / (intervalMinutes * 60)
            restoredSession.lastCompletedIntervalCount = max(
                restoredSession.lastCompletedIntervalCount,
                completedIntervals
            )
        }

        self.session = restoredSession
        delegate?.timerSessionDidChange(self.session)

        if restoredSession.configuration.mode == .fixedDuration,
           restoredSession.remainingSeconds(at: now) == 0 {
            finishRecovered(endedAt: restoredSession.targetEndAt() ?? now)
            delegate?.runtimeMessageDidChange("The previous timer finished while the app was away and was saved to History.")
            return
        }

        if !restoredSession.isPaused {
            sessionResumedAt = ContinuousClock().now
            sessionResumedAtWallDate = now
        }

        delegate?.syncBackgroundAudioKeepAlive()
        delegate?.startClock()
        rescheduleNotificationIfNeeded()
        delegate?.persistSnapshot()
    }

    func prepareForBackgroundTransition() {
        if armCompletionBridgeIfNeeded() {
            rescheduleNotificationIfNeeded(coordination: .bridgeBackup)
        }
    }

    func handleForegroundTransition() {
        timerCompletionBridge.cancelTimerCompletionBridge()
        rescheduleNotificationIfNeeded()
    }

    // MARK: - Private

    private enum NotificationCoordination {
        case standard
        case bridgeBackup

        var backupDelaySeconds: TimeInterval {
            switch self {
            case .standard: return 0
            case .bridgeBackup: return 2
            }
        }
    }

    private func finish(status: SessionStatus, endedAt: Date) {
        guard let currentSession = session else { return }
        timerCompletionBridge.cancelTimerCompletionBridge()
        let log = currentSession.makeSessionLog(status: status, endedAt: endedAt)
        soundPlayer.playSound(named: currentSession.configuration.endSoundName)
        session = nil
        delegate?.timerSessionDidChange(nil)
        sessionResumedAt = nil
        sessionResumedAtWallDate = nil
        delegate?.syncBackgroundAudioKeepAlive()
        delegate?.insertLogs([log])
        Task { [weak self] in
            guard let self else { return }
            await notificationScheduler.cancelTimerCompletionNotification()
        }
        delegate?.stopClockIfIdle()
    }

    private func finishRecovered(endedAt: Date) {
        guard let currentSession = session else { return }
        timerCompletionBridge.cancelTimerCompletionBridge()
        let log = currentSession.makeSessionLog(status: .completed, endedAt: endedAt)
        session = nil
        delegate?.timerSessionDidChange(nil)
        sessionResumedAt = nil
        sessionResumedAtWallDate = nil
        delegate?.syncBackgroundAudioKeepAlive()
        delegate?.insertLogs([log])
        Task { [weak self] in
            guard let self else { return }
            await notificationScheduler.cancelTimerCompletionNotification()
        }
        delegate?.stopClockIfIdle()
    }

    private func rescheduleNotificationIfNeeded(coordination: NotificationCoordination = .standard) {
        guard let currentSession = session,
              !currentSession.isPaused,
              currentSession.configuration.mode == .fixedDuration,
              let targetEndAt = currentSession.targetEndAt()
        else { return }

        let scheduledAt = targetEndAt.addingTimeInterval(coordination.backupDelaySeconds)
        let meditationType = currentSession.configuration.meditationType
        let endSoundName = currentSession.configuration.endSoundName
        Task { [weak self] in
            guard let self else { return }
            await notificationScheduler.scheduleTimerCompletionNotification(
                at: scheduledAt,
                meditationType: meditationType,
                endSoundName: endSoundName
            )
        }
    }

    @discardableResult
    private func armCompletionBridgeIfNeeded() -> Bool {
        guard let currentSession = session,
              !currentSession.isPaused,
              currentSession.configuration.mode == .fixedDuration,
              let targetEndAt = currentSession.targetEndAt()
        else {
            timerCompletionBridge.cancelTimerCompletionBridge()
            return false
        }

        let remainingSeconds = targetEndAt.timeIntervalSince(Date())
        guard remainingSeconds > 0, remainingSeconds <= LiveTimerCompletionBridge.maxLeadTime else {
            timerCompletionBridge.cancelTimerCompletionBridge()
            return false
        }

        timerCompletionBridge.armTimerCompletionBridge(targetEndAt: targetEndAt) { [weak self] bridgedEndAt in
            self?.finishFromBridgeIfNeeded(endedAt: bridgedEndAt)
        }
        return true
    }

    private func finishFromBridgeIfNeeded(endedAt: Date) {
        guard let currentSession = session,
              !currentSession.isPaused,
              currentSession.configuration.mode == .fixedDuration,
              currentSession.remainingSeconds(at: endedAt) == 0
        else { return }
        finish(status: .completed, endedAt: currentSession.targetEndAt() ?? endedAt)
    }
}
