import Foundation
import XCTest
@testable import MeditationNative

final class ShellViewModelPresentationTests: XCTestCase {
    func testSyncPresentationReflectsQueuedAndUpToDateStates() {
        var pendingState = AppSyncState(connectionState: .pendingSync)
        pendingState.pendingMutations = [
            .timerSettingsUpsert(
                TimerSettingsDraft(
                    mode: .fixedDuration,
                    durationMinutes: 25,
                    meditationType: .vipassana
                )
            ),
        ]

        XCTAssertEqual(
            ShellViewModelPresentation.syncStatusHeadline(for: pendingState),
            "Pending sync"
        )
        XCTAssertEqual(
            ShellViewModelPresentation.syncStatusDetail(
                for: pendingState,
                now: Date(timeIntervalSince1970: 1_700_000_000)
            ),
            "1 local change is queued safely on this device and will replay next time the backend is reachable."
        )

        var syncedState = AppSyncState(connectionState: .upToDate)
        syncedState.lastSuccessfulSyncAt = Date(timeIntervalSince1970: 1_700_000_000)

        XCTAssertTrue(
            ShellViewModelPresentation.syncStatusDetail(
                for: syncedState,
                now: Date(timeIntervalSince1970: 1_700_000_060)
            ).hasPrefix("Last successful sync:")
        )
    }

    func testLocalOnlyPresentationReadsAsIntentionalMode() {
        var localOnlyState = AppSyncState(connectionState: .localOnly)
        localOnlyState.pendingMutations = [
            .timerSettingsUpsert(
                TimerSettingsDraft(
                    mode: .fixedDuration,
                    durationMinutes: 25,
                    meditationType: .vipassana
                )
            ),
        ]

        XCTAssertEqual(
            ShellViewModelPresentation.syncStatusHeadline(for: localOnlyState),
            "Local-only mode"
        )
        XCTAssertEqual(
            ShellViewModelPresentation.syncBannerMessage(for: localOnlyState),
            "This iPhone is in local-only mode. 1 saved change will stay on this device until a backend base URL is configured."
        )
        XCTAssertEqual(
            ShellViewModelPresentation.syncStatusDetail(
                for: localOnlyState,
                now: Date(timeIntervalSince1970: 1_700_000_000)
            ),
            "This profile is working intentionally on-device only right now. Save a backend base URL below when you want saved changes to replay to a backend."
        )
    }

    func testInvalidBackendResponsePresentationSeparatesContractFailureFromReachability() {
        var invalidState = AppSyncState(connectionState: .invalidBackendResponse)
        invalidState.pendingMutations = [
            .timerSettingsUpsert(
                TimerSettingsDraft(
                    mode: .fixedDuration,
                    durationMinutes: 25,
                    meditationType: .vipassana
                )
            ),
        ]

        XCTAssertEqual(
            ShellViewModelPresentation.syncStatusHeadline(for: invalidState),
            "Backend response invalid"
        )
        XCTAssertEqual(
            ShellViewModelPresentation.syncBannerMessage(for: invalidState),
            "Backend response invalid. 1 local change will stay queued until the backend contract is corrected."
        )
        XCTAssertEqual(
            ShellViewModelPresentation.syncStatusDetail(
                for: invalidState,
                now: Date(timeIntervalSince1970: 1_700_000_000)
            ),
            "The device reached the configured backend, but one or more API responses did not match the app's expected contract. Local-first changes stay visible here in the meantime."
        )
    }

    func testCustomPlayStartPresentationSupportsOfflinePlayableAndUnavailableStates() {
        XCTAssertTrue(
            ShellViewModelPresentation.canStartCustomPlay(
                canResolvePlayback: true,
                hasActivePracticeRuntime: false
            )
        )
        XCTAssertNil(
            ShellViewModelPresentation.customPlayStartSupportMessage(
                canResolvePlayback: true,
                hasActivePracticeRuntime: false
            )
        )

        XCTAssertTrue(
            ShellViewModelPresentation.canStartCustomPlay(
                canResolvePlayback: false,
                hasActivePracticeRuntime: false
            )
        )
        XCTAssertEqual(
            ShellViewModelPresentation.customPlayStartSupportMessage(
                canResolvePlayback: false,
                hasActivePracticeRuntime: false
            ),
            "Recording unavailable on this device. Start still runs the saved duration and bells."
        )
    }

    func testHistoryMeditationTypeEditingIsLimitedToManualLogs() {
        let manualLog = SessionLog(
            meditationType: .ajapa,
            source: .manual,
            status: .completed,
            startedAt: Date(timeIntervalSince1970: 1_700_000_000),
            endedAt: Date(timeIntervalSince1970: 1_700_000_900),
            completedDurationSeconds: 900
        )
        let timerLog = SessionLog(
            meditationType: .vipassana,
            source: .timer,
            status: .completed,
            startedAt: Date(timeIntervalSince1970: 1_700_001_000),
            endedAt: Date(timeIntervalSince1970: 1_700_002_500),
            completedDurationSeconds: 1_500,
            plannedDurationSeconds: 1_500,
            timerMode: .fixedDuration
        )

        XCTAssertTrue(ShellViewModelPresentation.canChangeHistoryMeditationType(for: manualLog))
        XCTAssertFalse(ShellViewModelPresentation.canChangeHistoryMeditationType(for: timerLog))
    }

