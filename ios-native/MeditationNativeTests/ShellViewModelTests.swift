import Foundation
import XCTest
@testable import MeditationNative

@MainActor
final class ShellViewModelTests: XCTestCase {
    func testHomeShortcutStateStaysCompactAndSorted() throws {
        let (viewModel, _, _, _) = try makeViewModel()

        XCTAssertEqual(viewModel.homeQuickStartSummary, "25 min fixed-duration • Vipassana")
        XCTAssertEqual(viewModel.favoriteCustomPlaysForHome.map(\.name), ["Vipassana Sit 20"])
        XCTAssertTrue(viewModel.favoriteCustomPlaysForHome.allSatisfy(\.isFavorite))
        XCTAssertEqual(viewModel.favoritePlaylistsForHome.map(\.name), ["Morning Discipline"])
        XCTAssertTrue(viewModel.favoritePlaylistsForHome.allSatisfy(\.isFavorite))
        XCTAssertEqual(viewModel.homeRecentSessionLogs.count, 3)
        XCTAssertNotNil(viewModel.lastUsedPracticeSummary)
    }

    func testLastUsedTimerShortcutStartsThePersistedTimerDraft() throws {
        let targetDraft = TimerSettingsDraft(
            mode: .fixedDuration,
            durationMinutes: 12,
            meditationType: .sahaj,
            startSoundName: TimerSoundOption.gong.rawValue,
            endSoundName: TimerSoundOption.templeBell.rawValue
        )
        var snapshot = SampleData.snapshot
        snapshot.lastUsedPracticeTarget = LastUsedPracticeTarget(
            kind: .timer,
            title: "12 min timer",
            meditationType: .sahaj,
            timerDraft: targetDraft,
            updatedAt: Date(timeIntervalSince1970: 1_700_000_000)
        )

        let (viewModel, _, _, _) = try makeViewModel(snapshot: snapshot)

        viewModel.startLastUsedPractice()

        XCTAssertNotNil(viewModel.activeSession)
        XCTAssertEqual(viewModel.activeSession?.configuration.mode, .fixedDuration)
        XCTAssertEqual(viewModel.activeSession?.configuration.durationSeconds, 720)
        XCTAssertEqual(viewModel.activeSession?.configuration.meditationType, .sahaj)
        XCTAssertEqual(viewModel.activeSession?.configuration.startSoundName, TimerSoundOption.gong.rawValue)
        XCTAssertEqual(viewModel.snapshot.lastUsedPracticeTarget?.kind, .timer)
    }

    func testLastUsedCustomPlayShortcutStartsTheSavedCustomPlay() throws {
        var snapshot = SampleData.snapshot
        let customPlay = try XCTUnwrap(snapshot.customPlays.first(where: { $0.isFavorite }))
        snapshot.lastUsedPracticeTarget = LastUsedPracticeTarget(
            kind: .customPlay,
            title: customPlay.name,
            meditationType: customPlay.meditationType,
            customPlayID: customPlay.id,
            updatedAt: Date(timeIntervalSince1970: 1_700_000_100)
        )

        let (viewModel, _, _, _) = try makeViewModel(snapshot: snapshot)

        viewModel.startLastUsedPractice()

        XCTAssertEqual(viewModel.activeCustomPlaySession?.customPlay.id, customPlay.id)
        XCTAssertEqual(viewModel.activeCustomPlaySession?.customPlay.name, customPlay.name)
    }

    func testLastUsedPlaylistShortcutStartsTheSavedPlaylist() throws {
        var snapshot = SampleData.snapshot
        let playlist = try XCTUnwrap(snapshot.playlists.first(where: { $0.isFavorite }))
        snapshot.lastUsedPracticeTarget = LastUsedPracticeTarget(
            kind: .playlist,
            title: playlist.name,
            meditationType: playlist.items.first?.meditationType ?? .vipassana,
            playlistID: playlist.id,
            updatedAt: Date(timeIntervalSince1970: 1_700_000_200)
        )

        let (viewModel, _, _, _) = try makeViewModel(snapshot: snapshot)

        viewModel.startLastUsedPractice()

        XCTAssertEqual(viewModel.activePlaylistSession?.playlist.id, playlist.id)
        XCTAssertEqual(viewModel.activePlaylistSession?.playlist.name, playlist.name)
    }

