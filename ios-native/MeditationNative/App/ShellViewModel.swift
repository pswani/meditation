import Combine
import Foundation
import SwiftUI

@MainActor
final class ShellViewModel: ObservableObject {
    @Published private(set) var snapshot: AppSnapshot
    @Published private(set) var environment: AppEnvironment
    @Published private(set) var isSeedData: Bool
    @Published private(set) var activeSession: ActiveTimerSession?
    @Published private(set) var activeCustomPlaySession: ActiveCustomPlaySession?
    @Published private(set) var activePlaylistSession: ActivePlaylistSession?
    @Published private(set) var now = Date()
    @Published private(set) var notificationPermissionState: NotificationPermissionState = .checking
    @Published var timerValidationMessage: String?
    @Published var manualLogValidationMessage: String?
    @Published var customPlayValidationMessage: String?
    @Published var playlistValidationMessage: String?
    @Published var practiceRuntimeMessage: String?
    @Published var persistenceMessage: String?

    private let repository: LocalAppSnapshotRepository
    private let notificationScheduler: NotificationScheduling
    private let soundPlayer: TimerSoundPlaying
    private let audioPlayer: CustomPlayAudioControlling
    private var clockCancellable: AnyCancellable?

    init(
        repository: LocalAppSnapshotRepository = .live(
            environment: AppEnvironment.from()
        ),
        notificationScheduler: NotificationScheduling = LiveNotificationScheduler(),
        soundPlayer: TimerSoundPlaying = SystemSoundPlayer(),
        audioPlayer: CustomPlayAudioControlling = BundledCustomPlayAudioPlayer()
    ) {
        self.repository = repository
        self.notificationScheduler = notificationScheduler
        self.soundPlayer = soundPlayer
        self.audioPlayer = audioPlayer

        do {
            let loadedSnapshot = try repository.loadOrSeed(seed: SampleData.snapshot)
            self.snapshot = loadedSnapshot
            self.isSeedData = loadedSnapshot == SampleData.snapshot
        } catch {
            self.snapshot = SampleData.snapshot
            self.isSeedData = true
        }

        self.environment = repository.environment
    }

    deinit {
        clockCancellable?.cancel()
    }

    var timerDraftBinding: Binding<TimerSettingsDraft> {
        Binding(
            get: { self.snapshot.timerDraft },
            set: { [weak self] newValue in
                self?.snapshot.timerDraft = newValue
                self?.persistSnapshot()
            }
        )
    }

    var recentSessionLogs: [SessionLog] {
        snapshot.recentSessionLogs.sorted { $0.endedAt > $1.endedAt }
    }

    var customPlays: [CustomPlay] {
        snapshot.customPlays.sorted(by: sortCustomPlays)
    }

    var playlists: [Playlist] {
        snapshot.playlists.sorted(by: sortPlaylists)
    }

    var hasActivePracticeRuntime: Bool {
        activeSession != nil || activeCustomPlaySession != nil || activePlaylistSession != nil
    }

    func startTimer() {
        guard hasActivePracticeRuntime == false else {
            practiceRuntimeMessage = "Finish the current practice before starting something new."
            return
        }

        timerValidationMessage = nil
        practiceRuntimeMessage = nil
        persistenceMessage = nil

        do {
            activeSession = try TimerFeature.makeActiveSession(from: snapshot.timerDraft, now: Date())
            now = Date()
            soundPlayer.playSound(named: activeSession?.configuration.startSoundName)
            startClock()
            rescheduleTimerNotificationIfNeeded()
        } catch let error as TimerValidationError {
            timerValidationMessage = error.message
        } catch {
            timerValidationMessage = "The timer could not start with the current setup."
        }
    }

    func pauseTimer() {
        guard var activeSession else {
            return
        }

        activeSession.pause(at: now)
        self.activeSession = activeSession
        Task {
            await notificationScheduler.cancelTimerCompletionNotification()
        }
    }

