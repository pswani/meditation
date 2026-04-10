import Foundation

public enum SampleData {
    private static let seedNow: Date = {
        let calendar = Calendar.current
        return calendar.date(bySettingHour: 8, minute: 0, second: 0, of: Date()) ?? Date()
    }()

    private static let vipassanaPlayID = UUID(uuidString: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1")!
    private static let ajapaPlayID = UUID(uuidString: "11111111-2222-3333-4444-555555555555")!

    public static let snapshot: AppSnapshot = {
        let sessionLogs = makeSessionLogs()

        return AppSnapshot(
            timerDraft: TimerSettingsDraft(
                mode: .fixedDuration,
                durationMinutes: 25,
                meditationType: .vipassana,
                startSoundName: "Temple Bell",
                endSoundName: "Temple Bell",
                intervalSoundName: nil,
                intervalMinutes: nil
            ),
            lastUsedPracticeTarget: LastUsedPracticeTarget(
                kind: .timer,
                title: "Vipassana timer",
                meditationType: .vipassana,
                timerDraft: TimerSettingsDraft(
                    mode: .fixedDuration,
                    durationMinutes: 25,
                    meditationType: .vipassana,
                    startSoundName: "Temple Bell",
                    endSoundName: "Temple Bell",
                    intervalSoundName: nil,
                    intervalMinutes: nil
                ),
                updatedAt: sessionLogs.first?.endedAt ?? seedNow
            ),
            recentSessionLogs: sessionLogs,
            customPlays: [
                CustomPlay(
                    id: vipassanaPlayID,
                    name: "Vipassana Sit 20",
                    meditationType: .vipassana,
                    durationSeconds: 1_200,
                    startSoundName: "Temple Bell",
                    endSoundName: "Temple Bell",
                    recordingLabel: "Morning recording",
                    linkedMediaIdentifier: "native-media-vipassana-sit-20",
                    media: CustomPlayMedia(asset: .templeBellLoop),
                    isFavorite: true
                ),
                CustomPlay(
                    id: ajapaPlayID,
                    name: "Ajapa Evening Sit",
                    meditationType: .ajapa,
                    durationSeconds: 900,
                    startSoundName: "Gong",
                    endSoundName: "Wood Block",
                    recordingLabel: "Breath emphasis",
                    linkedMediaIdentifier: "native-media-ajapa-evening-sit",
                    media: CustomPlayMedia(asset: .gongLoop),
                    isFavorite: false
                ),
            ],
            playlists: [
                Playlist(
                    name: "Morning Discipline",
                    items: [
                        PlaylistItem(
                            title: "Vipassana Warmup",
                            kind: .timer,
                            durationSeconds: 600,
                            meditationType: .vipassana
                        ),
                        PlaylistItem(
                            title: "Ajapa Evening Sit",
                            kind: .customPlay,
                            durationSeconds: 900,
                            meditationType: .ajapa,
                            customPlayID: ajapaPlayID
                        ),
                    ],
                    gapSeconds: 60,
                    isFavorite: true
                ),
            ],
            sankalpas: makeSankalpas(),
            summary: SummaryFeature.makeStoredSummarySnapshot(from: sessionLogs)
        )
    }()

    private static func makeSessionLogs() -> [SessionLog] {
        [
            SessionLog(
                meditationType: .vipassana,
                source: .timer,
                status: .completed,
                startedAt: dated(daysAgo: 0, hour: 6, minute: 30),
                endedAt: dated(daysAgo: 0, hour: 6, minute: 55),
                completedDurationSeconds: 1_500,
                plannedDurationSeconds: 1_500,
                timerMode: .fixedDuration,
                notes: "Quiet morning sit"
            ),
            SessionLog(
                meditationType: .ajapa,
                source: .manual,
                status: .completed,
                startedAt: dated(daysAgo: 1, hour: 20, minute: 0),
                endedAt: dated(daysAgo: 1, hour: 20, minute: 15),
                completedDurationSeconds: 900,
                notes: "Manual log placeholder"
            ),
            SessionLog(
                meditationType: .vipassana,
                source: .customPlay,
                status: .completed,
                startedAt: dated(daysAgo: 2, hour: 18, minute: 20),
                endedAt: dated(daysAgo: 2, hour: 18, minute: 40),
                completedDurationSeconds: 1_200,
                plannedDurationSeconds: 1_200,
                notes: "Vipassana Sit 20"
            ),
            SessionLog(
                meditationType: .ajapa,
                source: .playlist,
                status: .endedEarly,
                startedAt: dated(daysAgo: 4, hour: 7, minute: 10),
                endedAt: dated(daysAgo: 4, hour: 7, minute: 18),
                completedDurationSeconds: 480,
                plannedDurationSeconds: 900,
                notes: "Playlist: Morning Discipline • Item: Ajapa Evening Sit"
            ),
        ]
        .sorted { $0.endedAt > $1.endedAt }
    }

    private static func makeSankalpas() -> [Sankalpa] {
        [
            Sankalpa(
                title: "Steady morning Vipassana",
                kind: .durationBased,
                targetValue: 120,
                days: 7,
                meditationType: .vipassana,
                timeOfDayBucket: .morning,
                createdAt: dated(daysAgo: 2, hour: 5, minute: 0)
            ),
            Sankalpa(
                title: "Ajapa cadence",
                kind: .sessionCount,
                targetValue: 2,
                days: 5,
                meditationType: .ajapa,
                createdAt: dated(daysAgo: 3, hour: 9, minute: 0)
            ),
            Sankalpa(
                title: "Meal before 7 PM",
                kind: .observanceBased,
                targetValue: 5,
                days: 5,
                observanceLabel: "Observed meal before 7 PM",
                observanceRecords: [
                    SankalpaObservanceRecord(
                        dateKey: dayKey(for: dated(daysAgo: 2, hour: 0, minute: 0)),
                        status: .observed
                    ),
                    SankalpaObservanceRecord(
                        dateKey: dayKey(for: dated(daysAgo: 1, hour: 0, minute: 0)),
                        status: .missed
                    ),
                ],
                createdAt: dated(daysAgo: 2, hour: 8, minute: 0)
            ),
            Sankalpa(
                title: "Archived long sit",
                kind: .durationBased,
                targetValue: 180,
                days: 10,
                meditationType: .vipassana,
                createdAt: dated(daysAgo: 8, hour: 7, minute: 0),
                archived: true
            ),
        ]
    }

    private static func dated(daysAgo: Int, hour: Int, minute: Int) -> Date {
        let calendar = Calendar.current
        let baseDay = calendar.date(byAdding: .day, value: -daysAgo, to: seedNow) ?? seedNow
        return calendar.date(bySettingHour: hour, minute: minute, second: 0, of: baseDay) ?? baseDay
    }

    private static func dayKey(for date: Date) -> String {
        let components = Calendar.current.dateComponents([.year, .month, .day], from: date)
        return String(
            format: "%04d-%02d-%02d",
            components.year ?? 0,
            components.month ?? 1,
            components.day ?? 1
        )
    }
}