    func testApplyCustomPlayToTimerCopiesTheParityMetadata() throws {
        let (viewModel, _, _, _) = try makeViewModel()
        let customPlay = CustomPlay(
            name: "Morning Focus",
            meditationType: .ajapa,
            durationSeconds: 900,
            startSoundName: TimerSoundOption.templeBell.rawValue,
            endSoundName: TimerSoundOption.gong.rawValue,
            media: .bundledSample(.vipassanaSit20)
        )

        viewModel.applyCustomPlayToTimer(customPlay)

        XCTAssertEqual(viewModel.snapshot.timerDraft.mode, .fixedDuration)
        XCTAssertEqual(viewModel.snapshot.timerDraft.durationMinutes, 15)
        XCTAssertEqual(viewModel.snapshot.timerDraft.meditationType, .ajapa)
        XCTAssertEqual(viewModel.snapshot.timerDraft.startSoundName, TimerSoundOption.templeBell.rawValue)
        XCTAssertEqual(viewModel.snapshot.timerDraft.endSoundName, TimerSoundOption.gong.rawValue)
        XCTAssertEqual(viewModel.practiceRuntimeMessage, "Custom play \"Morning Focus\" applied to timer setup.")
    }

    func testLocalOnlyBundledFavoriteCustomPlayRemainsStartable() throws {
        let (viewModel, _, _, _) = try makeViewModel(environment: .localOnly)
        let customPlay = try XCTUnwrap(viewModel.favoriteCustomPlaysForHome.first)

        XCTAssertTrue(viewModel.canResolvePlayback(for: customPlay.media))
        XCTAssertTrue(viewModel.canStartCustomPlay(customPlay))
        XCTAssertNil(viewModel.customPlayStartSupportMessage(for: customPlay))
    }

    func testCustomPlayWithoutResolvableMediaShowsCalmStartGuidance() throws {
        var snapshot = SampleData.snapshot
        let unavailableCustomPlay = CustomPlay(
            name: "Unavailable Recording",
            meditationType: .vipassana,
            durationSeconds: 600,
            recordingLabel: "Missing file",
            linkedMediaIdentifier: "remote-only",
            media: .remote(
                id: "remote-only",
                label: "Unavailable Recording",
                relativePath: "custom-plays/unavailable.mp3",
                filePath: ""
            ),
            isFavorite: true
        )
        snapshot.customPlays = [unavailableCustomPlay]

        let (viewModel, _, _, _) = try makeViewModel(snapshot: snapshot, environment: .localOnly)
        let customPlay = try XCTUnwrap(viewModel.favoriteCustomPlaysForHome.first)

        XCTAssertFalse(viewModel.canResolvePlayback(for: customPlay.media))
        XCTAssertFalse(viewModel.canStartCustomPlay(customPlay))
        XCTAssertEqual(
            viewModel.customPlayStartSupportMessage(for: customPlay),
            "Needs available recording media before it can start."
        )
    }

    func testPlaybackAudioSessionPolicyMixesWithOtherAudio() {
        XCTAssertEqual(PlaybackAudioSessionSupport.category, .playback)
        XCTAssertEqual(PlaybackAudioSessionSupport.mode, .default)
        XCTAssertTrue(PlaybackAudioSessionSupport.options.contains(.mixWithOthers))
    }

