import Foundation
import Testing
@testable import MeditationNative

@Test func meditationTypesMatchProductVocabulary() throws {
    #expect(ReferenceData.meditationTypes.map(\.rawValue) == [
        "Vipassana",
        "Ajapa",
        "Tratak",
        "Kriya",
        "Sahaj",
    ])
}

@Test func playlistTotalDurationIncludesGaps() throws {
    let playlist = Playlist(
        name: "Morning",
        items: [
            PlaylistItem(title: "Sit", kind: .timer, durationSeconds: 600, meditationType: .vipassana),
            PlaylistItem(title: "Rest", kind: .customPlay, durationSeconds: 300, meditationType: .ajapa),
            PlaylistItem(title: "Close", kind: .timer, durationSeconds: 120, meditationType: .sahaj),
        ],
        gapSeconds: 30
    )

    #expect(playlist.totalDurationSeconds == 1_080)
}

@Test func localEnvironmentDoesNotRequireBackend() throws {
    let environment = AppEnvironment.localOnly

    #expect(environment.apiBaseURL == nil)
    #expect(environment.requiresBackend == false)
}

@Test func timerValidationRequiresMeditationTypePositiveDurationAndFittingIntervals() throws {
    let draft = TimerSettingsDraft(
        mode: .fixedDuration,
        durationMinutes: 0,
        meditationType: nil,
        startSoundName: TimerSoundOption.templeBell.rawValue,
        endSoundName: TimerSoundOption.templeBell.rawValue,
        intervalSoundName: TimerSoundOption.gong.rawValue,
        intervalMinutes: 0
    )

    let errors = TimerFeature.validateTimerDraft(draft)

    #expect(errors.contains(.durationMustBeGreaterThanZero))
    #expect(errors.contains(.meditationTypeRequired))
    #expect(errors.contains(.intervalMustBeGreaterThanZero))
}

@Test func customPlayDraftRequiresNameTypeDurationAndMedia() throws {
    let draft = CustomPlayDraft(
        name: "",
        meditationType: nil,
        durationMinutes: 0,
        mediaAsset: nil
    )

    let errors = CustomPlayFeature.validateCustomPlayDraft(draft)

    #expect(errors.contains(.nameRequired))
    #expect(errors.contains(.meditationTypeRequired))
    #expect(errors.contains(.durationMustBeGreaterThanZero))
    #expect(errors.contains(.mediaRequired))
}

@Test func customPlayDraftRoundTripsParityMetadata() throws {
    let draft = CustomPlayDraft(
        name: "Morning Focus",
        meditationType: .vipassana,
        durationMinutes: 15,
        startSoundName: TimerSoundOption.templeBell.rawValue,
        endSoundName: TimerSoundOption.gong.rawValue,
        recordingLabel: "Breath emphasis",
        linkedMediaIdentifier: "media-session-123",
        mediaAsset: .gongLoop,
        isFavorite: true
    )

    let customPlay = try CustomPlayFeature.makeCustomPlay(from: draft)
    let roundTrippedDraft = CustomPlayFeature.makeDraft(from: customPlay)

    #expect(customPlay.startSoundName == TimerSoundOption.templeBell.rawValue)
    #expect(customPlay.endSoundName == TimerSoundOption.gong.rawValue)
    #expect(customPlay.recordingLabel == "Breath emphasis")
    #expect(customPlay.linkedMediaIdentifier == "media-session-123")
    #expect(roundTrippedDraft.startSoundName == draft.startSoundName)
    #expect(roundTrippedDraft.endSoundName == draft.endSoundName)
    #expect(roundTrippedDraft.recordingLabel == draft.recordingLabel)
    #expect(roundTrippedDraft.linkedMediaIdentifier == draft.linkedMediaIdentifier)
    #expect(roundTrippedDraft.mediaAsset == draft.mediaAsset)
    #expect(roundTrippedDraft.isFavorite == draft.isFavorite)
}

