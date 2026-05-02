import Foundation

@MainActor
protocol CustomPlaySessionCoordinatorDelegate: AnyObject {
    var environment: AppEnvironment { get }
    func customPlaySessionDidChange(_ session: ActiveCustomPlaySession?)
    func runtimeMessageDidChange(_ message: String?)
    func insertLogs(_ logs: [SessionLog])
    func persistSnapshot()
    func startClock()
    func stopClockIfIdle()
    func syncBackgroundAudioKeepAlive()
}

@MainActor
final class CustomPlaySessionCoordinator {
    private(set) var session: ActiveCustomPlaySession?
    weak var delegate: CustomPlaySessionCoordinatorDelegate?

    private let audioPlayer: CustomPlayAudioControlling
    private let soundPlayer: TimerSoundPlaying
    private let notificationScheduler: NotificationScheduling

    init(
        audioPlayer: CustomPlayAudioControlling,
        soundPlayer: TimerSoundPlaying,
        notificationScheduler: NotificationScheduling
    ) {
        self.audioPlayer = audioPlayer
        self.soundPlayer = soundPlayer
        self.notificationScheduler = notificationScheduler
    }

    // Returns an optional bells-only fallback message when recording is unavailable.
    func start(_ customPlay: CustomPlay) -> String? {
        let message = startPlaybackIfAvailable(for: customPlay)
        session = ActiveCustomPlaySession(customPlay: customPlay, startedAt: Date())
        delegate?.customPlaySessionDidChange(session)
        soundPlayer.playSound(named: customPlay.startSoundName)
        delegate?.syncBackgroundAudioKeepAlive()
        delegate?.startClock()
        rescheduleNotificationIfNeeded()
        return message
    }

    func pause(at now: Date) {
        guard var currentSession = session else { return }
        currentSession.pause(at: now)
        session = currentSession
        delegate?.customPlaySessionDidChange(session)
        audioPlayer.pausePlayback()
        delegate?.syncBackgroundAudioKeepAlive()
        Task { [weak self] in
            guard let self else { return }
            await notificationScheduler.cancelTimerCompletionNotification()
        }
        delegate?.persistSnapshot()
    }

    func resume(at now: Date) {
        guard var currentSession = session else { return }
        let resumedAt = Date()
        do {
            let resumedWithoutRecording = try resumeAudioIfNeeded(for: currentSession, at: resumedAt)
            currentSession.resume(at: resumedAt)
            session = currentSession
            delegate?.customPlaySessionDidChange(session)
            let message: String? = resumedWithoutRecording
                ? "Recording unavailable on this device. This custom play resumed with its saved duration and bells only."
                : nil
            delegate?.runtimeMessageDidChange(message)
            delegate?.syncBackgroundAudioKeepAlive()
            rescheduleNotificationIfNeeded()
            delegate?.persistSnapshot()
        } catch let error as LocalAudioPlaybackError {
            delegate?.runtimeMessageDidChange(error.message)
        } catch {
            delegate?.runtimeMessageDidChange("The custom play could not resume right now.")
        }
    }

    func endManually() {
        finish(status: .endedEarly, endedAt: Date())
    }

    func tick(at now: Date) {
        guard let currentSession = session,
              !currentSession.isPaused,
              currentSession.remainingSeconds(at: now) == 0
        else { return }
        finish(status: .completed, endedAt: targetEndAt(currentSession))
    }

    func handleAudioPlaybackCompletion(at now: Date) {
        guard let currentSession = session, !currentSession.isPaused else { return }
        finish(status: .completed, endedAt: targetEndAt(currentSession))
    }

    func handleForegroundTransition() {
        rescheduleNotificationIfNeeded()
    }