    func testTimerEndRequiresConfirmationBeforeFinishing() throws {
        let (viewModel, notificationScheduler, _, _) = try makeViewModel()
        let existingLogCount = viewModel.recentSessionLogs.count

        viewModel.startTimer()

        XCTAssertNotNil(viewModel.activeSession)

        viewModel.requestEndTimerConfirmation()
        XCTAssertEqual(viewModel.runtimeSafetyPrompt, .endTimer(mode: .fixedDuration))

        viewModel.confirmRuntimeSafetyPrompt()

        XCTAssertNil(viewModel.runtimeSafetyPrompt)
        XCTAssertNil(viewModel.activeSession)
        XCTAssertEqual(viewModel.recentSessionLogs.count, existingLogCount + 1)
        XCTAssertTrue(
            viewModel.recentSessionLogs.contains {
                $0.source == .timer &&
                $0.status == .endedEarly &&
                $0.plannedDurationSeconds == 1_500
            }
        )

        let notificationCancelled = expectation(description: "timer notification cancelled")
        Task {
            while notificationScheduler.cancelCount < 1 {
                await Task.yield()
            }
            notificationCancelled.fulfill()
        }
        wait(for: [notificationCancelled], timeout: 1)
    }

    func testBackgroundSceneArmsBridgeOnlyWhenFixedTimerIsNearCompletion() throws {
        let nearEndSession = try TimerFeature.makeActiveSession(
            from: TimerSettingsDraft(
                mode: .fixedDuration,
                durationMinutes: 1,
                meditationType: .vipassana,
                endSoundName: TimerSoundOption.templeBell.rawValue
            ),
            now: Date().addingTimeInterval(-40)
        )
        var nearEndSnapshot = SampleData.snapshot
        nearEndSnapshot.activeRuntime = ActivePracticeSnapshot(timerSession: nearEndSession)

        let (nearEndViewModel, _, _, nearEndBridge) = try makeViewModel(snapshot: nearEndSnapshot)
        nearEndViewModel.handleScenePhaseChange(to: .background)

        XCTAssertEqual(nearEndBridge.armedTargetDates.count, 1)

        let longRunningSession = try TimerFeature.makeActiveSession(
            from: TimerSettingsDraft(
                mode: .fixedDuration,
                durationMinutes: 5,
                meditationType: .vipassana,
                endSoundName: TimerSoundOption.templeBell.rawValue
            ),
            now: Date()
        )
        var longRunningSnapshot = SampleData.snapshot
        longRunningSnapshot.activeRuntime = ActivePracticeSnapshot(timerSession: longRunningSession)

        let (longRunningViewModel, _, _, longRunningBridge) = try makeViewModel(snapshot: longRunningSnapshot)
        longRunningViewModel.handleScenePhaseChange(to: .background)

        XCTAssertTrue(longRunningBridge.armedTargetDates.isEmpty)
    }

    func testBackgroundTimerCompletionBridgeFinishesFixedTimer() async throws {
        let activeSession = try TimerFeature.makeActiveSession(
            from: TimerSettingsDraft(
                mode: .fixedDuration,
                durationMinutes: 1,
                meditationType: .vipassana,
                endSoundName: TimerSoundOption.templeBell.rawValue
            ),
            now: Date().addingTimeInterval(-45)
        )
        var snapshot = SampleData.snapshot
        snapshot.activeRuntime = ActivePracticeSnapshot(timerSession: activeSession)

        let (viewModel, notificationScheduler, _, bridge) = try makeViewModel(snapshot: snapshot)
        let existingLogCount = viewModel.recentSessionLogs.count

        viewModel.handleScenePhaseChange(to: .background)
        await bridge.fire()

        XCTAssertNil(viewModel.activeSession)
        XCTAssertEqual(viewModel.recentSessionLogs.count, existingLogCount + 1)
        XCTAssertEqual(viewModel.recentSessionLogs.first?.source, .timer)
        XCTAssertEqual(viewModel.recentSessionLogs.first?.status, .completed)
        XCTAssertGreaterThanOrEqual(notificationScheduler.cancelCount, 1)
    }