@Test func activeTimerPauseAndResumePreserveRemainingTime() throws {
    let startDate = Date(timeIntervalSince1970: 1_700_000_000)
    let draft = TimerSettingsDraft(
        mode: .fixedDuration,
        durationMinutes: 20,
        meditationType: .vipassana,
        intervalSoundName: TimerSoundOption.gong.rawValue,
        intervalMinutes: 5
    )

    var session = try TimerFeature.makeActiveSession(from: draft, now: startDate)

    #expect(session.remainingSeconds(at: startDate.addingTimeInterval(300)) == 900)

    session.pause(at: startDate.addingTimeInterval(300))
    #expect(session.elapsedSeconds(at: startDate.addingTimeInterval(420)) == 300)
    #expect(session.remainingSeconds(at: startDate.addingTimeInterval(420)) == 900)

    session.resume(at: startDate.addingTimeInterval(420))
    #expect(session.remainingSeconds(at: startDate.addingTimeInterval(720)) == 600)
}

@Test func activeCustomPlayPauseAndResumePreserveRemainingTime() throws {
    let startDate = Date(timeIntervalSince1970: 1_700_000_000)
    let customPlay = CustomPlay(
        name: "Ajapa Evening Sit",
        meditationType: .ajapa,
        durationSeconds: 900,
        media: CustomPlayMedia(asset: .gongLoop)
    )

    var session = ActiveCustomPlaySession(customPlay: customPlay, startedAt: startDate)

    #expect(session.remainingSeconds(at: startDate.addingTimeInterval(300)) == 600)

    session.pause(at: startDate.addingTimeInterval(300))
    #expect(session.elapsedSeconds(at: startDate.addingTimeInterval(360)) == 300)

    session.resume(at: startDate.addingTimeInterval(420))
    #expect(session.remainingSeconds(at: startDate.addingTimeInterval(720)) == 300)
}

@Test func applyCustomPlayToTimerDraftCopiesMetadataAndKeepsIntervalSettings() throws {
    let baseDraft = TimerSettingsDraft(
        mode: .openEnded,
        durationMinutes: 45,
        meditationType: .kriya,
        startSoundName: nil,
        endSoundName: nil,
        intervalSoundName: TimerSoundOption.woodBlock.rawValue,
        intervalMinutes: 10
    )
    let customPlay = CustomPlay(
        name: "Vipassana Sit 20",
        meditationType: .vipassana,
        durationSeconds: 1_200,
        startSoundName: TimerSoundOption.templeBell.rawValue,
        endSoundName: TimerSoundOption.gong.rawValue,
        recordingLabel: "Morning recording",
        linkedMediaIdentifier: "media-session-456",
        media: CustomPlayMedia(asset: .templeBellLoop)
    )

    let updatedDraft = CustomPlayFeature.applyToTimerDraft(baseDraft, from: customPlay)

    #expect(updatedDraft.mode == .fixedDuration)
    #expect(updatedDraft.durationMinutes == 20)
    #expect(updatedDraft.meditationType == .vipassana)
    #expect(updatedDraft.startSoundName == TimerSoundOption.templeBell.rawValue)
    #expect(updatedDraft.endSoundName == TimerSoundOption.gong.rawValue)
    #expect(updatedDraft.intervalSoundName == TimerSoundOption.woodBlock.rawValue)
    #expect(updatedDraft.intervalMinutes == 10)
}

@Test func fixedTimerIntervalsTriggerOnlyWhenCrossed() throws {
    let startDate = Date(timeIntervalSince1970: 1_700_000_000)
    let draft = TimerSettingsDraft(
        mode: .fixedDuration,
        durationMinutes: 20,
        meditationType: .vipassana,
        intervalSoundName: TimerSoundOption.gong.rawValue,
        intervalMinutes: 5
    )

    var session = try TimerFeature.makeActiveSession(from: draft, now: startDate)

    #expect(session.nextDueIntervalCount(at: startDate.addingTimeInterval(299)) == nil)
    #expect(session.nextDueIntervalCount(at: startDate.addingTimeInterval(300)) == 1)
    #expect(session.nextDueIntervalCount(at: startDate.addingTimeInterval(301)) == nil)
    #expect(session.nextDueIntervalCount(at: startDate.addingTimeInterval(600)) == 2)
}

