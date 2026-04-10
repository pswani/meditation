import Combine
import Foundation
import SwiftUI

@MainActor
final class ShellViewModel: ObservableObject {
    enum RuntimeSafetyPrompt: Equatable, Identifiable {
        case endTimer(mode: TimerSettingsDraft.Mode)
        case endCustomPlay(name: String)
        case endPlaylist(name: String)
        case archiveSankalpa(title: String, sankalpaID: UUID)
        case deleteArchivedSankalpa(title: String, sankalpaID: UUID)
        case deleteCustomPlay(name: String, customPlayID: UUID)
        case deletePlaylist(name: String, playlistID: UUID)

        var id: String {
            switch self {
            case .endTimer(let mode):
                return "end-timer-\(mode.rawValue)"
            case .endCustomPlay(let name):
                return "end-custom-play-\(name)"
            case .endPlaylist(let name):
                return "end-playlist-\(name)"
            case .archiveSankalpa(_, let sankalpaID):
                return "archive-sankalpa-\(sankalpaID.uuidString)"
            case .deleteArchivedSankalpa(_, let sankalpaID):
                return "delete-archived-sankalpa-\(sankalpaID.uuidString)"
            case .deleteCustomPlay(_, let customPlayID):
                return "delete-custom-play-\(customPlayID.uuidString)"
            case .deletePlaylist(_, let playlistID):
                return "delete-playlist-\(playlistID.uuidString)"
            }
        }

        var title: String {
            switch self {
            case .endTimer(let mode):
                return mode == .fixedDuration ? "End timer early?" : "End session?"
            case .endCustomPlay:
                return "End custom play?"
            case .endPlaylist:
                return "End playlist?"
            case .archiveSankalpa:
                return "Archive sankalpa?"
            case .deleteArchivedSankalpa:
                return "Delete archived sankalpa?"
            case .deleteCustomPlay:
                return "Delete custom play?"
            case .deletePlaylist:
                return "Delete playlist?"
            }
        }

        var message: String {
            switch self {
            case .endTimer(let mode):
                if mode == .fixedDuration {
                    return "This ends the fixed-duration session now and saves an ended-early session log."
                }

                return "This ends the open-ended session now and saves the session log."
            case .endCustomPlay(let name):
                return "This stops \"\(name)\" now and saves the session log."
            case .endPlaylist(let name):
                return "This stops \"\(name)\" now and saves the current item log if needed."
            case .archiveSankalpa(let title, _):
                return "This moves \"\(title)\" out of the active path while keeping its progress visible."
            case .deleteArchivedSankalpa(let title, _):
                return "This permanently removes the archived sankalpa \"\(title)\" from this device."
            case .deleteCustomPlay(let name, _):
                return "This removes the saved custom play \"\(name)\" from this device."
            case .deletePlaylist(let name, _):
                return "This removes the saved playlist \"\(name)\" from this device."
            }
        }

        var confirmButtonTitle: String {
            switch self {
            case .endTimer, .endCustomPlay, .endPlaylist:
                return "End"
            case .archiveSankalpa:
                return "Archive"
            case .deleteArchivedSankalpa, .deleteCustomPlay, .deletePlaylist:
                return "Delete"
            }
        }

