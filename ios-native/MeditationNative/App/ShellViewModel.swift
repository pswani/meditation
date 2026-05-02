import Foundation
import os
import SwiftUI

private let shellLogger = Logger(subsystem: "com.meditation.native", category: "shell")

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
    @Published var historyFeedbackMessage: String?
    @Published var customPlayValidationMessage: String?
    @Published var playlistValidationMessage: String?
    @Published var sankalpaValidationMessage: String?
    @Published var sankalpaFeedbackMessage: String?
    @Published var practiceRuntimeMessage: String?
    @Published var persistenceMessage: String?
    @Published var timerDefaultsFeedbackMessage: String?
    @Published var timerDefaultsValidationMessage: String?
    @Published var backendConfigurationFeedbackMessage: String?
    @Published var backendConfigurationValidationMessage: String?

    let sessionDisplay = ActiveSessionDisplay()

    private let repository: LocalAppSnapshotRepository
    private let syncRepository: LocalAppSyncStateRepository
    private let combinedStateStore: CombinedAppStateStore
    private let notificationScheduler: NotificationScheduling
    private let backgroundAudioKeepAlive: BackgroundAudioKeeping
    private var clockTimer: DispatchSourceTimer?
    private let syncClientFactory: @Sendable (URL) -> AppSyncClient
    private var syncClient: AppSyncClient?
    private var isRunningSync = false
    private var needsSyncPass = false

    let timerCoordinator: TimerSessionCoordinator
    let customPlayCoordinator: CustomPlaySessionCoordinator
    let playlistCoordinator: PlaylistSessionCoordinator

    init(
        repository: LocalAppSnapshotRepository = .live(
            environment: AppEnvironment.from()
        ),
        syncRepository: LocalAppSyncStateRepository = .live(
            environment: AppEnvironment.from()
        ),
        combinedStateStore: CombinedAppStateStore = .live(),
        notificationScheduler: NotificationScheduling = LiveNotificationScheduler(),
        timerCompletionBridge: TimerCompletionBridging? = nil,
        soundPlayer: TimerSoundPlaying? = nil,
        audioPlayer: CustomPlayAudioControlling? = nil,
        backgroundAudioKeepAlive: BackgroundAudioKeeping? = nil,
        syncClient: AppSyncClient? = nil,
        syncClientFactory: @escaping @Sendable (URL) -> AppSyncClient = { LiveAppSyncClient(baseURL: $0) }
    ) {
        self.repository = repository
        self.syncRepository = syncRepository
        self.combinedStateStore = combinedStateStore
        self.notificationScheduler = notificationScheduler
        self.backgroundAudioKeepAlive = backgroundAudioKeepAlive ?? SilentBackgroundAudioKeepAlive()
        self.syncClientFactory = syncClientFactory

        let resolvedSoundPlayer: TimerSoundPlaying = soundPlayer ?? SystemSoundPlayer()
        let resolvedAudioPlayer: CustomPlayAudioControlling = audioPlayer ?? BundledCustomPlayAudioPlayer()
        let resolvedBridge: TimerCompletionBridging = timerCompletionBridge ?? LiveTimerCompletionBridge()
        let resolvedKeepAlive: BackgroundAudioKeeping = self.backgroundAudioKeepAlive

        self.timerCoordinator = TimerSessionCoordinator(
            soundPlayer: resolvedSoundPlayer,
            notificationScheduler: notificationScheduler,
            timerCompletionBridge: resolvedBridge,
            backgroundAudioKeepAlive: resolvedKeepAlive
        )
        self.customPlayCoordinator = CustomPlaySessionCoordinator(
            audioPlayer: resolvedAudioPlayer,
            soundPlayer: resolvedSoundPlayer,
            notificationScheduler: notificationScheduler
        )
        self.playlistCoordinator = PlaylistSessionCoordinator(
            audioPlayer: resolvedAudioPlayer
        )

        self.syncClient = syncClient ?? repository.environment.apiBaseURL.map(syncClientFactory)

        do {
            self.syncState = try syncRepository.load(
                default: repository.environment.requiresBackend
                    ? AppSyncState(connectionState: .pendingSync)
                    : .localOnly
            )
        } catch {
            // Corruption detected — reset to a fresh state and trigger a full server pull.
            shellLogger.error("AppSyncState corrupted, resetting: \(error.localizedDescription, privacy: .public)")
            var fresh = AppSyncState(
                connectionState: repository.environment.requiresBackend ? .pendingSync : .localOnly
            )
            fresh.needsFullResync = repository.environment.requiresBackend
            try? syncRepository.save(fresh)
            self.syncState = fresh
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

        // Phase 2: all stored properties initialized — can use self now
        resolvedAudioPlayer.onPlaybackCompletion = { [weak self] in
            self?.handleAudioPlaybackCompletion()
        }
        timerCoordinator.delegate = self
        customPlayCoordinator.delegate = self
        playlistCoordinator.delegate = self

        restorePersistedActiveRuntimeIfNeeded()

        if environment.requiresBackend {
            scheduleSync()
        } else {
            syncState.connectionState = .localOnly
        }
    }

    deinit {
        clockTimer?.cancel()
    }

    var timerDraftBinding: Binding<TimerSettingsDraft> {
        Binding(
            get: { self.snapshot.timerDraft },
            set: { [weak self] newValue in
                self?.snapshot.timerDraft = newValue
                self?.saveSnapshot(syncMutations: [.timerSettingsUpsert(newValue)])
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

    func canResolvePlayback(for media: CustomPlayMedia?) -> Bool {
        guard let media else { return false }
        return media.canResolvePlaybackURL(apiBaseURL: environment.apiBaseURL)
    }

    func canStartCustomPlay(_ customPlay: CustomPlay) -> Bool {
        ShellViewModelPresentation.canStartCustomPlay(
            canResolvePlayback: canResolvePlayback(for: customPlay.media),
            hasActivePracticeRuntime: hasActivePracticeRuntime
        )
    }

    func customPlayStartSupportMessage(for customPlay: CustomPlay) -> String? {
        ShellViewModelPresentation.customPlayStartSupportMessage(
            canResolvePlayback: canResolvePlayback(for: customPlay.media),
            hasActivePracticeRuntime: hasActivePracticeRuntime
        )
    }

    func playlistRunValidationMessage(for playlist: Playlist) -> String? {
        if let validationError = PlaylistFeature.validatePlaylistForRun(
            playlist,
            availableCustomPlays: snapshot.customPlays
        ) {
            return validationError.message
        }

        for item in playlist.items where item.kind == .customPlay {
            guard let customPlayID = item.customPlayID,
                  let customPlay = snapshot.customPlays.first(where: { $0.id == customPlayID }),
                  canResolvePlayback(for: customPlay.media)
            else {
                return PlaylistValidationError.customPlayNeedsMedia.message
            }
        }

        return nil
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
        timerCoordinator.pause(at: now)
    }

    func resumeTimer() {
        let resumedAt = Date()
        now = resumedAt
        timerCoordinator.resume(at: resumedAt)
    }

    func endTimerManually() {
        timerCoordinator.endManually(at: Date())
    }

    func requestEndTimerConfirmation() {
        guard let activeSession else { return }
        runtimeSafetyPrompt = .endTimer(mode: activeSession.configuration.mode)
    }

    func saveManualLog(_ draft: ManualLogDraft) -> Bool {
        manualLogValidationMessage = nil
        historyFeedbackMessage = nil
        persistenceMessage = nil

        do {
            let log = try TimerFeature.makeManualLog(from: draft)
            insertLogs([log])
            historyFeedbackMessage = persistenceMessage ?? "Manual log saved."
            return true
        } catch let error as ManualLogValidationError {
            manualLogValidationMessage = error.message
            return false
        } catch {
            manualLogValidationMessage = "The manual log could not be saved."
            return false
        }
    }

    func canChangeHistoryMeditationType(for log: SessionLog) -> Bool {
        ShellViewModelPresentation.canChangeHistoryMeditationType(for: log)
    }

    func updateHistoryMeditationType(for log: SessionLog, to meditationType: MeditationType) -> Bool {
        historyFeedbackMessage = nil
        persistenceMessage = nil

        guard canChangeHistoryMeditationType(for: log) else {
            historyFeedbackMessage = "Meditation type can be changed only for manual logs."
            return false
        }

        guard snapshot.recentSessionLogs.contains(where: { $0.id == log.id }) else {
            historyFeedbackMessage = "That manual log is no longer available."
            return false
        }

        var updatedLog = log
        updatedLog.meditationType = meditationType
        snapshot.recentSessionLogs = upsert(updatedLog, into: snapshot.recentSessionLogs)
            .sorted { $0.endedAt > $1.endedAt }
        saveSnapshot(syncMutations: [.sessionLogUpsert(updatedLog)])
        historyFeedbackMessage = persistenceMessage ?? "Meditation type updated for the manual log."
        return true
    }

    func saveCustomPlay(_ draft: CustomPlayDraft) -> Bool {
        customPlayValidationMessage = nil
        practiceRuntimeMessage = nil

        do {
            let savedCustomPlay = try CustomPlayFeature.makeCustomPlay(from: draft, existingID: draft.id)
            snapshot.customPlays = upsert(savedCustomPlay, into: snapshot.customPlays)
            saveSnapshot(syncMutations: [.customPlayUpsert(savedCustomPlay)])
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
        saveSnapshot(syncMutations: [.timerSettingsUpsert(snapshot.timerDraft)])
        practiceRuntimeMessage = "Custom play \"\(customPlay.name)\" applied to timer setup."
    }

    func saveTimerDefaults(_ draft: TimerSettingsDraft) {
        timerDefaultsFeedbackMessage = nil
        timerDefaultsValidationMessage = nil
        persistenceMessage = nil

        if let validationError = TimerFeature.validateTimerDraft(draft).first {
            timerDefaultsValidationMessage = validationError.message
            return
        }

        snapshot.timerDraft = draft
        saveSnapshot(syncMutations: [.timerSettingsUpsert(draft)])
        if persistenceMessage == nil {
            timerDefaultsFeedbackMessage = "Timer defaults saved."
        }
    }

    func clearTimerDefaultsFeedback() {
        timerDefaultsFeedbackMessage = nil
        timerDefaultsValidationMessage = nil
    }

    func saveBackendConfiguration(profileName: String, apiBaseURLString: String) -> Bool {
        backendConfigurationFeedbackMessage = nil
        backendConfigurationValidationMessage = nil
        persistenceMessage = nil

        do {
            let updatedEnvironment = try AppEnvironment.configured(
                profileName: profileName,
                apiBaseURLString: apiBaseURLString
            )
            applyEnvironment(updatedEnvironment)
            saveSyncState()
            backendConfigurationFeedbackMessage = "Backend configuration saved."
            scheduleSync()
            return true
        } catch let error as AppEnvironmentConfigurationError {
            backendConfigurationValidationMessage = error.message
            return false
        } catch {
            backendConfigurationValidationMessage = "The backend configuration could not be saved."
            return false
        }
    }

    func clearBackendConfiguration() {
        backendConfigurationFeedbackMessage = nil
        backendConfigurationValidationMessage = nil
        persistenceMessage = nil

        AppEnvironment.clearPersistedConfiguration()
        applyEnvironment(.localOnly)
        saveSyncState()
        backendConfigurationFeedbackMessage = "Backend configuration cleared. This iPhone is local-only again."
    }

    func clearBackendConfigurationFeedback() {
        backendConfigurationFeedbackMessage = nil
        backendConfigurationValidationMessage = nil
    }

    func deleteCustomPlay(_ customPlay: CustomPlay) {
        guard activeCustomPlaySession?.customPlay.id != customPlay.id else {
            practiceRuntimeMessage = "End the active custom play before deleting it."
            return
        }

        snapshot.customPlays.removeAll { $0.id == customPlay.id }
        saveSnapshot(syncMutations: [.customPlayDelete(id: customPlay.id)])
    }

    func requestDeleteCustomPlayConfirmation(_ customPlay: CustomPlay) {
        runtimeSafetyPrompt = .deleteCustomPlay(name: customPlay.name, customPlayID: customPlay.id)
    }

    func toggleFavorite(for customPlay: CustomPlay) {
        var updatedCustomPlay = customPlay
        updatedCustomPlay.isFavorite.toggle()
        snapshot.customPlays = upsert(updatedCustomPlay, into: snapshot.customPlays)
        saveSnapshot(syncMutations: [.customPlayUpsert(updatedCustomPlay)])
    }

    @discardableResult
    func startCustomPlay(_ customPlay: CustomPlay) -> Bool {
        guard hasActivePracticeRuntime == false else {
            practiceRuntimeMessage = "Finish the current practice before starting something new."
            return false
        }

        practiceRuntimeMessage = customPlayCoordinator.start(customPlay)
        recordLastUsedPracticeTarget(
            LastUsedPracticeTarget(
                kind: .customPlay,
                title: customPlay.name,
                meditationType: customPlay.meditationType,
                customPlayID: customPlay.id,
                updatedAt: Date()
            )
        )
        return true
    }

    func pauseCustomPlay() {
        customPlayCoordinator.pause(at: now)
    }

    func resumeCustomPlay() {
        customPlayCoordinator.resume(at: now)
    }

    func endCustomPlayManually() {
        customPlayCoordinator.endManually()
    }

    func requestEndCustomPlayConfirmation() {
        guard let activeCustomPlaySession else { return }
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
            saveSnapshot(syncMutations: [.playlistUpsert(savedPlaylist)])
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
        saveSnapshot(syncMutations: [.playlistDelete(id: playlist.id)])
    }

    func requestDeletePlaylistConfirmation(_ playlist: Playlist) {
        runtimeSafetyPrompt = .deletePlaylist(name: playlist.name, playlistID: playlist.id)
    }

    func toggleFavorite(for playlist: Playlist) {
        var updatedPlaylist = playlist
        updatedPlaylist.isFavorite.toggle()
        snapshot.playlists = upsert(updatedPlaylist, into: snapshot.playlists)
        saveSnapshot(syncMutations: [.playlistUpsert(updatedPlaylist)])
    }

    func startPlaylist(_ playlist: Playlist) {
        guard hasActivePracticeRuntime == false else {
            practiceRuntimeMessage = "Finish the current practice before starting something new."
            return
        }

        if let validationMessage = playlistRunValidationMessage(for: playlist) {
            practiceRuntimeMessage = validationMessage
            return
        }

        practiceRuntimeMessage = nil
        if playlistCoordinator.start(playlist) {
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
        }
    }

    func pausePlaylist() {
        playlistCoordinator.pause(at: now)
    }

    func resumePlaylist() {
        playlistCoordinator.resume(at: now)
    }

    func endPlaylistManually() {
        playlistCoordinator.endManually(at: Date())
    }

    func requestEndPlaylistConfirmation() {
        guard let activePlaylistSession else { return }
        runtimeSafetyPrompt = .endPlaylist(name: activePlaylistSession.playlist.name)
    }

    func confirmRuntimeSafetyPrompt() {
        guard let runtimeSafetyPrompt else { return }
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

    func saveSankalpa(_ draft: SankalpaDraft, editing sankalpa: Sankalpa? = nil) -> Bool {
        sankalpaValidationMessage = nil
        sankalpaFeedbackMessage = nil

        do {
            let savedSankalpa = try SankalpaFeature.makeSankalpa(from: draft, existing: sankalpa, now: now)
            snapshot.sankalpas = upsert(savedSankalpa, into: snapshot.sankalpas)
            saveSnapshot(syncMutations: [.sankalpaUpsert(savedSankalpa)])
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
        saveSnapshot(syncMutations: [.sankalpaUpsert(archivedSankalpa)])
        sankalpaFeedbackMessage = "Sankalpa archived."
    }

    func requestArchiveSankalpaConfirmation(_ sankalpa: Sankalpa) {
        runtimeSafetyPrompt = .archiveSankalpa(title: sankalpa.title, sankalpaID: sankalpa.id)
    }

    func restoreSankalpa(_ sankalpa: Sankalpa) {
        sankalpaFeedbackMessage = nil
        let restoredSankalpa = SankalpaFeature.restore(sankalpa)
        snapshot.sankalpas = upsert(restoredSankalpa, into: snapshot.sankalpas)
        saveSnapshot(syncMutations: [.sankalpaUpsert(restoredSankalpa)])
        sankalpaFeedbackMessage = "Sankalpa restored."
    }

    func deleteArchivedSankalpa(_ sankalpa: Sankalpa) {
        guard sankalpa.archived else {
            sankalpaFeedbackMessage = "Delete is available only for archived sankalpas."
            return
        }

        sankalpaFeedbackMessage = nil
        snapshot.sankalpas.removeAll { $0.id == sankalpa.id }
        saveSnapshot(syncMutations: [.sankalpaDelete(id: sankalpa.id)])
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
        saveSnapshot(syncMutations: [.sankalpaUpsert(updatedSankalpa)])
        sankalpaFeedbackMessage = "Observance check-in saved."
    }

    func handleScenePhaseChange(to phase: ScenePhase) {
        switch phase {
        case .active:
            timerCoordinator.handleForegroundTransition()
            customPlayCoordinator.handleForegroundTransition()
            now = Date()
            handleClockTick(now)
            Task { [weak self] in
                guard let self else { return }
                await refreshNotificationPermissionState()
            }
            if environment.requiresBackend {
                scheduleSync()
            }
        case .background:
            timerCoordinator.prepareForBackgroundTransition()
        case .inactive:
            timerCoordinator.prepareForBackgroundTransition()
        @unknown default:
            break
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

    // MARK: - Clock (internal — accessible from extensions in same file via `private`)

    private func handleClockTick(_ currentDate: Date) {
        now = currentDate
        tickSession()
    }

    private func tickSession() {
        let timerNow = timerCoordinator.effectiveTimerNow
        timerCoordinator.tick(at: timerNow)
        customPlayCoordinator.tick(at: now)
        playlistCoordinator.tick(at: now)
        updateSessionDisplay(timerNow: timerNow)
    }

    private func updateSessionDisplay(timerNow: Date) {
        sessionDisplay.timerPrimaryText = ShellViewModelPresentation.activeTimerPrimaryText(for: activeSession, now: timerNow)
        sessionDisplay.timerSecondaryText = ShellViewModelPresentation.activeTimerSecondaryText(for: activeSession, now: timerNow)
        sessionDisplay.timerIsPaused = activeSession?.isPaused ?? false
        sessionDisplay.timerIsOpenEnded = activeSession?.configuration.mode == .openEnded

        if let customPlay = activeCustomPlaySession?.customPlay {
            sessionDisplay.customPlayPrimaryText = ShellViewModelPresentation.activeCustomPlayPrimaryText(for: activeCustomPlaySession, now: now)
            sessionDisplay.customPlaySecondaryText = ShellViewModelPresentation.activeCustomPlaySecondaryText(for: activeCustomPlaySession, now: now)
            sessionDisplay.customPlayIsPaused = activeCustomPlaySession?.isPaused ?? false
            sessionDisplay.customPlayName = customPlay.name
            sessionDisplay.customPlaySoundSummaryText = customPlaySoundSummary(customPlay)
            sessionDisplay.customPlayRecordingLabel = customPlay.recordingLabel
            sessionDisplay.customPlayLinkedMediaIdentifier = customPlay.linkedMediaIdentifier
            sessionDisplay.customPlayMediaLabel = customPlay.media?.label
            sessionDisplay.customPlayMediaSourceSummary = customPlay.media?.sourceSummary
            sessionDisplay.customPlayCanResolvePlayback = canResolvePlayback(for: customPlay.media)
        }

        sessionDisplay.playlistPrimaryText = ShellViewModelPresentation.activePlaylistPrimaryText(for: activePlaylistSession, now: now)
        sessionDisplay.playlistTitle = ShellViewModelPresentation.activePlaylistTitle(for: activePlaylistSession)
        sessionDisplay.playlistSecondaryText = ShellViewModelPresentation.activePlaylistSecondaryText(for: activePlaylistSession)
        sessionDisplay.playlistIsPaused = activePlaylistSession?.isPaused ?? false
        sessionDisplay.playlistUpcomingItemTitle = activePlaylistSession?.upcomingItem?.title
    }

    private func handleAudioPlaybackCompletion() {
        if let session = customPlayCoordinator.session, !session.isPaused {
            customPlayCoordinator.handleAudioPlaybackCompletion(at: Date())
            return
        }
        handleClockTick(Date())
    }

    // MARK: - Background audio keep-alive

    private var shouldKeepBackgroundAudioAlive: Bool {
        if let session = timerCoordinator.session, shouldKeepBackgroundAudioAlive(for: session) {
            return true
        }
        if let session = customPlayCoordinator.session, shouldKeepBackgroundAudioAlive(for: session) {
            return true
        }
        return false
    }

    private func shouldKeepBackgroundAudioAlive(for session: ActiveTimerSession) -> Bool {
        guard !session.isPaused else { return false }
        if let endSoundName = session.configuration.endSoundName, !endSoundName.isEmpty { return true }
        if let intervalSoundName = session.configuration.intervalSoundName,
           !intervalSoundName.isEmpty,
           (session.configuration.intervalMinutes ?? 0) > 0 { return true }
        return false
    }

    private func shouldKeepBackgroundAudioAlive(for session: ActiveCustomPlaySession) -> Bool {
        guard !session.isPaused else { return false }
        if let endSoundName = session.customPlay.endSoundName, !endSoundName.isEmpty { return true }
        return false
    }

    // MARK: - Persistence and sync

    private func saveSnapshot(syncMutations: [SyncMutation] = []) {
        do {
            snapshot.activeRuntime = currentActiveRuntimeSnapshot()
            snapshot.summary = SummaryFeature.makeStoredSummarySnapshot(from: snapshot.recentSessionLogs)
            try repository.save(snapshot)
            try? combinedStateStore.save(snapshot: snapshot, syncState: syncState)
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
            try? combinedStateStore.save(snapshot: snapshot, syncState: syncState)
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

    private func applyEnvironment(_ updatedEnvironment: AppEnvironment) {
        environment = updatedEnvironment
        syncClient = updatedEnvironment.apiBaseURL.map(syncClientFactory)
        needsSyncPass = false

        if updatedEnvironment.requiresBackend {
            syncState.connectionState = syncState.pendingMutationCount > 0 ? .pendingSync : .syncing
        } else {
            syncState.connectionState = .localOnly
            syncState.lastSuccessfulSyncAt = nil
            syncState.lastAttemptedSyncAt = nil
        }

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
            guard let self else { return }
            await self.runSyncPass()
        }
    }

    private func runSyncPass() async {
        guard let syncClient else { return }

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
                    guard let self else { return }
                    await self.runSyncPass()
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
            syncState.mutationQueueOverflowed = false
            syncState.needsFullResync = false
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
                syncState.connectionState = .invalidBackendResponse
                syncState.lastErrorMessage = message
            case .server(_, let message):
                syncState.connectionState = .backendUnavailable
                syncState.lastErrorMessage = message
            case .contractMismatch(let endpoint, _):
                syncState.connectionState = .invalidBackendResponse
                syncState.lastErrorMessage = "Unexpected response from \(endpoint)."
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

    // MARK: - Runtime restoration

    private func restorePersistedActiveRuntimeIfNeeded() {
        guard let activeRuntime = snapshot.activeRuntime else { return }

        let currentDate = Date()
        now = currentDate

        if let timerSession = activeRuntime.timerSession {
            timerCoordinator.restore(timerSession, at: currentDate)
            return
        }

        if let customPlaySession = activeRuntime.customPlaySession {
            customPlayCoordinator.restore(customPlaySession, at: currentDate)
            return
        }

        if let playlistSession = activeRuntime.playlistSession {
            playlistCoordinator.restore(playlistSession, at: currentDate)
            return
        }

        snapshot.activeRuntime = nil
        saveSnapshot()
    }

    private func currentActiveRuntimeSnapshot() -> ActivePracticeSnapshot? {
        if let session = timerCoordinator.session {
            return ActivePracticeSnapshot(timerSession: session)
        }
        if let session = customPlayCoordinator.session {
            return ActivePracticeSnapshot(customPlaySession: session)
        }
        if let session = playlistCoordinator.session {
            return ActivePracticeSnapshot(playlistSession: session)
        }
        return nil
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

        let startNow = Date()
        now = startNow

        if timerCoordinator.start(using: draft, at: startNow) {
            if let lastUsedTarget {
                var updatedLastUsedTarget = lastUsedTarget
                updatedLastUsedTarget.updatedAt = Date()
                recordLastUsedPracticeTarget(updatedLastUsedTarget)
            } else {
                saveSnapshot()
            }
        }
    }

    private func recordLastUsedPracticeTarget(_ target: LastUsedPracticeTarget) {
        snapshot.lastUsedPracticeTarget = target
        saveSnapshot()
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
}

// MARK: - TimerSessionCoordinatorDelegate

extension ShellViewModel: TimerSessionCoordinatorDelegate {
    func timerSessionDidChange(_ session: ActiveTimerSession?) {
        activeSession = session
    }

    func timerValidationMessageDidChange(_ message: String?) {
        timerValidationMessage = message
    }
}

// MARK: - CustomPlaySessionCoordinatorDelegate

extension ShellViewModel: CustomPlaySessionCoordinatorDelegate {
    func customPlaySessionDidChange(_ session: ActiveCustomPlaySession?) {
        activeCustomPlaySession = session
    }
}

// MARK: - PlaylistSessionCoordinatorDelegate

extension ShellViewModel: PlaylistSessionCoordinatorDelegate {
    func playlistSessionDidChange(_ session: ActivePlaylistSession?) {
        activePlaylistSession = session
    }
}

// MARK: - Shared delegate implementations (satisfy all three coordinator delegate protocols)

extension ShellViewModel {
    func runtimeMessageDidChange(_ message: String?) {
        practiceRuntimeMessage = message
    }

    func insertLogs(_ logs: [SessionLog]) {
        guard logs.isEmpty == false else { return }
        snapshot.recentSessionLogs = (snapshot.recentSessionLogs + logs)
            .sorted { $0.endedAt > $1.endedAt }
        saveSnapshot(syncMutations: logs.map { SyncMutation.sessionLogUpsert($0) })
    }

    func persistSnapshot() {
        saveSnapshot(syncMutations: [])
    }

    func startClock() {
        clockTimer?.cancel()
        let timer = DispatchSource.makeTimerSource(queue: .global(qos: .userInteractive))
        timer.schedule(deadline: .now(), repeating: .milliseconds(200), leeway: .milliseconds(50))
        timer.setEventHandler { [weak self] in
            Task { @MainActor [weak self] in
                guard let self else { return }
                self.now = Date()
                self.tickSession()
            }
        }
        timer.resume()
        self.clockTimer = timer
    }

    func stopClockIfIdle() {
        guard hasActivePracticeRuntime == false else { return }
        clockTimer?.cancel()
        clockTimer = nil
    }

    func syncBackgroundAudioKeepAlive() {
        if shouldKeepBackgroundAudioAlive {
            backgroundAudioKeepAlive.begin()
        } else {
            backgroundAudioKeepAlive.end()
        }
    }
}
