import Combine
import Foundation
import SwiftUI

@MainActor
final class ShellViewModel: ObservableObject {
    @Published private(set) var snapshot: AppSnapshot
    @Published private(set) var syncState: AppSyncState
    @Published private(set) var environment: AppEnvironment
    @Published private(set) var isSeedData: Bool
    @Published private(set) var activeSession: ActiveTimerSession?
    @Published private(set) var activeCustomPlaySession: ActiveCustomPlaySession?
    @Published private(set) var activePlaylistSession: ActivePlaylistSession?
    @Published private(set) var runtimeSafetyPrompt: RuntimeSafetyPrompt?
    @Published private(set) var now = Date()
    @Published private(set) var notificationPermissionState: NotificationPermissionState = .checking
    @Published var timerValidationMessage: String?
    @Published var manualLogValidationMessage: String?
    @Published var customPlayValidationMessage: String?
    @Published var playlistValidationMessage: String?
    @Published var sankalpaValidationMessage: String?
    @Published var sankalpaFeedbackMessage: String?
    @Published var practiceRuntimeMessage: String?
    @Published var persistenceMessage: String?

    private let repository: LocalAppSnapshotRepository
    private let syncRepository: LocalAppSyncStateRepository
    private let notificationScheduler: NotificationScheduling
    private let soundPlayer: TimerSoundPlaying
    private let audioPlayer: CustomPlayAudioControlling
    private var clockCancellable: AnyCancellable?
    private let syncClient: AppSyncClient?
    private var isRunningSync = false
    private var needsSyncPass = false

    init(
        repository: LocalAppSnapshotRepository = .live(
            environment: AppEnvironment.from()
        ),
        syncRepository: LocalAppSyncStateRepository = .live(
            environment: AppEnvironment.from()
        ),
        notificationScheduler: NotificationScheduling = LiveNotificationScheduler(),
        soundPlayer: TimerSoundPlaying = SystemSoundPlayer(),
        audioPlayer: CustomPlayAudioControlling = BundledCustomPlayAudioPlayer(),
        syncClient: AppSyncClient? = nil
    ) {
        self.repository = repository
        self.syncRepository = syncRepository
        self.notificationScheduler = notificationScheduler
        self.soundPlayer = soundPlayer
        self.audioPlayer = audioPlayer
        self.syncClient = syncClient ?? repository.environment.apiBaseURL.map { LiveAppSyncClient(baseURL: $0) }

        do {
            self.syncState = try syncRepository.load(
                default: repository.environment.requiresBackend
                    ? AppSyncState(connectionState: .pendingSync)
                    : .localOnly
            )
        } catch {
            self.syncState = repository.environment.requiresBackend
                ? AppSyncState(connectionState: .pendingSync)
                : .localOnly
        }

        do {
            let storedSnapshot = try repository.loadOrSeed(seed: SampleData.snapshot)
            let loadedSnapshot = ShellSnapshotSupport.normalizedSnapshot(storedSnapshot)
            self.snapshot = loadedSnapshot
            self.isSeedData = loadedSnapshot == SampleData.snapshot
            if loadedSnapshot != storedSnapshot {
                try? repository.save(loadedSnapshot)
            }
        } catch {
            self.snapshot = ShellSnapshotSupport.normalizedSnapshot(SampleData.snapshot)
            self.isSeedData = true
        }

        self.environment = repository.environment

        if environment.requiresBackend {
            scheduleSync()
        } else {
            syncState.connectionState = .localOnly
        }
    }

    deinit {
        clockCancellable?.cancel()
    }

    var timerDraftBinding: Binding<TimerSettingsDraft> {
        Binding(
            get: { self.snapshot.timerDraft },
            set: { [weak self] newValue in
                self?.snapshot.timerDraft = newValue
                self?.persistSnapshot(syncMutations: [.timerSettingsUpsert(newValue)])
            }
        )
    }

    var recentSessionLogs: [SessionLog] {
        snapshot.recentSessionLogs.sorted { $0.endedAt > $1.endedAt }
    }