    func restore(_ session: ActiveCustomPlaySession, at now: Date) {
        if !session.isPaused, session.remainingSeconds(at: now) == 0 {
            self.session = session
            delegate?.customPlaySessionDidChange(self.session)
            finishRecovered(endedAt: targetEndAt(session))
            delegate?.runtimeMessageDidChange("The previous custom play finished while the app was away and was saved to History.")
            return
        }

        self.session = session
        delegate?.customPlaySessionDidChange(self.session)

        var restoreMessage: String?
        if !session.isPaused {
            restoreMessage = startPlaybackIfAvailable(
                for: session.customPlay,
                at: TimeInterval(session.elapsedSeconds(at: now))
            )
        }

        if let restoreMessage {
            delegate?.runtimeMessageDidChange(
                restoreMessage.replacingOccurrences(
                    of: "This custom play is running",
                    with: "The previous custom play resumed"
                )
            )
        } else {
            delegate?.runtimeMessageDidChange(nil)
        }

        delegate?.syncBackgroundAudioKeepAlive()
        delegate?.startClock()
        rescheduleNotificationIfNeeded()
        delegate?.persistSnapshot()
    }

    // MARK: - Private

    private func finish(status: SessionStatus, endedAt: Date) {
        guard let currentSession = session else { return }
        let log = currentSession.makeSessionLog(status: status, endedAt: endedAt)
        audioPlayer.stopPlayback()
        soundPlayer.playSound(named: currentSession.customPlay.endSoundName)
        session = nil
        delegate?.customPlaySessionDidChange(nil)
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
        let log = currentSession.makeSessionLog(status: .completed, endedAt: endedAt)
        audioPlayer.stopPlayback()
        session = nil
        delegate?.customPlaySessionDidChange(nil)
        delegate?.syncBackgroundAudioKeepAlive()
        delegate?.insertLogs([log])
        Task { [weak self] in
            guard let self else { return }
            await notificationScheduler.cancelTimerCompletionNotification()
        }
        delegate?.stopClockIfIdle()
    }

    private func rescheduleNotificationIfNeeded() {
        guard let currentSession = session, !currentSession.isPaused else { return }
        let endAt = targetEndAt(currentSession)
        let meditationType = currentSession.customPlay.meditationType
        let endSoundName = currentSession.customPlay.endSoundName
        Task { [weak self] in
            guard let self else { return }
            await notificationScheduler.scheduleTimerCompletionNotification(
                at: endAt,
                meditationType: meditationType,
                endSoundName: endSoundName
            )
        }
    }

    private func canResolvePlayback(for media: CustomPlayMedia?) -> Bool {
        guard let media else { return false }
        return media.canResolvePlaybackURL(apiBaseURL: delegate?.environment.apiBaseURL)
    }

    private func startPlaybackIfAvailable(for customPlay: CustomPlay, at offsetSeconds: TimeInterval = 0) -> String? {
        guard let media = customPlay.media, canResolvePlayback(for: media) else {
            audioPlayer.stopPlayback()
            return "Recording unavailable on this device. This custom play is running with its saved duration and bells only."
        }

        guard let env = delegate?.environment else {
            audioPlayer.stopPlayback()
            return "Recording audio could not start, so this custom play is running with its saved duration and bells only."
        }

        do {
            try audioPlayer.startPlayback(for: media, environment: env, at: offsetSeconds)
            return nil
        } catch {
            audioPlayer.stopPlayback()
            return "Recording audio could not start, so this custom play is running with its saved duration and bells only."
        }
    }

    private func resumeAudioIfNeeded(for session: ActiveCustomPlaySession, at date: Date) throws -> Bool {
        guard let media = session.customPlay.media, canResolvePlayback(for: media) else {
            audioPlayer.stopPlayback()
            return true
        }

        do {
            try audioPlayer.resumePlayback()
            return false
        } catch LocalAudioPlaybackError.audioSetupFailed {
            guard let env = delegate?.environment else {
                audioPlayer.stopPlayback()
                return true
            }
            do {
                try audioPlayer.startPlayback(
                    for: media,
                    environment: env,
                    at: TimeInterval(session.elapsedSeconds(at: date))
                )
                return false
            } catch {
                audioPlayer.stopPlayback()
                return true
            }
        }
    }

    private func targetEndAt(_ session: ActiveCustomPlaySession) -> Date {
        session.startedAt
            .addingTimeInterval(TimeInterval(session.customPlay.durationSeconds))
            .addingTimeInterval(session.accumulatedPauseSeconds)
    }
}