    func testHistoryMeditationTypeEditUpdatesOnlyManualLogs() throws {
        let (viewModel, _, _, _) = try makeViewModel()
        let manualLog = try XCTUnwrap(viewModel.recentSessionLogs.first(where: { $0.source == .manual }))
        let originalTimerLog = try XCTUnwrap(viewModel.recentSessionLogs.first(where: { $0.source == .timer }))

        XCTAssertTrue(viewModel.updateHistoryMeditationType(for: manualLog, to: .kriya))

        let updatedManualLog = try XCTUnwrap(viewModel.recentSessionLogs.first(where: { $0.id == manualLog.id }))
        XCTAssertEqual(updatedManualLog.meditationType, .kriya)
        XCTAssertEqual(updatedManualLog.startedAt, manualLog.startedAt)
        XCTAssertEqual(updatedManualLog.endedAt, manualLog.endedAt)
        XCTAssertEqual(updatedManualLog.completedDurationSeconds, manualLog.completedDurationSeconds)
        XCTAssertEqual(viewModel.historyFeedbackMessage, "Meditation type updated for the manual log.")

        XCTAssertFalse(viewModel.updateHistoryMeditationType(for: originalTimerLog, to: .sahaj))

        let unchangedTimerLog = try XCTUnwrap(viewModel.recentSessionLogs.first(where: { $0.id == originalTimerLog.id }))
        XCTAssertEqual(unchangedTimerLog.meditationType, originalTimerLog.meditationType)
        XCTAssertEqual(viewModel.historyFeedbackMessage, "Meditation type can be changed only for manual logs.")
    }

    func testSharedPromptSupportsArchiveDeleteAndArchivedOnlyGuard() throws {
        let (viewModel, _, _, _) = try makeViewModel()

        let activeSankalpa = try XCTUnwrap(viewModel.sankalpaProgressGroups.active.first?.goal)
        viewModel.requestArchiveSankalpaConfirmation(activeSankalpa)
        XCTAssertEqual(
            viewModel.runtimeSafetyPrompt,
            .archiveSankalpa(title: activeSankalpa.title, sankalpaID: activeSankalpa.id)
        )

        viewModel.confirmRuntimeSafetyPrompt()

        let archivedAfterArchive = try XCTUnwrap(viewModel.snapshot.sankalpas.first(where: { $0.id == activeSankalpa.id }))
        XCTAssertTrue(archivedAfterArchive.archived)

        viewModel.requestDeleteArchivedSankalpaConfirmation(archivedAfterArchive)
        XCTAssertEqual(
            viewModel.runtimeSafetyPrompt,
            .deleteArchivedSankalpa(title: archivedAfterArchive.title, sankalpaID: archivedAfterArchive.id)
        )

        viewModel.confirmRuntimeSafetyPrompt()

        XCTAssertFalse(viewModel.snapshot.sankalpas.contains(where: { $0.id == archivedAfterArchive.id }))

        let nonArchivedGoal = try XCTUnwrap(viewModel.sankalpaProgressEntries.first(where: { $0.status != .archived })?.goal)
        viewModel.requestDeleteArchivedSankalpaConfirmation(nonArchivedGoal)

        XCTAssertNil(viewModel.runtimeSafetyPrompt)
        XCTAssertEqual(viewModel.sankalpaFeedbackMessage, "Delete is available only for archived sankalpas.")
    }

    func testLibraryDeletesRequireConfirmationBeforeRemoval() throws {
        let (viewModel, _, _, _) = try makeViewModel()

        let customPlay = try XCTUnwrap(viewModel.customPlays.first)
        viewModel.requestDeleteCustomPlayConfirmation(customPlay)
        XCTAssertEqual(
            viewModel.runtimeSafetyPrompt,
            .deleteCustomPlay(name: customPlay.name, customPlayID: customPlay.id)
        )
        viewModel.confirmRuntimeSafetyPrompt()
        XCTAssertFalse(viewModel.snapshot.customPlays.contains(where: { $0.id == customPlay.id }))

        let playlist = try XCTUnwrap(viewModel.playlists.first)
        viewModel.requestDeletePlaylistConfirmation(playlist)
        XCTAssertEqual(
            viewModel.runtimeSafetyPrompt,
            .deletePlaylist(name: playlist.name, playlistID: playlist.id)
        )
        viewModel.confirmRuntimeSafetyPrompt()
        XCTAssertFalse(viewModel.snapshot.playlists.contains(where: { $0.id == playlist.id }))
    }

