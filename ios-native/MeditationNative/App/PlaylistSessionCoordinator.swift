import Foundation

@MainActor
protocol PlaylistSessionCoordinatorDelegate: AnyObject {
    var environment: AppEnvironment { get }
    var customPlays: [CustomPlay] { get }
    func playlistSessionDidChange(_ session: ActivePlaylistSession?)
    func runtimeMessageDidChange(_ message: String?)
    func insertLogs(_ logs: [SessionLog])
    func persistSnapshot()
    func startClock()
    func stopClockIfIdle()
}

@MainActor
final class PlaylistSessionCoordinator {
    private(set) var session: ActivePlaylistSession?
    weak var delegate: PlaylistSessionCoordinatorDelegate?

    private let audioPlayer: CustomPlayAudioControlling

    init(audioPlayer: CustomPlayAudioControlling) {
        self.audioPlayer = audioPlayer
    }

    @discardableResult
    func start(_ playlist: Playlist) -> Bool {
        session = ActivePlaylistSession(playlist: playlist, phaseStartedAt: Date())
        delegate?.playlistSessionDidChange(session)

        do {
            try syncAudio()
            return true
        } catch let error as LocalAudioPlaybackError {
            session = nil
            delegate?.playlistSessionDidChange(nil)
            delegate?.runtimeMessageDidChange(error.message)
            return false
        } catch {
            session = nil
            delegate?.playlistSessionDidChange(nil)
            delegate?.runtimeMessageDidChange("The playlist could not start right now.")
            return false
        }
    }

    func pause(at now: Date) {
        guard var currentSession = session else { return }
        currentSession.pause(at: now)
        session = currentSession
        delegate?.playlistSessionDidChange(session)

        if currentSession.currentItem?.kind == .customPlay, case .item = currentSession.phase {
            audioPlayer.pausePlayback()
        }
        delegate?.persistSnapshot()
    }

    func resume(at now: Date) {
        guard var currentSession = session else { return }
        let resumedAt = Date()
        do {
            currentSession.resume(at: resumedAt)
            session = currentSession
            delegate?.playlistSessionDidChange(session)
            try resumeAudioIfNeeded(for: currentSession, at: resumedAt)
            delegate?.runtimeMessageDidChange(nil)
            delegate?.persistSnapshot()
        } catch let error as LocalAudioPlaybackError {
            delegate?.runtimeMessageDidChange(error.message)
        } catch {
            delegate?.runtimeMessageDidChange("The playlist could not resume right now.")
        }
    }

    func endManually(at now: Date) {
        guard let currentSession = session else { return }
        session = nil
        delegate?.playlistSessionDidChange(nil)

        if let log = currentSession.makeCurrentItemEarlyStopLog(at: now) {
            delegate?.insertLogs([log])
        } else {
            delegate?.persistSnapshot()
        }

        audioPlayer.stopPlayback()
        delegate?.stopClockIfIdle()
    }

    func tick(at now: Date) {
        guard var currentSession = session else { return }
        let advanceResult = currentSession.advanceIfNeeded(at: now)

        if advanceResult.logs.isEmpty == false {
            delegate?.insertLogs(advanceResult.logs)
        }

        if advanceResult.finishedRun {
            audioPlayer.stopPlayback()
            session = nil
            delegate?.playlistSessionDidChange(nil)
            delegate?.persistSnapshot()
            delegate?.stopClockIfIdle()
            return
        }

        if advanceResult.didAdvance {
            session = currentSession
            delegate?.playlistSessionDidChange(session)
            do {
                try syncAudio()
                delegate?.persistSnapshot()
            } catch let error as LocalAudioPlaybackError {
                session = nil
                delegate?.playlistSessionDidChange(nil)
                delegate?.runtimeMessageDidChange(error.message)
                audioPlayer.stopPlayback()
                delegate?.persistSnapshot()
                delegate?.stopClockIfIdle()
            } catch {
                session = nil
                delegate?.playlistSessionDidChange(nil)
                delegate?.runtimeMessageDidChange("The playlist could not continue right now.")
                audioPlayer.stopPlayback()
                delegate?.persistSnapshot()
                delegate?.stopClockIfIdle()
            }
        } else {
            session = currentSession
            delegate?.playlistSessionDidChange(session)
        }
    }