@Test func timerSessionLogKeepsPlannedDurationForEndedEarlyFixedSession() throws {
    let startDate = Date(timeIntervalSince1970: 1_700_000_000)
    let draft = TimerSettingsDraft(
        mode: .fixedDuration,
        durationMinutes: 20,
        meditationType: .vipassana
    )

    let session = try TimerFeature.makeActiveSession(from: draft, now: startDate)
    let log = session.makeSessionLog(
        status: .endedEarly,
        endedAt: startDate.addingTimeInterval(420)
    )

    #expect(log.source == .timer)
    #expect(log.status == .endedEarly)
    #expect(log.completedDurationSeconds == 420)
    #expect(log.plannedDurationSeconds == 1_200)
    #expect(log.timerMode == .fixedDuration)
}

@Test func customPlaySessionLogUsesCustomPlaySourceAndNotes() throws {
    let startDate = Date(timeIntervalSince1970: 1_700_000_000)
    let customPlay = CustomPlay(
        name: "Vipassana Sit 20",
        meditationType: .vipassana,
        durationSeconds: 1_200,
        media: CustomPlayMedia(asset: .templeBellLoop)
    )

    let session = ActiveCustomPlaySession(customPlay: customPlay, startedAt: startDate)
    let log = session.makeSessionLog(
        status: .completed,
        endedAt: startDate.addingTimeInterval(1_200)
    )

    #expect(log.source == .customPlay)
    #expect(log.status == .completed)
    #expect(log.plannedDurationSeconds == 1_200)
    #expect(log.notes == "Vipassana Sit 20")
}

@Test func customPlaySessionLogIncludesRecordingLabelWhenAvailable() throws {
    let startDate = Date(timeIntervalSince1970: 1_700_000_000)
    let customPlay = CustomPlay(
        name: "Vipassana Sit 20",
        meditationType: .vipassana,
        durationSeconds: 1_200,
        recordingLabel: "Morning recording",
        media: CustomPlayMedia(asset: .templeBellLoop)
    )

    let session = ActiveCustomPlaySession(customPlay: customPlay, startedAt: startDate)
    let log = session.makeSessionLog(
        status: .completed,
        endedAt: startDate.addingTimeInterval(1_200)
    )

    #expect(log.notes == "Morning recording • Vipassana Sit 20")
}

@Test func openEndedTimerSessionLogUsesActualElapsedDuration() throws {
    let startDate = Date(timeIntervalSince1970: 1_700_000_000)
    let draft = TimerSettingsDraft(
        mode: .openEnded,
        durationMinutes: 25,
        meditationType: .tratak
    )

    let session = try TimerFeature.makeActiveSession(from: draft, now: startDate)
    let log = session.makeSessionLog(
        status: .completed,
        endedAt: startDate.addingTimeInterval(780)
    )

    #expect(log.completedDurationSeconds == 780)
    #expect(log.plannedDurationSeconds == nil)
    #expect(log.timerMode == .openEnded)
}

@Test func manualLogCreationBuildsAccurateSessionRange() throws {
    let endedAt = Date(timeIntervalSince1970: 1_700_001_200)
    let draft = ManualLogDraft(
        meditationType: .ajapa,
        durationMinutes: 15,
        endedAt: endedAt,
        notes: "Quiet evening sit"
    )

    let log = try TimerFeature.makeManualLog(from: draft)

    #expect(log.source == .manual)
    #expect(log.status == .completed)
    #expect(log.completedDurationSeconds == 900)
    #expect(log.startedAt == endedAt.addingTimeInterval(-900))
    #expect(log.endedAt == endedAt)
    #expect(log.notes == "Quiet evening sit")
}