        var confirmButtonRole: ButtonRole? {
            switch self {
            case .deleteArchivedSankalpa, .deleteCustomPlay, .deletePlaylist:
                return .destructive
            case .endTimer, .endCustomPlay, .endPlaylist, .archiveSankalpa:
                return nil
            }
        }
    }

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
            let loadedSnapshot = Self.normalizedSnapshot(storedSnapshot)
            self.snapshot = loadedSnapshot
            self.isSeedData = loadedSnapshot == SampleData.snapshot
            if loadedSnapshot != storedSnapshot {
                try? repository.save(loadedSnapshot)
            }
        } catch {
            self.snapshot = Self.normalizedSnapshot(SampleData.snapshot)
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
        switch syncState.connectionState {
        case .localOnly:
            if syncState.pendingMutationCount > 0 {
                return "\(syncState.pendingMutationCount) local changes are waiting for a configured backend."
            }
            return nil
        case .syncing:
            return "Syncing with the configured backend."
        case .upToDate:
            return syncState.lastNoticeMessage
        case .pendingSync:
            let count = syncState.pendingMutationCount
            guard count > 0 else {
                return nil
            }
            return count == 1 ? "1 local change is pending sync." : "\(count) local changes are pending sync."
        case .offline:
            let count = syncState.pendingMutationCount
            if count > 0 {
                return count == 1
                    ? "Offline. 1 local change will sync when the connection returns."
                    : "Offline. \(count) local changes will sync when the connection returns."
            }
            return "Offline. Showing the latest saved local state."
        case .backendUnavailable:
            let count = syncState.pendingMutationCount
            if count > 0 {
                return count == 1
                    ? "Backend unavailable. 1 local change will sync when the API is reachable."
                    : "Backend unavailable. \(count) local changes will sync when the API is reachable."
            }
            return "Backend unavailable. Showing the latest saved local state."
        }
    }

    var syncStatusHeadline: String {
        switch syncState.connectionState {
        case .localOnly:
            return "Local-only profile"
        case .syncing:
            return "Syncing"
        case .upToDate:
            return "Backend synced"
        case .pendingSync:
            return "Pending sync"
        case .offline:
            return "Offline"
        case .backendUnavailable:
            return "Backend unavailable"
        }
    }

    var syncStatusDetail: String {
        let pendingCount = syncState.pendingMutationCount
        switch syncState.connectionState {
        case .localOnly:
            if pendingCount > 0 {
                return "This device kept local changes, but the current profile does not have a backend base URL to replay them."
            }
            return "This native profile stays local-first until `MEDITATION_IOS_API_BASE_URL` is configured."
        case .syncing:
            return "The app is refreshing backend-backed timer settings, session logs, custom plays, playlists, sankalpas, and summary data."
        case .upToDate:
            if let lastSuccessfulSyncAt = syncState.lastSuccessfulSyncAt {
                return "Last successful sync: \(RelativeDateTimeFormatter().localizedString(for: lastSuccessfulSyncAt, relativeTo: now))."
            }
            return "Local-first data is aligned with the configured backend."
        case .pendingSync:
            return pendingCount == 1
                ? "1 local change is queued safely on this device and will replay next time the backend is reachable."
                : "\(pendingCount) local changes are queued safely on this device and will replay next time the backend is reachable."
        case .offline:
            return "The device appears offline. Local-first changes stay visible here and will replay when connectivity returns."
        case .backendUnavailable:
            return "The device is online, but the configured backend could not be reached. Local-first changes stay visible here in the meantime."
        }
    }

    var customPlays: [CustomPlay] {
        snapshot.customPlays.sorted(by: sortCustomPlays)
    }

    var favoriteCustomPlaysForHome: [CustomPlay] {
        Array(customPlays.filter(\.isFavorite).prefix(3))
    }

    var playlists: [Playlist] {
        snapshot.playlists.sorted(by: sortPlaylists)
    }

    var favoritePlaylistsForHome: [Playlist] {
        Array(playlists.filter(\.isFavorite).prefix(3))
    }

    var homeQuickStartSummary: String {
        let meditationType = snapshot.timerDraft.meditationType?.rawValue ?? "Choose a meditation type"
        if snapshot.timerDraft.mode == .fixedDuration {
            return "\(snapshot.timerDraft.durationMinutes) min fixed-duration • \(meditationType)"
        }

        return "Open-ended • \(meditationType)"
    }

    var lastUsedPracticeSummary: String? {
        guard let target = snapshot.lastUsedPracticeTarget else {
            return nil
        }

        switch target.kind {
        case .timer:
            if let timerDraft = target.timerDraft {
                let meditationType = timerDraft.meditationType?.rawValue ?? target.meditationType.rawValue
                if timerDraft.mode == .fixedDuration {
                    return "\(target.title) • \(timerDraft.durationMinutes) min • \(meditationType)"
                }

                return "\(target.title) • Open-ended • \(meditationType)"
            }

            return "\(target.title) • \(target.meditationType.rawValue)"
        case .customPlay:
            return "\(target.title) • \(target.meditationType.rawValue)"
        case .playlist:
            return "\(target.title) • \(target.meditationType.rawValue)"
        }
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
        startTimer(using: snapshot.timerDraft, recordLastUsedTarget: makeTimerLastUsedTarget(from: snapshot.timerDraft))
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
            let remoteState = try await syncClient.fetchRemoteState(
                localSnapshot: snapshot,
                timeZoneIdentifier: timeZoneIdentifier
            )
            snapshot = Self.normalizedSnapshot(
                AppSyncFeature.reconcile(
                    remoteState: remoteState,
                    localSnapshot: snapshot,
                    pendingMutations: syncState.pendingMutations
                )
            )
            if let summary = remoteState.summary {
                syncState.lastRemoteSummary = summary
            }
            try repository.save(snapshot)

            while let nextMutation = syncState.pendingMutations.first {
                let authoritativeState = try await syncClient.applyMutation(
                    nextMutation,
                    localSnapshot: snapshot,
                    timeZoneIdentifier: timeZoneIdentifier
                )
                snapshot = Self.normalizedSnapshot(
                    AppSyncFeature.applyAuthoritativeMutationResult(
                        mutation: nextMutation,
                        remoteState: authoritativeState,
                        to: snapshot
                    )
                )
                syncState.pendingMutations.removeFirst()
                syncState.lastRemoteSummary = authoritativeState.summary ?? syncState.lastRemoteSummary
                if let syncNoticeMessage = authoritativeState.syncNoticeMessage {
                    syncState.lastNoticeMessage = syncNoticeMessage
                }
                try repository.save(snapshot)
                saveSyncState()
            }

            syncState.lastSuccessfulSyncAt = Date()
            syncState.lastErrorMessage = nil
            syncState.connectionState = .upToDate
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

    private func recordLastUsedPracticeTarget(_ target: LastUsedPracticeTarget) {
        snapshot.lastUsedPracticeTarget = target
        persistSnapshot()
    }

    private func makeTimerLastUsedTarget(from draft: TimerSettingsDraft) -> LastUsedPracticeTarget {
        let meditationType = draft.meditationType ?? snapshot.lastUsedPracticeTarget?.meditationType ?? .vipassana
        let title = draft.mode == .fixedDuration
            ? "\(draft.durationMinutes) min timer"
            : "Open-ended timer"

        return LastUsedPracticeTarget(
            kind: .timer,
            title: title,
            meditationType: meditationType,
            timerDraft: draft,
            updatedAt: Date()
        )
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

    private static func normalizedSnapshot(_ snapshot: AppSnapshot) -> AppSnapshot {
        var normalizedSnapshot = snapshot
        normalizedSnapshot.recentSessionLogs = snapshot.recentSessionLogs.sorted { $0.endedAt > $1.endedAt }
        normalizedSnapshot.summary = SummaryFeature.makeStoredSummarySnapshot(from: normalizedSnapshot.recentSessionLogs)
        if normalizedSnapshot.lastUsedPracticeTarget == nil {
            normalizedSnapshot.lastUsedPracticeTarget = deriveLastUsedPracticeTarget(from: normalizedSnapshot)
        }
        return normalizedSnapshot
    }

    private static func deriveLastUsedPracticeTarget(from snapshot: AppSnapshot) -> LastUsedPracticeTarget? {
        guard let latestLog = snapshot.recentSessionLogs.first else {
            return nil
        }

        switch latestLog.source {
        case .timer:
            let timerDraft = snapshot.timerDraft
            return LastUsedPracticeTarget(
                kind: .timer,
                title: timerDraft.mode == .fixedDuration ? "\(timerDraft.durationMinutes) min timer" : "Open-ended timer",
                meditationType: latestLog.meditationType,
                timerDraft: timerDraft,
                updatedAt: latestLog.endedAt
            )
        case .customPlay:
            guard let customPlayName = latestLog.notes?.trimmingCharacters(in: .whitespacesAndNewlines),
                  customPlayName.isEmpty == false,
                  let customPlay = snapshot.customPlays.first(where: { $0.name == customPlayName })
            else {
                return nil
            }

            return LastUsedPracticeTarget(
                kind: .customPlay,
                title: customPlay.name,
                meditationType: customPlay.meditationType,
                customPlayID: customPlay.id,
                updatedAt: latestLog.endedAt
            )
        case .playlist:
            guard let playlistName = playlistName(from: latestLog.notes),
                  let playlist = snapshot.playlists.first(where: { $0.name == playlistName })
            else {
                return nil
            }

            return LastUsedPracticeTarget(
                kind: .playlist,
                title: playlist.name,
                meditationType: playlist.items.first?.meditationType ?? snapshot.timerDraft.meditationType ?? .vipassana,
                playlistID: playlist.id,
                updatedAt: latestLog.endedAt
            )
        case .manual:
            return nil
        }
    }

    private static func playlistName(from notes: String?) -> String? {
        guard let notes else {
            return nil
        }

        let prefix = "Playlist: "
        let itemMarker = " • Item: "
        guard notes.hasPrefix(prefix),
              let itemRange = notes.range(of: itemMarker)
        else {
            return nil
        }

        let extractedName = String(notes[notes.index(notes.startIndex, offsetBy: prefix.count)..<itemRange.lowerBound])
            .trimmingCharacters(in: .whitespacesAndNewlines)

        return extractedName.isEmpty ? nil : extractedName
    }
}
