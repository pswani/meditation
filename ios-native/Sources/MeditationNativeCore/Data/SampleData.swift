import Foundation

public enum SampleData {
    public static let snapshot = AppSnapshot(
        timerDraft: TimerSettingsDraft(
            mode: .fixedDuration,
            durationMinutes: 25,
            meditationType: .vipassana,
            startSoundName: "Temple Bell",
            endSoundName: "Temple Bell",
            intervalSoundName: nil,
            intervalMinutes: nil
        ),
        recentSessionLogs: [
            SessionLog(
                meditationType: .vipassana,
                source: .timer,
                status: .completed,
                startedAt: Date(timeIntervalSince1970: 1_712_560_800),
                endedAt: Date(timeIntervalSince1970: 1_712_562_300),
                completedDurationSeconds: 1_500,
                plannedDurationSeconds: 1_500,
                timerMode: .fixedDuration,
                notes: "Sample local session log"
            ),
            SessionLog(
                meditationType: .ajapa,
                source: .manual,
                status: .completed,
                startedAt: Date(timeIntervalSince1970: 1_712_474_400),
                endedAt: Date(timeIntervalSince1970: 1_712_475_300),
                completedDurationSeconds: 900,
                notes: "Manual log placeholder"
            ),
        ],
        customPlays: [
            CustomPlay(
                name: "Vipassana Sit 20",
                meditationType: .vipassana,
                durationSeconds: 1_200,
                isFavorite: true
            ),
            CustomPlay(
                name: "Ajapa Evening Sit",
                meditationType: .ajapa,
                durationSeconds: 900,
                isFavorite: false
            ),
        ],
        playlists: [
            Playlist(
                name: "Morning Discipline",
                items: [
                    PlaylistItem(title: "Vipassana Warmup", kind: .timer, durationSeconds: 600),
                    PlaylistItem(title: "Ajapa Evening Sit", kind: .customPlay, durationSeconds: 900),
                ],
                gapSeconds: 60,
                isFavorite: true
            ),
        ],
        sankalpas: [
            Sankalpa(
                title: "Seven days of steady morning practice",
                kind: .durationBased,
                targetValue: 210,
                days: 7,
                meditationType: .vipassana,
                timeOfDayBucket: .morning
            ),
            Sankalpa(
                title: "Meal before 7 PM",
                kind: .observanceBased,
                targetValue: 7,
                days: 7,
                observanceLabel: "Observed meal before 7 PM"
            ),
        ],
        summary: SummarySnapshot(
            overallRows: [
                SummarySnapshot.SummaryRow(label: "This week", value: "40 minutes"),
                SummarySnapshot.SummaryRow(label: "Completed sessions", value: "2"),
            ],
            byMeditationTypeRows: [
                SummarySnapshot.SummaryRow(label: "Vipassana", value: "25 minutes"),
                SummarySnapshot.SummaryRow(label: "Ajapa", value: "15 minutes"),
            ]
        )
    )
}