    func restore(_ session: ActivePlaylistSession, at now: Date) {
        var restoredSession = session
        let advanceResult = restoredSession.advanceIfNeeded(at: now)

        if advanceResult.finishedRun {
            self.session = nil
            delegate?.playlistSessionDidChange(nil)
            if advanceResult.logs.isEmpty == false {
                delegate?.insertLogs(advanceResult.logs)
            } else {
                delegate?.persistSnapshot()
            }
            delegate?.runtimeMessageDidChange("The previous playlist finished while the app was away and was saved to History.")
            return
        }

        self.session = restoredSession
        delegate?.playlistSessionDidChange(self.session)

        if advanceResult.logs.isEmpty == false {
            delegate?.insertLogs(advanceResult.logs)
        }

        do {
            try startCurrentAudioIfNeeded(for: restoredSession, at: now)
        } catch let error as LocalAudioPlaybackError {
            self.session = nil
            delegate?.playlistSessionDidChange(nil)
            delegate?.runtimeMessageDidChange(error.message)
            delegate?.persistSnapshot()
            return
        } catch {
            self.session = nil
            delegate?.playlistSessionDidChange(nil)
            delegate?.runtimeMessageDidChange("The previous playlist could not be restored right now.")
            delegate?.persistSnapshot()
            return
        }

        delegate?.startClock()
        delegate?.persistSnapshot()
    }

    // MARK: - Private

    private func canResolvePlayback(for media: CustomPlayMedia?) -> Bool {
        guard let media else { return false }
        return media.canResolvePlaybackURL(apiBaseURL: delegate?.environment.apiBaseURL)
    }

    private func syncAudio() throws {
        guard let currentSession = session, let delegate else { return }

        guard case .item = currentSession.phase,
              let currentItem = currentSession.currentItem,
              currentItem.kind == .customPlay,
              let customPlayID = currentItem.customPlayID,
              let customPlay = delegate.customPlays.first(where: { $0.id == customPlayID }),
              let media = customPlay.media,
              canResolvePlayback(for: media)
        else {
            audioPlayer.stopPlayback()
            return
        }

        if currentSession.isPaused {
            audioPlayer.pausePlayback()
            return
        }

        try audioPlayer.startPlayback(for: media, environment: delegate.environment, at: 0)
    }

    private func resumeAudioIfNeeded(for session: ActivePlaylistSession, at date: Date) throws {
        guard case .item = session.phase,
              session.currentItem?.kind == .customPlay
        else {
            audioPlayer.stopPlayback()
            return
        }

        do {
            try audioPlayer.resumePlayback()
        } catch LocalAudioPlaybackError.audioSetupFailed {
            try startCurrentAudioIfNeeded(for: session, at: date)
        }
    }

    private func startCurrentAudioIfNeeded(for session: ActivePlaylistSession, at date: Date) throws {
        guard case .item = session.phase, let currentItem = session.currentItem else {
            audioPlayer.stopPlayback()
            return
        }

        guard currentItem.kind == .customPlay else {
            audioPlayer.stopPlayback()
            return
        }

        guard let delegate,
              let customPlayID = currentItem.customPlayID,
              let customPlay = delegate.customPlays.first(where: { $0.id == customPlayID }),
              let media = customPlay.media,
              canResolvePlayback(for: media)
        else {
            throw LocalAudioPlaybackError.recordingUnavailable
        }

        if session.isPaused {
            audioPlayer.pausePlayback()
            return
        }

        try audioPlayer.startPlayback(
            for: media,
            environment: delegate.environment,
            at: TimeInterval(session.elapsedSecondsInPhase(at: date))
        )
    }
}