    func testSnapshotSupportDerivesLastUsedCustomPlayFromContextAwareLog() {
        let customPlay = CustomPlay(
            id: UUID(uuidString: "11111111-2222-3333-4444-555555555555")!,
            name: "Vipassana Sit 20",
            meditationType: .vipassana,
            durationSeconds: 1_200,
            recordingLabel: "Morning recording",
            media: .bundledSample(.vipassanaSit20)
        )
        let log = SessionLog(
            meditationType: .vipassana,
            source: .customPlay,
            status: .completed,
            startedAt: Date(timeIntervalSince1970: 1_700_000_000),
            endedAt: Date(timeIntervalSince1970: 1_700_001_200),
            completedDurationSeconds: 1_200,
            notes: "Morning recording • Vipassana Sit 20",
            context: SessionLogContext(
                customPlayID: customPlay.id,
                customPlayName: customPlay.name,
                recordingLabel: customPlay.recordingLabel
            )
        )
        var snapshot = SampleData.snapshot
        snapshot.timerDraft = TimerSettingsDraft(
            mode: .fixedDuration,
            durationMinutes: 25,
            meditationType: .ajapa
        )
        snapshot.recentSessionLogs = [log]
        snapshot.customPlays = [customPlay]
        snapshot.playlists = []
        snapshot.sankalpas = []
        snapshot.summary = SummaryFeature.makeStoredSummarySnapshot(from: snapshot.recentSessionLogs)

        let target = ShellSnapshotSupport.deriveLastUsedPracticeTarget(from: snapshot)

        XCTAssertEqual(target?.kind, .customPlay)
        XCTAssertEqual(target?.customPlayID, customPlay.id)
        XCTAssertEqual(target?.title, customPlay.name)
    }

    func testSnapshotNormalizationUpgradesLegacySoundLabelsAndSampleMedia() throws {
        let legacyMedia = try JSONDecoder().decode(
            CustomPlayMedia.self,
            from: Data(#"{"asset":"Temple Bell loop"}"#.utf8)
        )
        var snapshot = SampleData.snapshot
        snapshot.timerDraft.startSoundName = TimerSoundOption.softChime.rawValue
        snapshot.timerDraft.endSoundName = TimerSoundOption.woodBlock.rawValue
        snapshot.timerDraft.intervalSoundName = TimerSoundOption.woodBlock.rawValue
        snapshot.timerDraft.intervalMinutes = 5
        snapshot.lastUsedPracticeTarget = LastUsedPracticeTarget(
            kind: .timer,
            title: "Legacy timer",
            meditationType: .vipassana,
            timerDraft: snapshot.timerDraft
        )
        snapshot.customPlays = [
            CustomPlay(
                name: "Legacy bundled sample",
                meditationType: .vipassana,
                durationSeconds: 1_200,
                linkedMediaIdentifier: "native-media-vipassana-sit-20",
                media: legacyMedia
            ),
        ]

        let normalized = ShellSnapshotSupport.normalizedSnapshot(snapshot)

        XCTAssertEqual(normalized.timerDraft.startSoundName, TimerSoundOption.templeBell.rawValue)
        XCTAssertEqual(normalized.timerDraft.endSoundName, TimerSoundOption.gong.rawValue)
        XCTAssertEqual(normalized.timerDraft.intervalSoundName, TimerSoundOption.gong.rawValue)
        XCTAssertEqual(normalized.lastUsedPracticeTarget?.timerDraft?.startSoundName, TimerSoundOption.templeBell.rawValue)
        XCTAssertEqual(normalized.customPlays.first?.media?.bundledAsset, .vipassanaSit20)
        XCTAssertEqual(normalized.customPlays.first?.linkedMediaIdentifier, CustomPlayMediaAsset.vipassanaSit20.id)
    }

    func testActivePlaylistPresentationReflectsItemAndGapPhases() {
        let playlist = Playlist(
            name: "Morning Discipline",
            items: [
                PlaylistItem(title: "Vipassana Warmup", kind: .timer, durationSeconds: 600, meditationType: .vipassana),
                PlaylistItem(title: "Ajapa Evening Sit", kind: .customPlay, durationSeconds: 300, meditationType: .ajapa),
            ],
            gapSeconds: 30
        )
        let startDate = Date(timeIntervalSince1970: 1_700_000_000)
        var session = ActivePlaylistSession(playlist: playlist, phaseStartedAt: startDate)

        XCTAssertEqual(
            ShellViewModelPresentation.activePlaylistTitle(for: session),
            "Item 1 of 2: Vipassana Warmup"
        )
        XCTAssertEqual(
            ShellViewModelPresentation.activePlaylistSecondaryText(for: session),
            "Next: Ajapa Evening Sit"
        )

        _ = session.advanceIfNeeded(at: startDate.addingTimeInterval(600))

        XCTAssertEqual(ShellViewModelPresentation.activePlaylistTitle(for: session), "Small gap")
        XCTAssertEqual(
            ShellViewModelPresentation.activePlaylistSecondaryText(for: session),
            "Up next: Ajapa Evening Sit"
        )
    }
}