    func resumeTimer() {
        guard var activeSession else {
            return
        }

        activeSession.resume(at: Date())
        self.activeSession = activeSession
        now = Date()
        rescheduleTimerNotificationIfNeeded()
    }

    func endTimerManually() {
        guard let activeSession else {
            return
        }

        let status: SessionStatus = activeSession.configuration.mode == .fixedDuration ? .endedEarly : .completed
        finishTimer(status: status, endedAt: Date())
    }

    func saveManualLog(_ draft: ManualLogDraft) -> Bool {
        manualLogValidationMessage = nil
        persistenceMessage = nil

        do {
            let log = try TimerFeature.makeManualLog(from: draft)
            insertLogs([log])
            return true
        } catch let error as ManualLogValidationError {
            manualLogValidationMessage = error.message
            return false
        } catch {
            manualLogValidationMessage = "The manual log could not be saved."
            return false
        }
    }

    func saveCustomPlay(_ draft: CustomPlayDraft) -> Bool {
        customPlayValidationMessage = nil
        practiceRuntimeMessage = nil

        do {
            let savedCustomPlay = try CustomPlayFeature.makeCustomPlay(from: draft, existingID: draft.id)
            snapshot.customPlays = upsert(savedCustomPlay, into: snapshot.customPlays)
            persistSnapshot()
            return true
        } catch let error as CustomPlayValidationError {
            customPlayValidationMessage = error.message
            return false
        } catch {
            customPlayValidationMessage = "The custom play could not be saved."
            return false
        }
    }

    func deleteCustomPlay(_ customPlay: CustomPlay) {
        guard activeCustomPlaySession?.customPlay.id != customPlay.id else {
            practiceRuntimeMessage = "End the active custom play before deleting it."
            return
        }

        snapshot.customPlays.removeAll { $0.id == customPlay.id }
        persistSnapshot()
    }

    func toggleFavorite(for customPlay: CustomPlay) {
        var updatedCustomPlay = customPlay
        updatedCustomPlay.isFavorite.toggle()
        snapshot.customPlays = upsert(updatedCustomPlay, into: snapshot.customPlays)
        persistSnapshot()
    }

    func startCustomPlay(_ customPlay: CustomPlay) {
        guard hasActivePracticeRuntime == false else {
            practiceRuntimeMessage = "Finish the current practice before starting something new."
            return
        }

        guard let media = customPlay.media else {
            practiceRuntimeMessage = "This custom play still needs bundled placeholder audio before it can start."
            return
        }

        do {
            try audioPlayer.startLoopingPlayback(for: media)
            activeCustomPlaySession = ActiveCustomPlaySession(customPlay: customPlay, startedAt: Date())
            practiceRuntimeMessage = nil
            startClock()
        } catch let error as LocalAudioPlaybackError {
            practiceRuntimeMessage = error.message
        } catch {
            practiceRuntimeMessage = "The custom play could not start right now."
        }
    }

    func pauseCustomPlay() {
        guard var activeCustomPlaySession else {
            return
        }

        activeCustomPlaySession.pause(at: now)
        self.activeCustomPlaySession = activeCustomPlaySession
        audioPlayer.pausePlayback()
    }

    func resumeCustomPlay() {
        guard var activeCustomPlaySession else {
            return
        }

        do {
            try audioPlayer.resumePlayback()
            activeCustomPlaySession.resume(at: Date())
            self.activeCustomPlaySession = activeCustomPlaySession
            practiceRuntimeMessage = nil
        } catch let error as LocalAudioPlaybackError {
            practiceRuntimeMessage = error.message
        } catch {
            practiceRuntimeMessage = "The custom play could not resume right now."
        }
    }

    func endCustomPlayManually() {
        finishCustomPlay(status: .endedEarly, endedAt: Date())
    }