    func testSaveTimerDefaultsPersistsOnlyWhenCalledExplicitly() throws {
        let (viewModel, _, _, _) = try makeViewModel()
        let updatedDraft = TimerSettingsDraft(
            mode: .fixedDuration,
            durationMinutes: 18,
            meditationType: .ajapa,
            startSoundName: TimerSoundOption.templeBell.rawValue,
            endSoundName: TimerSoundOption.gong.rawValue
        )

        viewModel.saveTimerDefaults(updatedDraft)

        XCTAssertEqual(viewModel.snapshot.timerDraft.durationMinutes, 18)
        XCTAssertEqual(viewModel.snapshot.timerDraft.meditationType, .ajapa)
        XCTAssertEqual(viewModel.timerDefaultsFeedbackMessage, "Timer defaults saved.")
    }

    func testSaveTimerDefaultsRejectsInvalidTimerDraft() throws {
        let (viewModel, _, _, _) = try makeViewModel()
        let invalidDraft = TimerSettingsDraft(
            mode: .fixedDuration,
            durationMinutes: 0,
            meditationType: .vipassana
        )

        viewModel.saveTimerDefaults(invalidDraft)

        XCTAssertEqual(viewModel.snapshot.timerDraft.durationMinutes, 25)
        XCTAssertEqual(
            viewModel.timerDefaultsValidationMessage,
            TimerValidationError.durationMustBeGreaterThanZero.message
        )
    }

    func testSaveBackendConfigurationUpdatesEnvironmentAndStartsConfiguredSync() throws {
        let syncClientFactory = RecordingSyncClientFactory()
        let (viewModel, _, _, _) = try makeViewModel(syncClientFactory: syncClientFactory.makeClient)

        let saved = viewModel.saveBackendConfiguration(
            profileName: "Phone Sync",
            apiBaseURLString: "http://192.168.1.12:8080"
        )

        XCTAssertTrue(saved)
        XCTAssertEqual(viewModel.environment.profileName, "Phone Sync")
        XCTAssertEqual(viewModel.environment.apiBaseURL?.absoluteString, "http://192.168.1.12:8080")
        XCTAssertTrue(viewModel.environment.requiresBackend)
        XCTAssertEqual(viewModel.backendConfigurationFeedbackMessage, "Backend configuration saved.")
        let syncStarted = expectation(description: "sync client created")
        Task {
            while syncClientFactory.createdBaseURLs.isEmpty {
                await Task.yield()
            }
            syncStarted.fulfill()
        }
        wait(for: [syncStarted], timeout: 1)
        XCTAssertEqual(syncClientFactory.createdBaseURLs.map(\.absoluteString), ["http://192.168.1.12:8080"])
        XCTAssertNotEqual(viewModel.syncState.connectionState, .localOnly)
    }

    func testSaveBackendConfigurationRejectsInvalidURL() throws {
        let (viewModel, _, _, _) = try makeViewModel()

        let saved = viewModel.saveBackendConfiguration(
            profileName: "Phone Sync",
            apiBaseURLString: "192.168.1.12:8080"
        )

        XCTAssertFalse(saved)
        XCTAssertEqual(viewModel.environment, .localOnly)
        XCTAssertEqual(
            viewModel.backendConfigurationValidationMessage,
            AppEnvironmentConfigurationError.invalidAPIBaseURL.message
        )
    }

    func testClearBackendConfigurationReturnsToLocalOnlyMode() throws {
        let syncClientFactory = RecordingSyncClientFactory()
        let (viewModel, _, _, _) = try makeViewModel(syncClientFactory: syncClientFactory.makeClient)
        _ = viewModel.saveBackendConfiguration(
            profileName: "Phone Sync",
            apiBaseURLString: "http://192.168.1.12:8080"
        )

        viewModel.clearBackendConfiguration()

        XCTAssertEqual(viewModel.environment, .localOnly)
        XCTAssertEqual(viewModel.syncState.connectionState, .localOnly)
        XCTAssertEqual(
            viewModel.backendConfigurationFeedbackMessage,
            "Backend configuration cleared. This iPhone is local-only again."
        )
    }

