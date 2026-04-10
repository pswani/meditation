import Foundation
import XCTest
@testable import MeditationNative

@MainActor
final class ShellViewModelTests: XCTestCase {
    func testHomeShortcutStateStaysCompactAndSorted() throws {
        let (viewModel, _, _) = try makeViewModel()

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

        let (viewModel, _, _) = try makeViewModel(snapshot: snapshot)

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

        let (viewModel, _, _) = try makeViewModel(snapshot: snapshot)

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

        let (viewModel, _, _) = try makeViewModel(snapshot: snapshot)

        viewModel.startLastUsedPractice()

        XCTAssertEqual(viewModel.activePlaylistSession?.playlist.id, playlist.id)
        XCTAssertEqual(viewModel.activePlaylistSession?.playlist.name, playlist.name)
    }

    func testApplyCustomPlayToTimerCopiesTheParityMetadata() throws {
        let (viewModel, _, _) = try makeViewModel()
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

    func testTimerEndRequiresConfirmationBeforeFinishing() throws {
        let (viewModel, notificationScheduler, _) = try makeViewModel()
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

    func testSharedPromptSupportsArchiveDeleteAndArchivedOnlyGuard() throws {
        let (viewModel, _, _) = try makeViewModel()

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
        let (viewModel, _, _) = try makeViewModel()

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
        let (viewModel, _, _) = try makeViewModel()
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
        let (viewModel, _, _) = try makeViewModel()
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

        let (viewModel, _, audioPlayer) = try makeViewModel(snapshot: snapshot)

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

        let (viewModel, _, _) = try makeViewModel(snapshot: snapshot)

        XCTAssertTrue(viewModel.activeSession?.isPaused == true)
        XCTAssertEqual(viewModel.snapshot.activeRuntime?.timerSession?.id, activeSession.id)
    }

    private func makeViewModel(
        snapshot: AppSnapshot = SampleData.snapshot
    ) throws -> (ShellViewModel, StubNotificationScheduler, RecordingAudioPlayer) {
        let tempDirectory = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString, isDirectory: true)
        let storeURL = tempDirectory.appendingPathComponent("snapshot.json")
        let store = JSONFileStore<AppSnapshot>(fileURL: storeURL)
        try store.save(snapshot)

        let notificationScheduler = StubNotificationScheduler()
        let soundPlayer = RecordingTimerSoundPlayer()
        let audioPlayer = RecordingAudioPlayer()

        let repository = LocalAppSnapshotRepository(
            store: store,
            environment: .localOnly
        )

        let viewModel = ShellViewModel(
            repository: repository,
            notificationScheduler: notificationScheduler,
            soundPlayer: soundPlayer,
            audioPlayer: audioPlayer
        )

        return (viewModel, notificationScheduler, audioPlayer)
    }
}

private final class StubNotificationScheduler: NotificationScheduling, @unchecked Sendable {
    private(set) var cancelCount = 0

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
