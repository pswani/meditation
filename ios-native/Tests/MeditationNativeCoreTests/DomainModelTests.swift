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
            PlaylistItem(title: "Sit", kind: .timer, durationSeconds: 600),
            PlaylistItem(title: "Rest", kind: .customPlay, durationSeconds: 300),
            PlaylistItem(title: "Close", kind: .timer, durationSeconds: 120),
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

@Test func sessionLogFiltersRespectMeditationTypeAndSource() throws {
    let filtered = TimerFeature.filteredSessionLogs(
        SampleData.snapshot.recentSessionLogs,
        using: SessionLogFilter(meditationType: .ajapa, source: .manual)
    )

    #expect(filtered.count == 1)
    #expect(filtered.first?.meditationType == .ajapa)
    #expect(filtered.first?.source == .manual)
}
