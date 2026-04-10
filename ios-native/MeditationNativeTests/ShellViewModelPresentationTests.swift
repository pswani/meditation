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

    func testSnapshotSupportDerivesLastUsedCustomPlayFromContextAwareLog() {
        let customPlay = CustomPlay(
            id: UUID(uuidString: "11111111-2222-3333-4444-555555555555")!,
            name: "Vipassana Sit 20",
            meditationType: .vipassana,
            durationSeconds: 1_200,
            recordingLabel: "Morning recording",
            media: CustomPlayMedia(asset: .templeBellLoop)
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