    func savePlaylist(_ draft: PlaylistDraft) -> Bool {
        playlistValidationMessage = nil
        practiceRuntimeMessage = nil

        do {
            let savedPlaylist = try PlaylistFeature.makePlaylist(
                from: draft,
                availableCustomPlays: snapshot.customPlays,
                existingID: draft.id
            )
            snapshot.playlists = upsert(savedPlaylist, into: snapshot.playlists)
            persistSnapshot()
            return true
        } catch let error as PlaylistValidationError {
            playlistValidationMessage = error.message
            return false
        } catch {
            playlistValidationMessage = "The playlist could not be saved."
            return false
        }
    }

    func deletePlaylist(_ playlist: Playlist) {
        guard activePlaylistSession?.playlist.id != playlist.id else {
            practiceRuntimeMessage = "End the active playlist before deleting it."
            return
        }

        snapshot.playlists.removeAll { $0.id == playlist.id }
        persistSnapshot()
    }

    func toggleFavorite(for playlist: Playlist) {
        var updatedPlaylist = playlist
        updatedPlaylist.isFavorite.toggle()
        snapshot.playlists = upsert(updatedPlaylist, into: snapshot.playlists)
        persistSnapshot()
    }

    func startPlaylist(_ playlist: Playlist) {
        guard hasActivePracticeRuntime == false else {
            practiceRuntimeMessage = "Finish the current practice before starting something new."
            return
        }

        if let validationError = PlaylistFeature.validatePlaylistForRun(playlist, availableCustomPlays: snapshot.customPlays) {
            practiceRuntimeMessage = validationError.message
            return
        }

        activePlaylistSession = ActivePlaylistSession(playlist: playlist, phaseStartedAt: Date())
        practiceRuntimeMessage = nil

        do {
            try syncPlaylistAudio()
            startClock()
        } catch let error as LocalAudioPlaybackError {
            activePlaylistSession = nil
            practiceRuntimeMessage = error.message
        } catch {
            activePlaylistSession = nil
            practiceRuntimeMessage = "The playlist could not start right now."
        }
    }

    func pausePlaylist() {
        guard var activePlaylistSession else {
            return
        }

        activePlaylistSession.pause(at: now)
        self.activePlaylistSession = activePlaylistSession
        if activePlaylistSession.currentItem?.kind == .customPlay,
           case .item = activePlaylistSession.phase {
            audioPlayer.pausePlayback()
        }
    }

    func resumePlaylist() {
        guard var activePlaylistSession else {
            return
        }

        do {
            activePlaylistSession.resume(at: Date())
            self.activePlaylistSession = activePlaylistSession
            try syncPlaylistAudio()
            practiceRuntimeMessage = nil
        } catch let error as LocalAudioPlaybackError {
            practiceRuntimeMessage = error.message
        } catch {
            practiceRuntimeMessage = "The playlist could not resume right now."
        }
    }

    func endPlaylistManually() {
        guard let activePlaylistSession else {
            return
        }

        if let log = activePlaylistSession.makeCurrentItemEarlyStopLog(at: Date()) {
            insertLogs([log])
        }

        audioPlayer.stopPlayback()
        self.activePlaylistSession = nil
        stopClockIfIdle()
    }

    func handleScenePhaseChange(isActive: Bool) {
        if isActive {
            now = Date()
            handleClockTick(now)
            Task {
                await refreshNotificationPermissionState()
            }
        }
    }

    func refreshNotificationPermissionState() async {
        notificationPermissionState = await notificationScheduler.authorizationState()
    }

    func requestNotificationPermission() async {
        notificationPermissionState = await notificationScheduler.requestAuthorization()
    }

    func activeTimerPrimaryText() -> String {
        guard let activeSession else {
            return "00:00"
        }

        if let remainingSeconds = activeSession.remainingSeconds(at: now) {
            return formatClock(remainingSeconds)
        }

        return formatClock(activeSession.elapsedSeconds(at: now))
    }

    func activeTimerSecondaryText() -> String {
        guard let activeSession else {
            return ""
        }

        if activeSession.configuration.mode == .fixedDuration {
            return "Elapsed \(formatClock(activeSession.elapsedSeconds(at: now)))"
        }

        return "Open-ended practice"
    }