    func testInvalidBackendResponseUsesDedicatedSyncState() throws {
        let invalidSourceClient = StubAppSyncClient(
            fetchError: .invalidResponse("Unsupported session log source: auto log")
        )
        let (viewModel, _, _, _) = try makeViewModel(
            environment: AppEnvironment(
                profileName: "Phone Sync",
                apiBaseURL: URL(string: "http://prashants-mac-mini.local"),
                requiresBackend: true
            ),
            syncClientFactory: { _ in invalidSourceClient }
        )

        let syncCompleted = expectation(description: "sync settles with invalid backend response")
        Task {
            while viewModel.syncState.connectionState == .syncing || viewModel.syncState.connectionState == .pendingSync {
                await Task.yield()
            }
            syncCompleted.fulfill()
        }
        wait(for: [syncCompleted], timeout: 1)

        XCTAssertEqual(viewModel.syncState.connectionState, .invalidBackendResponse)
        XCTAssertEqual(viewModel.syncState.lastErrorMessage, "Unsupported session log source: auto log")
    }

    func testRestoresRunningCustomPlayFromPersistedActiveRuntime() throws {
        let startDate = Date().addingTimeInterval(-300)
        var snapshot = SampleData.snapshot
        let customPlay = try XCTUnwrap(snapshot.customPlays.first(where: { $0.media?.isPlayable == true }))
        snapshot.activeRuntime = ActivePracticeSnapshot(
            customPlaySession: ActiveCustomPlaySession(
                customPlay: customPlay,
                startedAt: startDate
            )
        )

        let (viewModel, _, audioPlayer, _) = try makeViewModel(snapshot: snapshot)

        XCTAssertEqual(viewModel.activeCustomPlaySession?.customPlay.id, customPlay.id)
        XCTAssertEqual(audioPlayer.startedMediaAssets.first?.id, customPlay.media?.id)
        let resumedOffset = try XCTUnwrap(audioPlayer.startedOffsets.first)
        XCTAssertTrue((299 ... 301).contains(Int(resumedOffset.rounded(.down))))
    }

    func testRestoresPausedTimerFromPersistedActiveRuntime() throws {
        let startDate = Date().addingTimeInterval(-600)
        var snapshot = SampleData.snapshot
        var activeSession = try TimerFeature.makeActiveSession(
            from: snapshot.timerDraft,
            now: startDate
        )
        activeSession.pause(at: startDate.addingTimeInterval(240))
        snapshot.activeRuntime = ActivePracticeSnapshot(timerSession: activeSession)

        let (viewModel, _, _, _) = try makeViewModel(snapshot: snapshot)

        XCTAssertTrue(viewModel.activeSession?.isPaused == true)
        XCTAssertEqual(viewModel.snapshot.activeRuntime?.timerSession?.id, activeSession.id)
    }

    private func makeViewModel(
        snapshot: AppSnapshot = SampleData.snapshot,
        environment: AppEnvironment = .localOnly,
        syncClientFactory: @escaping @Sendable (URL) -> AppSyncClient = { _ in StubAppSyncClient() }
    ) throws -> (ShellViewModel, StubNotificationScheduler, RecordingAudioPlayer, StubTimerCompletionBridge) {
        let tempDirectory = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString, isDirectory: true)
        let storeURL = tempDirectory.appendingPathComponent("snapshot.json")
        let store = JSONFileStore<AppSnapshot>(fileURL: storeURL)
        try store.save(snapshot)
        let syncStore = JSONFileStore<AppSyncState>(fileURL: tempDirectory.appendingPathComponent("sync-state.json"))

        let notificationScheduler = StubNotificationScheduler()
        let soundPlayer = RecordingTimerSoundPlayer()
        let audioPlayer = RecordingAudioPlayer()
        let timerCompletionBridge = StubTimerCompletionBridge()

        let repository = LocalAppSnapshotRepository(
            store: store,
            environment: environment
        )
        let syncRepository = LocalAppSyncStateRepository(
            store: syncStore,
            environment: environment
        )

        let viewModel = ShellViewModel(
            repository: repository,
            syncRepository: syncRepository,
            notificationScheduler: notificationScheduler,
            timerCompletionBridge: timerCompletionBridge,
            soundPlayer: soundPlayer,
            audioPlayer: audioPlayer,
            syncClientFactory: syncClientFactory
        )