@Test func manualLogValidationRequiresMeditationTypeAndDuration() throws {
    let draft = ManualLogDraft(
        meditationType: nil,
        durationMinutes: 0,
        endedAt: Date(timeIntervalSince1970: 1_700_001_200)
    )

    let errors = TimerFeature.validateManualLogDraft(draft)

    #expect(errors.contains(.meditationTypeRequired))
    #expect(errors.contains(.durationMustBeGreaterThanZero))
}

@Test func playlistDraftRequiresItemsAndValidLinkedCustomPlay() throws {
    let customPlay = CustomPlay(
        id: UUID(uuidString: "11111111-2222-3333-4444-555555555555")!,
        name: "Ajapa Evening Sit",
        meditationType: .ajapa,
        durationSeconds: 900,
        media: nil
    )
    let draft = PlaylistDraft(
        name: "Evening Flow",
        items: [
            PlaylistDraftItem(kind: .customPlay, customPlayID: customPlay.id),
        ]
    )

    let errors = PlaylistFeature.validatePlaylistDraft(draft, availableCustomPlays: [customPlay])

    #expect(errors.contains(.customPlayNeedsMedia))
}

@Test func playlistRuntimePreservesOrderAndLogsEachCompletedItemOnce() throws {
    let startDate = Date(timeIntervalSince1970: 1_700_000_000)
    let customPlay = CustomPlay(
        id: UUID(uuidString: "11111111-2222-3333-4444-555555555555")!,
        name: "Ajapa Evening Sit",
        meditationType: .ajapa,
        durationSeconds: 300,
        media: CustomPlayMedia(asset: .gongLoop)
    )
    let playlist = try PlaylistFeature.makePlaylist(
        from: PlaylistDraft(
            name: "Morning Discipline",
            items: [
                PlaylistDraftItem(
                    title: "Vipassana Warmup",
                    kind: .timer,
                    durationMinutes: 10,
                    meditationType: .vipassana
                ),
                PlaylistDraftItem(
                    kind: .customPlay,
                    customPlayID: customPlay.id
                ),
            ],
            gapSeconds: 30
        ),
        availableCustomPlays: [customPlay]
    )

    var session = ActivePlaylistSession(playlist: playlist, phaseStartedAt: startDate)

    let firstAdvance = session.advanceIfNeeded(at: startDate.addingTimeInterval(600))
    #expect(firstAdvance.logs.count == 1)
    #expect(firstAdvance.logs.first?.notes == "Playlist: Morning Discipline • Item: Vipassana Warmup")
    #expect(session.phase == .gap(afterItemIndex: 0))

    let duplicateCheck = session.advanceIfNeeded(at: startDate.addingTimeInterval(601))
    #expect(duplicateCheck.logs.isEmpty)

    let secondAdvance = session.advanceIfNeeded(at: startDate.addingTimeInterval(630))
    #expect(secondAdvance.logs.isEmpty)
    #expect(session.phase == .item(index: 1))

    let finalAdvance = session.advanceIfNeeded(at: startDate.addingTimeInterval(930))
    #expect(finalAdvance.logs.count == 1)
    #expect(finalAdvance.logs.first?.notes == "Playlist: Morning Discipline • Item: Ajapa Evening Sit")
    #expect(finalAdvance.finishedRun)
}