    func activeCustomPlayPrimaryText() -> String {
        guard let activeCustomPlaySession else {
            return "00:00"
        }

        return formatClock(activeCustomPlaySession.remainingSeconds(at: now))
    }

    func activeCustomPlaySecondaryText() -> String {
        guard let activeCustomPlaySession else {
            return ""
        }

        return "Elapsed \(formatClock(activeCustomPlaySession.elapsedSeconds(at: now)))"
    }

    func activePlaylistPrimaryText() -> String {
        guard let activePlaylistSession else {
            return "00:00"
        }

        return formatClock(activePlaylistSession.remainingSecondsInPhase(at: now))
    }

    func activePlaylistTitle() -> String {
        guard let activePlaylistSession else {
            return ""
        }

        switch activePlaylistSession.phase {
        case .item(let index):
            let itemCount = activePlaylistSession.playlist.items.count
            let itemTitle = activePlaylistSession.currentItem?.title ?? "Current item"
            return "Item \(index + 1) of \(itemCount): \(itemTitle)"
        case .gap:
            return "Small gap"
        }
    }

    func activePlaylistSecondaryText() -> String {
        guard let activePlaylistSession else {
            return ""
        }

        switch activePlaylistSession.phase {
        case .item:
            if let upcomingItem = activePlaylistSession.upcomingItem {
                return "Next: \(upcomingItem.title)"
            }
            return "Final item in this playlist"
        case .gap:
            if let upcomingItem = activePlaylistSession.upcomingItem {
                return "Up next: \(upcomingItem.title)"
            }
            return "Preparing the next item"
        }
    }