    var homeRecentSessionLogs: [SessionLog] {
        Array(recentSessionLogs.prefix(3))
    }

    var syncBannerMessage: String? {
        ShellViewModelPresentation.syncBannerMessage(for: syncState)
    }

    var syncStatusHeadline: String {
        ShellViewModelPresentation.syncStatusHeadline(for: syncState)
    }

    var syncStatusDetail: String {
        ShellViewModelPresentation.syncStatusDetail(for: syncState, now: now)
    }

    var customPlays: [CustomPlay] {
        ShellViewModelPresentation.sortedCustomPlays(from: snapshot.customPlays)
    }

    var favoriteCustomPlaysForHome: [CustomPlay] {
        Array(customPlays.filter(\.isFavorite).prefix(3))
    }

    var playlists: [Playlist] {
        ShellViewModelPresentation.sortedPlaylists(from: snapshot.playlists)
    }

    var favoritePlaylistsForHome: [Playlist] {
        Array(playlists.filter(\.isFavorite).prefix(3))
    }

    var homeQuickStartSummary: String {
        ShellViewModelPresentation.homeQuickStartSummary(for: snapshot.timerDraft)
    }

    var lastUsedPracticeSummary: String? {
        ShellViewModelPresentation.lastUsedPracticeSummary(for: snapshot.lastUsedPracticeTarget)
    }

    var hasLastUsedPracticeTarget: Bool {
        snapshot.lastUsedPracticeTarget != nil
    }

    var todayActivitySummary: TodayActivitySummary {
        SummaryFeature.deriveTodayActivitySummary(recentSessionLogs, now: now)
    }

    var sankalpaProgressEntries: [SankalpaProgress] {
        snapshot.sankalpas.map { SankalpaFeature.deriveProgress(for: $0, sessionLogs: recentSessionLogs, now: now) }
    }

    var sankalpaProgressGroups: SankalpaProgressGroups {
        SankalpaFeature.partitionProgress(sankalpaProgressEntries)
    }

    var topActiveSankalpa: SankalpaProgress? {
        SankalpaFeature.selectTopActiveProgress(from: sankalpaProgressEntries)
    }

    var hasActivePracticeRuntime: Bool {
        activeSession != nil || activeCustomPlaySession != nil || activePlaylistSession != nil
    }

    func summarySnapshot(
        for rangePreset: SummaryRangePreset,
        customRange: SummaryDateRange? = nil
    ) -> LocalSummarySnapshot {
        SummaryFeature.deriveSnapshot(
            from: recentSessionLogs,
            rangePreset: rangePreset,
            customRange: customRange,
            now: now
        )
    }

    func summaryRangeValidationMessage(
        for rangePreset: SummaryRangePreset,
        customRange: SummaryDateRange?
    ) -> String? {
        SummaryFeature.summaryRangeValidationMessage(rangePreset: rangePreset, customRange: customRange)
    }

    func startTimer() {
        startTimer(
            using: snapshot.timerDraft,
            recordLastUsedTarget: ShellSnapshotSupport.makeTimerLastUsedTarget(
                from: snapshot.timerDraft,
                fallbackMeditationType: snapshot.lastUsedPracticeTarget?.meditationType
            )
        )
    }