@Test func playlistEarlyStopOnlyLogsCurrentItemAndSkipsGapLogs() throws {
    let startDate = Date(timeIntervalSince1970: 1_700_000_000)
    let playlist = Playlist(
        name: "Closing Flow",
        items: [
            PlaylistItem(title: "Sit", kind: .timer, durationSeconds: 600, meditationType: .vipassana),
            PlaylistItem(title: "Close", kind: .timer, durationSeconds: 300, meditationType: .sahaj),
        ],
        gapSeconds: 30
    )

    var session = ActivePlaylistSession(playlist: playlist, phaseStartedAt: startDate)
    let firstAdvance = session.advanceIfNeeded(at: startDate.addingTimeInterval(600))
    #expect(firstAdvance.logs.count == 1)
    #expect(session.phase == .gap(afterItemIndex: 0))
    #expect(session.makeCurrentItemEarlyStopLog(at: startDate.addingTimeInterval(610)) == nil)
}

@Test func sessionLogFiltersRespectMeditationTypeAndSource() throws {
    let filtered = TimerFeature.filteredSessionLogs(
        SampleData.snapshot.recentSessionLogs,
        using: SessionLogFilter(meditationType: .ajapa, source: .manual)
    )

    #expect(filtered.count == 1)
    #expect(filtered.first?.meditationType == .ajapa)
    #expect(filtered.first?.source == .manual)
}

@Test func summaryDerivationIncludesOverallTypeAndSourceCoverage() throws {
    let summary = SummaryFeature.deriveSnapshot(from: SampleData.snapshot.recentSessionLogs)

    #expect(summary.overall.totalSessionLogs == 4)
    #expect(summary.overall.completedSessionLogs == 3)
    #expect(summary.overall.endedEarlySessionLogs == 1)
    #expect(summary.overall.totalDurationSeconds == 4_080)
    #expect(summary.byMeditationType.count == ReferenceData.meditationTypes.count)
    #expect(summary.bySource.count == ReferenceData.sessionSources.count)
    #expect(summary.bySource.first(where: { $0.source == .manual })?.sessionLogs == 1)
}

@Test func summaryRangeFiltersKeepRecentLogsOnly() throws {
    let now = Date(timeIntervalSince1970: 1_700_000_000)
    let recentLog = SessionLog(
        meditationType: .vipassana,
        source: .timer,
        status: .completed,
        startedAt: now.addingTimeInterval(-1_200),
        endedAt: now.addingTimeInterval(-600),
        completedDurationSeconds: 600
    )
    let oldLog = SessionLog(
        meditationType: .ajapa,
        source: .manual,
        status: .completed,
        startedAt: now.addingTimeInterval(-(40 * 24 * 60 * 60) - 900),
        endedAt: now.addingTimeInterval(-(40 * 24 * 60 * 60)),
        completedDurationSeconds: 900
    )

    let lastSevenDays = SummaryFeature.deriveSnapshot(
        from: [recentLog, oldLog],
        rangePreset: .last7Days,
        now: now
    )
    let lastThirtyDays = SummaryFeature.deriveSnapshot(
        from: [recentLog, oldLog],
        rangePreset: .last30Days,
        now: now
    )

    #expect(lastSevenDays.sessionLogs.count == 1)
    #expect(lastThirtyDays.sessionLogs.count == 1)
    #expect(lastSevenDays.sessionLogs.first?.id == recentLog.id)
}

@Test func sankalpaValidationRequiresTargetDaysAndObservanceLabel() throws {
    let invalidDurationDraft = SankalpaDraft(
        title: "",
        kind: .durationBased,
        targetValue: 0,
        days: 0
    )
    let invalidObservanceDraft = SankalpaDraft(
        title: "",
        kind: .observanceBased,
        targetValue: 7,
        days: 7,
        observanceLabel: ""
    )

    #expect(SankalpaFeature.validateSankalpaDraft(invalidDurationDraft).contains(.targetValueMustBeGreaterThanZero))
    #expect(SankalpaFeature.validateSankalpaDraft(invalidDurationDraft).contains(.daysMustBeGreaterThanZero))
    #expect(SankalpaFeature.validateSankalpaDraft(invalidObservanceDraft).contains(.observanceLabelRequired))
}