    private func startClock() {
        clockCancellable?.cancel()
        clockCancellable = Timer.publish(every: 1, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] currentDate in
                self?.handleClockTick(currentDate)
            }
    }

    private func stopClockIfIdle() {
        guard hasActivePracticeRuntime == false else {
            return
        }

        clockCancellable?.cancel()
        clockCancellable = nil
    }

    private func handleClockTick(_ currentDate: Date) {
        now = currentDate

        if var activeSession {
            if activeSession.isPaused == false,
               activeSession.nextDueIntervalCount(at: currentDate) != nil {
                soundPlayer.playSound(named: activeSession.configuration.intervalSoundName)
            }

            self.activeSession = activeSession

            if activeSession.configuration.mode == .fixedDuration,
               activeSession.remainingSeconds(at: currentDate) == 0 {
                let endedAt = activeSession.targetEndAt() ?? currentDate
                finishTimer(status: .completed, endedAt: endedAt)
            }
        }

        if let activeCustomPlaySession,
           activeCustomPlaySession.isPaused == false,
           activeCustomPlaySession.remainingSeconds(at: currentDate) == 0 {
            finishCustomPlay(status: .completed, endedAt: customPlayTargetEndAt(activeCustomPlaySession))
        }

        if var activePlaylistSession {
            let advanceResult = activePlaylistSession.advanceIfNeeded(at: currentDate)
            if advanceResult.logs.isEmpty == false {
                insertLogs(advanceResult.logs)
            }

            if advanceResult.finishedRun {
                audioPlayer.stopPlayback()
                self.activePlaylistSession = nil
                stopClockIfIdle()
                return
            }

            if advanceResult.didAdvance {
                self.activePlaylistSession = activePlaylistSession
                do {
                    try syncPlaylistAudio()
                } catch let error as LocalAudioPlaybackError {
                    self.activePlaylistSession = nil
                    practiceRuntimeMessage = error.message
                    audioPlayer.stopPlayback()
                    stopClockIfIdle()
                } catch {
                    self.activePlaylistSession = nil
                    practiceRuntimeMessage = "The playlist could not continue right now."
                    audioPlayer.stopPlayback()
                    stopClockIfIdle()
                }
            } else {
                self.activePlaylistSession = activePlaylistSession
            }
        }
    }

    private func finishTimer(status: SessionStatus, endedAt: Date) {
        guard let activeSession else {
            return
        }

        let log = activeSession.makeSessionLog(status: status, endedAt: endedAt)
        soundPlayer.playSound(named: activeSession.configuration.endSoundName)
        insertLogs([log])
        self.activeSession = nil

        Task {
            await notificationScheduler.cancelTimerCompletionNotification()
        }

        stopClockIfIdle()
    }

    private func finishCustomPlay(status: SessionStatus, endedAt: Date) {
        guard let activeCustomPlaySession else {
            return
        }

        let log = activeCustomPlaySession.makeSessionLog(status: status, endedAt: endedAt)
        audioPlayer.stopPlayback()
        insertLogs([log])
        self.activeCustomPlaySession = nil
        stopClockIfIdle()
    }

    private func insertLogs(_ logs: [SessionLog]) {
        guard logs.isEmpty == false else {
            return
        }

        snapshot.recentSessionLogs = (snapshot.recentSessionLogs + logs)
            .sorted { $0.endedAt > $1.endedAt }
        persistSnapshot()
    }

    private func persistSnapshot() {
        do {
            try repository.save(snapshot)
            isSeedData = snapshot == SampleData.snapshot
        } catch {
            persistenceMessage = "Local changes could not be saved right now."
        }
    }

    private func rescheduleTimerNotificationIfNeeded() {
        guard let activeSession,
              activeSession.configuration.mode == .fixedDuration,
              let targetEndAt = activeSession.targetEndAt()
        else {
            return
        }

        Task {
            await notificationScheduler.scheduleTimerCompletionNotification(
                at: targetEndAt,
                meditationType: activeSession.configuration.meditationType
            )
        }
    }

    private func syncPlaylistAudio() throws {
        guard let activePlaylistSession else {
            return
        }

        guard case .item = activePlaylistSession.phase,
              let currentItem = activePlaylistSession.currentItem,
              currentItem.kind == .customPlay,
              let customPlayID = currentItem.customPlayID,
              let customPlay = snapshot.customPlays.first(where: { $0.id == customPlayID }),
              let media = customPlay.media
        else {
            audioPlayer.stopPlayback()
            return
        }

        if activePlaylistSession.isPaused {
            audioPlayer.pausePlayback()
            return
        }

        try audioPlayer.startLoopingPlayback(for: media)
    }

    private func customPlayTargetEndAt(_ session: ActiveCustomPlaySession) -> Date {
        session.startedAt
            .addingTimeInterval(TimeInterval(session.customPlay.durationSeconds))
            .addingTimeInterval(session.accumulatedPauseSeconds)
    }

    private func sortCustomPlays(_ lhs: CustomPlay, _ rhs: CustomPlay) -> Bool {
        if lhs.isFavorite != rhs.isFavorite {
            return lhs.isFavorite && rhs.isFavorite == false
        }

        return lhs.name.localizedCaseInsensitiveCompare(rhs.name) == .orderedAscending
    }

    private func sortPlaylists(_ lhs: Playlist, _ rhs: Playlist) -> Bool {
        if lhs.isFavorite != rhs.isFavorite {
            return lhs.isFavorite && rhs.isFavorite == false
        }

        return lhs.name.localizedCaseInsensitiveCompare(rhs.name) == .orderedAscending
    }

    private func upsert<Value: Identifiable & Equatable>(_ value: Value, into values: [Value]) -> [Value] {
        var updatedValues = values
        if let existingIndex = updatedValues.firstIndex(where: { $0.id == value.id }) {
            updatedValues[existingIndex] = value
        } else {
            updatedValues.append(value)
        }

        return updatedValues
    }

    private func formatClock(_ totalSeconds: Int) -> String {
        let hours = totalSeconds / 3_600
        let minutes = (totalSeconds % 3_600) / 60
        let seconds = totalSeconds % 60

        if hours > 0 {
            return String(format: "%02d:%02d:%02d", hours, minutes, seconds)
        }

        return String(format: "%02d:%02d", minutes, seconds)
    }
}