        return (viewModel, notificationScheduler, audioPlayer, timerCompletionBridge)
    }
}

private final class RecordingSyncClientFactory: @unchecked Sendable {
    private(set) var createdBaseURLs: [URL] = []

    func makeClient(baseURL: URL) -> AppSyncClient {
        StubAppSyncClient(
            onFetch: { [weak self] in
                self?.record(baseURL: baseURL)
            }
        )
    }

    private func record(baseURL: URL) {
        createdBaseURLs.append(baseURL)
    }
}

private struct StubAppSyncClient: AppSyncClient {
    var onFetch: @Sendable () -> Void = {}
    var fetchError: AppSyncError?
    var applyError: AppSyncError?

    func fetchRemoteState(localSnapshot: AppSnapshot, timeZoneIdentifier: String) async throws -> RemoteAppState {
        onFetch()
        if let fetchError {
            throw fetchError
        }
        return RemoteAppState(
            snapshot: localSnapshot,
            summary: localSnapshot.summary,
            mediaAssets: []
        )
    }

    func applyMutation(
        _ mutation: SyncMutation,
        localSnapshot: AppSnapshot,
        timeZoneIdentifier: String
    ) async throws -> RemoteAppState {
        onFetch()
        if let applyError {
            throw applyError
        }
        return RemoteAppState(
            snapshot: AppSyncFeature.applyQueuedMutation(mutation, to: localSnapshot),
            summary: localSnapshot.summary,
            mediaAssets: []
        )
    }
}

private final class StubNotificationScheduler: NotificationScheduling, @unchecked Sendable {
    private(set) var cancelCount = 0
    private(set) var scheduledDates: [Date] = []
    private(set) var scheduledMeditationTypes: [MeditationType] = []

    func authorizationState() async -> NotificationPermissionState {
        .authorized
    }

    func requestAuthorization() async -> NotificationPermissionState {
        .authorized
    }

    func scheduleTimerCompletionNotification(
        at date: Date,
        meditationType: MeditationType
    ) async {
        scheduledDates.append(date)
        scheduledMeditationTypes.append(meditationType)
    }

    func cancelTimerCompletionNotification() async {
        cancelCount += 1
    }
}

@MainActor
private final class RecordingTimerSoundPlayer: TimerSoundPlaying {
    private(set) var playedSoundNames: [String?] = []

    func playSound(named soundName: String?) {
        playedSoundNames.append(soundName)
    }
}

@MainActor
private final class RecordingAudioPlayer: CustomPlayAudioControlling {
    private(set) var startedMediaAssets: [CustomPlayMedia] = []
    private(set) var startedOffsets: [TimeInterval] = []
    private(set) var pauseCount = 0
    private(set) var resumeCount = 0
    private(set) var stopCount = 0

    func startPlayback(for media: CustomPlayMedia, environment: AppEnvironment, at offsetSeconds: TimeInterval) throws {
        startedMediaAssets.append(media)
        startedOffsets.append(offsetSeconds)
    }

    func pausePlayback() {
        pauseCount += 1
    }

    func resumePlayback() throws {
        resumeCount += 1
    }

    func stopPlayback() {
        stopCount += 1
    }
}

@MainActor
private final class StubTimerCompletionBridge: TimerCompletionBridging {
    private(set) var armedTargetDates: [Date] = []
    private(set) var cancelCount = 0
    private var onBridgeFire: (@MainActor @Sendable (Date) -> Void)?

    func armTimerCompletionBridge(
        targetEndAt: Date,
        onBridgeFire: @escaping @MainActor @Sendable (Date) -> Void
    ) {
        armedTargetDates.append(targetEndAt)
        self.onBridgeFire = onBridgeFire
    }

    func cancelTimerCompletionBridge() {
        cancelCount += 1
        onBridgeFire = nil
    }

    func fire() async {
        guard let targetEndAt = armedTargetDates.last,
              let onBridgeFire
        else {
            return
        }

        await MainActor.run {
            onBridgeFire(targetEndAt)
        }
    }
}