@Test func sankalpaProgressCountsDurationAndSessionGoalsWithFilters() throws {
    let now = Date(timeIntervalSince1970: 1_700_000_000)
    let logs = [
        SessionLog(
            meditationType: .vipassana,
            source: .timer,
            status: .completed,
            startedAt: now.addingTimeInterval(-2_000),
            endedAt: now.addingTimeInterval(-1_200),
            completedDurationSeconds: 1_200
        ),
        SessionLog(
            meditationType: .vipassana,
            source: .manual,
            status: .completed,
            startedAt: now.addingTimeInterval(-1_000),
            endedAt: now.addingTimeInterval(-400),
            completedDurationSeconds: 600
        ),
        SessionLog(
            meditationType: .ajapa,
            source: .manual,
            status: .completed,
            startedAt: now.addingTimeInterval(-800),
            endedAt: now.addingTimeInterval(-300),
            completedDurationSeconds: 500
        ),
    ]

    let durationGoal = Sankalpa(
        title: "Morning Vipassana",
        kind: .durationBased,
        targetValue: 20,
        days: 5,
        meditationType: .vipassana,
        createdAt: now.addingTimeInterval(-(2 * 24 * 60 * 60))
    )
    let sessionGoal = Sankalpa(
        title: "Ajapa count",
        kind: .sessionCount,
        targetValue: 1,
        days: 5,
        meditationType: .ajapa,
        createdAt: now.addingTimeInterval(-(2 * 24 * 60 * 60))
    )

    let durationProgress = SankalpaFeature.deriveProgress(for: durationGoal, sessionLogs: logs, now: now)
    let sessionProgress = SankalpaFeature.deriveProgress(for: sessionGoal, sessionLogs: logs, now: now)

    #expect(durationProgress.matchedDurationSeconds == 1_800)
    #expect(durationProgress.status == .completed)
    #expect(sessionProgress.matchedSessionCount == 1)
    #expect(sessionProgress.status == .completed)
}

@Test func observanceProgressDerivesPendingObservedMissedAndFutureStates() throws {
    let calendar = Calendar(identifier: .gregorian)
    let now = calendar.date(from: DateComponents(year: 2026, month: 4, day: 9, hour: 8, minute: 0))!
    let start = calendar.date(byAdding: .day, value: -2, to: now)!
    let goal = Sankalpa(
        title: "Meal before 7 PM",
        kind: .observanceBased,
        targetValue: 5,
        days: 5,
        observanceLabel: "Observed meal before 7 PM",
        observanceRecords: [
            SankalpaObservanceRecord(dateKey: "2026-04-07", status: .observed),
            SankalpaObservanceRecord(dateKey: "2026-04-08", status: .missed),
        ],
        createdAt: start
    )

    let progress = SankalpaFeature.deriveProgress(for: goal, sessionLogs: [], now: now)
    let futureDay = progress.observanceDays.last(where: { $0.isFuture })
    let updated = SankalpaFeature.setObservanceStatus(for: goal, dateKey: futureDay?.dateKey ?? "", status: .observed, now: now)

    #expect(progress.matchedObservanceCount == 1)
    #expect(progress.missedObservanceCount == 1)
    #expect(progress.pendingObservanceCount == 3)
    #expect(futureDay?.status == .pending)
    #expect(updated == goal)
}

@Test func archivedSankalpasRestoreWithoutChangingIdentity() throws {
    let goal = Sankalpa(
        id: UUID(uuidString: "99999999-2222-3333-4444-555555555555")!,
        title: "Archived sit",
        kind: .durationBased,
        targetValue: 120,
        days: 7,
        createdAt: Date(timeIntervalSince1970: 1_700_000_000),
        archived: true
    )

    let restored = SankalpaFeature.restore(goal)

    #expect(restored.id == goal.id)
    #expect(restored.createdAt == goal.createdAt)
    #expect(restored.archived == false)
}