    func startLastUsedPractice() {
        guard let lastUsedPracticeTarget = snapshot.lastUsedPracticeTarget else {
            practiceRuntimeMessage = "There is no last used meditation yet."
            return
        }

        switch lastUsedPracticeTarget.kind {
        case .timer:
            var timerDraft = lastUsedPracticeTarget.timerDraft ?? snapshot.timerDraft
            if timerDraft.meditationType == nil {
                timerDraft.meditationType = lastUsedPracticeTarget.meditationType
            }
            startTimer(using: timerDraft, recordLastUsedTarget: lastUsedPracticeTarget)
        case .customPlay:
            guard let customPlayID = lastUsedPracticeTarget.customPlayID,
                  let customPlay = snapshot.customPlays.first(where: { $0.id == customPlayID }) else {
                practiceRuntimeMessage = "The last used custom play is no longer available."
                return
            }

            startCustomPlay(customPlay)
        case .playlist:
            guard let playlistID = lastUsedPracticeTarget.playlistID,
                  let playlist = snapshot.playlists.first(where: { $0.id == playlistID }) else {
                practiceRuntimeMessage = "The last used playlist is no longer available."
                return
            }

            startPlaylist(playlist)
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

    func requestEndTimerConfirmation() {
        guard let activeSession else {
            return
        }

        runtimeSafetyPrompt = .endTimer(mode: activeSession.configuration.mode)
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
            persistSnapshot(syncMutations: [.customPlayUpsert(savedCustomPlay)])
            return true
        } catch let error as CustomPlayValidationError {
            customPlayValidationMessage = error.message
            return false
        } catch {
            customPlayValidationMessage = "The custom play could not be saved."
            return false
        }
    }

    func applyCustomPlayToTimer(_ customPlay: CustomPlay) {
        guard hasActivePracticeRuntime == false else {
            practiceRuntimeMessage = "Finish the current practice before applying a custom play to the timer."
            return
        }

        timerValidationMessage = nil
        practiceRuntimeMessage = nil
        snapshot.timerDraft = CustomPlayFeature.applyToTimerDraft(snapshot.timerDraft, from: customPlay)
        persistSnapshot(syncMutations: [.timerSettingsUpsert(snapshot.timerDraft)])
        practiceRuntimeMessage = "Custom play \"\(customPlay.name)\" applied to timer setup."
    }

    func deleteCustomPlay(_ customPlay: CustomPlay) {
        guard activeCustomPlaySession?.customPlay.id != customPlay.id else {
            practiceRuntimeMessage = "End the active custom play before deleting it."
            return
        }

        snapshot.customPlays.removeAll { $0.id == customPlay.id }
        persistSnapshot(syncMutations: [.customPlayDelete(id: customPlay.id)])
    }

    func requestDeleteCustomPlayConfirmation(_ customPlay: CustomPlay) {
        runtimeSafetyPrompt = .deleteCustomPlay(name: customPlay.name, customPlayID: customPlay.id)
    }

    func toggleFavorite(for customPlay: CustomPlay) {
        var updatedCustomPlay = customPlay
        updatedCustomPlay.isFavorite.toggle()
        snapshot.customPlays = upsert(updatedCustomPlay, into: snapshot.customPlays)
        persistSnapshot(syncMutations: [.customPlayUpsert(updatedCustomPlay)])
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
            soundPlayer.playSound(named: customPlay.startSoundName)
            practiceRuntimeMessage = nil
            recordLastUsedPracticeTarget(
                LastUsedPracticeTarget(
                    kind: .customPlay,
                    title: customPlay.name,
                    meditationType: customPlay.meditationType,
                    customPlayID: customPlay.id,
                    updatedAt: Date()
                )
            )
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

    func requestEndCustomPlayConfirmation() {
        guard let activeCustomPlaySession else {
            return
        }

        runtimeSafetyPrompt = .endCustomPlay(name: activeCustomPlaySession.customPlay.name)
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
            persistSnapshot(syncMutations: [.playlistUpsert(savedPlaylist)])
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
        persistSnapshot(syncMutations: [.playlistDelete(id: playlist.id)])
    }

    func requestDeletePlaylistConfirmation(_ playlist: Playlist) {
        runtimeSafetyPrompt = .deletePlaylist(name: playlist.name, playlistID: playlist.id)
    }

    func toggleFavorite(for playlist: Playlist) {
        var updatedPlaylist = playlist
        updatedPlaylist.isFavorite.toggle()
        snapshot.playlists = upsert(updatedPlaylist, into: snapshot.playlists)
        persistSnapshot(syncMutations: [.playlistUpsert(updatedPlaylist)])
    }

    func saveSankalpa(_ draft: SankalpaDraft, editing sankalpa: Sankalpa? = nil) -> Bool {
        sankalpaValidationMessage = nil
        sankalpaFeedbackMessage = nil

        do {
            let savedSankalpa = try SankalpaFeature.makeSankalpa(from: draft, existing: sankalpa, now: now)
            snapshot.sankalpas = upsert(savedSankalpa, into: snapshot.sankalpas)
            persistSnapshot(syncMutations: [.sankalpaUpsert(savedSankalpa)])
            sankalpaFeedbackMessage = sankalpa == nil ? "Sankalpa created." : "Sankalpa updated."
            return true
        } catch let error as SankalpaValidationError {
            sankalpaValidationMessage = error.message
            return false
        } catch {
            sankalpaValidationMessage = "The sankalpa could not be saved."
            return false
        }
    }

    func archiveSankalpa(_ sankalpa: Sankalpa) {
        sankalpaFeedbackMessage = nil
        let archivedSankalpa = SankalpaFeature.archive(sankalpa)
        snapshot.sankalpas = upsert(archivedSankalpa, into: snapshot.sankalpas)
        persistSnapshot(syncMutations: [.sankalpaUpsert(archivedSankalpa)])
        sankalpaFeedbackMessage = "Sankalpa archived."
    }

    func requestArchiveSankalpaConfirmation(_ sankalpa: Sankalpa) {
        runtimeSafetyPrompt = .archiveSankalpa(title: sankalpa.title, sankalpaID: sankalpa.id)
    }

    func restoreSankalpa(_ sankalpa: Sankalpa) {
        sankalpaFeedbackMessage = nil
        let restoredSankalpa = SankalpaFeature.restore(sankalpa)
        snapshot.sankalpas = upsert(restoredSankalpa, into: snapshot.sankalpas)
        persistSnapshot(syncMutations: [.sankalpaUpsert(restoredSankalpa)])
        sankalpaFeedbackMessage = "Sankalpa restored."
    }

    func deleteArchivedSankalpa(_ sankalpa: Sankalpa) {
        guard sankalpa.archived else {
            sankalpaFeedbackMessage = "Delete is available only for archived sankalpas."
            return
        }

        sankalpaFeedbackMessage = nil
        snapshot.sankalpas.removeAll { $0.id == sankalpa.id }
        persistSnapshot(syncMutations: [.sankalpaDelete(id: sankalpa.id)])
        sankalpaFeedbackMessage = "Archived sankalpa deleted."
    }

    func requestDeleteArchivedSankalpaConfirmation(_ sankalpa: Sankalpa) {
        guard sankalpa.archived else {
            sankalpaFeedbackMessage = "Delete is available only for archived sankalpas."
            return
        }

        runtimeSafetyPrompt = .deleteArchivedSankalpa(title: sankalpa.title, sankalpaID: sankalpa.id)
    }

    func setObservanceStatus(
        for sankalpa: Sankalpa,
        dateKey: String,
        status: SankalpaObservanceDayStatus
    ) {
        sankalpaFeedbackMessage = nil
        let updatedSankalpa = SankalpaFeature.setObservanceStatus(
            for: sankalpa,
            dateKey: dateKey,
            status: status,
            now: now
        )
        snapshot.sankalpas = upsert(updatedSankalpa, into: snapshot.sankalpas)
        persistSnapshot(syncMutations: [.sankalpaUpsert(updatedSankalpa)])
        sankalpaFeedbackMessage = "Observance check-in saved."
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
            recordLastUsedPracticeTarget(
                LastUsedPracticeTarget(
                    kind: .playlist,
                    title: playlist.name,
                    meditationType: playlist.items.first?.meditationType ?? snapshot.timerDraft.meditationType ?? .vipassana,
                    playlistID: playlist.id,
                    updatedAt: Date()
                )
            )
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

    func requestEndPlaylistConfirmation() {
        guard let activePlaylistSession else {
            return
        }

        runtimeSafetyPrompt = .endPlaylist(name: activePlaylistSession.playlist.name)
    }

    func confirmRuntimeSafetyPrompt() {
        guard let runtimeSafetyPrompt else {
            return
        }

        self.runtimeSafetyPrompt = nil

        switch runtimeSafetyPrompt {
        case .endTimer:
            endTimerManually()
        case .endCustomPlay:
            endCustomPlayManually()
        case .endPlaylist:
            endPlaylistManually()
        case .archiveSankalpa(_, let sankalpaID):
            guard let sankalpa = snapshot.sankalpas.first(where: { $0.id == sankalpaID }) else {
                sankalpaFeedbackMessage = "The sankalpa is no longer available."
                return
            }

            archiveSankalpa(sankalpa)
        case .deleteArchivedSankalpa(_, let sankalpaID):
            guard let sankalpa = snapshot.sankalpas.first(where: { $0.id == sankalpaID }) else {
                sankalpaFeedbackMessage = "The archived sankalpa is no longer available."
                return
            }

            deleteArchivedSankalpa(sankalpa)
        case .deleteCustomPlay(_, let customPlayID):
            guard let customPlay = snapshot.customPlays.first(where: { $0.id == customPlayID }) else {
                practiceRuntimeMessage = "The custom play is no longer available."
                return
            }

            deleteCustomPlay(customPlay)
        case .deletePlaylist(_, let playlistID):
            guard let playlist = snapshot.playlists.first(where: { $0.id == playlistID }) else {
                practiceRuntimeMessage = "The playlist is no longer available."
                return
            }

            deletePlaylist(playlist)
        }
    }

    func cancelRuntimeSafetyPrompt() {
        runtimeSafetyPrompt = nil
    }

    func handleScenePhaseChange(isActive: Bool) {
        if isActive {
            now = Date()
            handleClockTick(now)
            Task {
                await refreshNotificationPermissionState()
            }
            if environment.requiresBackend {
                scheduleSync()
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
        ShellViewModelPresentation.activeTimerPrimaryText(for: activeSession, now: now)
    }

    func activeTimerSecondaryText() -> String {
        ShellViewModelPresentation.activeTimerSecondaryText(for: activeSession, now: now)
    }

    func activeCustomPlayPrimaryText() -> String {
        ShellViewModelPresentation.activeCustomPlayPrimaryText(for: activeCustomPlaySession, now: now)
    }

    func activeCustomPlaySecondaryText() -> String {
        ShellViewModelPresentation.activeCustomPlaySecondaryText(for: activeCustomPlaySession, now: now)
    }

    func activePlaylistPrimaryText() -> String {
        ShellViewModelPresentation.activePlaylistPrimaryText(for: activePlaylistSession, now: now)
    }

    func activePlaylistTitle() -> String {
        ShellViewModelPresentation.activePlaylistTitle(for: activePlaylistSession)
    }

    func activePlaylistSecondaryText() -> String {
        ShellViewModelPresentation.activePlaylistSecondaryText(for: activePlaylistSession)
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
        soundPlayer.playSound(named: activeCustomPlaySession.customPlay.endSoundName)
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
        persistSnapshot(syncMutations: logs.map { SyncMutation.sessionLogUpsert($0) })
    }

    private func persistSnapshot(syncMutations: [SyncMutation] = []) {
        do {
            snapshot.summary = SummaryFeature.makeStoredSummarySnapshot(from: snapshot.recentSessionLogs)
            try repository.save(snapshot)
            isSeedData = snapshot == SampleData.snapshot
            if syncMutations.isEmpty == false {
                for syncMutation in syncMutations {
                    syncState = AppSyncFeature.enqueue(syncMutation, into: syncState)
                }
                updateConnectionStateAfterLocalChange()
                saveSyncState()
                scheduleSync()
            }
        } catch {
            persistenceMessage = "Local changes could not be saved right now."
        }
    }

    private func saveSyncState() {
        do {
            try syncRepository.save(syncState)
        } catch {
            persistenceMessage = "Local sync state could not be saved right now."
        }
    }

    private func updateConnectionStateAfterLocalChange() {
        if environment.requiresBackend == false {
            syncState.connectionState = .localOnly
            return
        }

        syncState.connectionState = .pendingSync
        syncState.lastErrorMessage = nil
        syncState.lastNoticeMessage = nil
    }

    private func scheduleSync() {
        guard environment.requiresBackend, syncClient != nil else {
            syncState.connectionState = .localOnly
            saveSyncState()
            return
        }

        if isRunningSync {
            needsSyncPass = true
            return
        }

        Task { [weak self] in
            await self?.runSyncPass()
        }
    }

    private func runSyncPass() async {
        guard let syncClient else {
            return
        }

        if isRunningSync {
            needsSyncPass = true
            return
        }

        isRunningSync = true
        defer {
            isRunningSync = false
            if needsSyncPass {
                needsSyncPass = false
                Task { [weak self] in
                    await self?.runSyncPass()
                }
            }
        }

        syncState.lastAttemptedSyncAt = Date()
        syncState.connectionState = .syncing
        syncState.lastNoticeMessage = nil
        saveSyncState()

        let timeZoneIdentifier = TimeZone.current.identifier

        do {
            let result = try await ShellSyncPassRunner.run(
                syncClient: syncClient,
                repository: repository,
                snapshot: snapshot,
                syncState: syncState,
                timeZoneIdentifier: timeZoneIdentifier
            )
            snapshot = result.snapshot
            syncState = result.syncState
            saveSyncState()
        } catch let error as AppSyncError {
            switch error {
            case .offline:
                syncState.connectionState = .offline
                syncState.lastErrorMessage = "The device appears offline."
            case .backendUnavailable:
                syncState.connectionState = .backendUnavailable
                syncState.lastErrorMessage = "The configured backend is unavailable."
            case .invalidResponse(let message):
                syncState.connectionState = .backendUnavailable
                syncState.lastErrorMessage = message
            case .server(_, let message):
                syncState.connectionState = .backendUnavailable
                syncState.lastErrorMessage = message
            }
            syncState.lastNoticeMessage = nil
            saveSyncState()
        } catch {
            syncState.connectionState = .backendUnavailable
            syncState.lastErrorMessage = "The backend sync could not finish."
            syncState.lastNoticeMessage = nil
            saveSyncState()
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

    private func startTimer(
        using draft: TimerSettingsDraft,
        recordLastUsedTarget lastUsedTarget: LastUsedPracticeTarget?
    ) {
        guard hasActivePracticeRuntime == false else {
            practiceRuntimeMessage = "Finish the current practice before starting something new."
            return
        }

        timerValidationMessage = nil
        practiceRuntimeMessage = nil
        persistenceMessage = nil

        do {
            activeSession = try TimerFeature.makeActiveSession(from: draft, now: Date())
            now = Date()
            soundPlayer.playSound(named: activeSession?.configuration.startSoundName)
            if let lastUsedTarget {
                var updatedLastUsedTarget = lastUsedTarget
                updatedLastUsedTarget.updatedAt = Date()
                recordLastUsedPracticeTarget(updatedLastUsedTarget)
            }
            startClock()
            rescheduleTimerNotificationIfNeeded()
        } catch let error as TimerValidationError {
            timerValidationMessage = error.message
        } catch {
            timerValidationMessage = "The timer could not start with the current setup."
        }
    }

    private func customPlayTargetEndAt(_ session: ActiveCustomPlaySession) -> Date {
        session.startedAt
            .addingTimeInterval(TimeInterval(session.customPlay.durationSeconds))
            .addingTimeInterval(session.accumulatedPauseSeconds)
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

    private func recordLastUsedPracticeTarget(_ target: LastUsedPracticeTarget) {
        snapshot.lastUsedPracticeTarget = target
        persistSnapshot()
    }
}
