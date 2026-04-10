import SwiftUI

struct HomeView: View {
    @ObservedObject var viewModel: ShellViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Home")
                    .font(.largeTitle.weight(.semibold))
                Text("Start quickly, check today’s progress, and keep your current sankalpa in view.")
                    .foregroundStyle(.secondary)

                if viewModel.isSeedData {
                    Text("Showing the seeded local snapshot until you start or log your own sessions.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                quickStartSection
                todaySection
                sankalpaSection
                recentSessionSection
                practiceLibrarySection

                if let persistenceMessage = viewModel.persistenceMessage {
                    Text(persistenceMessage)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 4)
                }
            }
            .padding()
        }
        .navigationTitle("Home")
    }

    private var quickStartSection: some View {
        SectionCard(
            title: "Quick start",
            caption: "Current timer defaults"
        ) {
            VStack(alignment: .leading, spacing: 8) {
                Text(viewModel.snapshot.timerDraft.meditationType?.rawValue ?? "Choose a meditation type")

                if viewModel.snapshot.timerDraft.mode == .fixedDuration {
                    Text("\(viewModel.snapshot.timerDraft.durationMinutes) minute fixed-duration session")
                        .foregroundStyle(.secondary)
                } else {
                    Text("Open-ended session")
                        .foregroundStyle(.secondary)
                }

                if let startSoundName = viewModel.snapshot.timerDraft.startSoundName {
                    Text("Start sound: \(startSoundName)")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private var todaySection: some View {
        SectionCard(title: "Today", caption: "Local progress on this iPhone") {
            if viewModel.todayActivitySummary.sessionLogCount == 0 {
                VStack(alignment: .leading, spacing: 8) {
                    Text("No session logs yet today.")
                    Text("Start a timer or add a manual log in History when you want today’s progress to appear here.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            } else {
                VStack(spacing: 12) {
                    metricRow(
                        title: "Session logs",
                        value: "\(viewModel.todayActivitySummary.sessionLogCount)"
                    )
                    metricRow(
                        title: "Completed duration",
                        value: formatDuration(viewModel.todayActivitySummary.totalDurationSeconds)
                    )
                    metricRow(
                        title: "Completed / ended early",
                        value: "\(viewModel.todayActivitySummary.completedCount) / \(viewModel.todayActivitySummary.endedEarlyCount)"
                    )
                }
            }
        }
    }

    private var sankalpaSection: some View {
        SectionCard(title: "Sankalpa snapshot", caption: "Nearest active goal window") {
            if let topActiveSankalpa = viewModel.topActiveSankalpa {
                VStack(alignment: .leading, spacing: 12) {
                    Text(topActiveSankalpa.goal.title)
                        .font(.headline)

                    Text(sankalpaDetail(for: topActiveSankalpa))
                        .font(.footnote)
                        .foregroundStyle(.secondary)

                    ProgressView(value: topActiveSankalpa.progressRatio)
                        .tint(.teal)

                    Text(remainingDetail(for: topActiveSankalpa))
                        .font(.footnote)
                        .foregroundStyle(.secondary)

                    Text("Deadline: \(topActiveSankalpa.deadlineAt.formatted(date: .abbreviated, time: .omitted))")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    Text("No active sankalpa right now.")
                    Text("Create one in Goals when you want a steady intention to stay visible from Home.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private var recentSessionSection: some View {
        Group {
            if let latestLog = viewModel.recentSessionLogs.first {
                SectionCard(title: "Most recent session", caption: "Latest local session log") {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(latestLog.meditationType.rawValue)
                        Text("\(latestLog.source.title) • \(formatDuration(latestLog.completedDurationSeconds))")
                            .foregroundStyle(.secondary)
                        Text(latestLog.endedAt.formatted(date: .abbreviated, time: .shortened))
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
    }

    private var practiceLibrarySection: some View {
        SectionCard(title: "Practice library", caption: "Local custom plays and playlists on this device") {
            VStack(alignment: .leading, spacing: 8) {
                Text("\(viewModel.customPlays.count) custom plays • \(viewModel.playlists.count) playlists")
                Text("Summaries and sankalpas now derive from the same local session history that powers History.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private func metricRow(title: String, value: String) -> some View {
        HStack {
            Text(title)
            Spacer()
            Text(value)
                .foregroundStyle(.secondary)
        }
    }

    private func formatDuration(_ totalSeconds: Int) -> String {
        let totalMinutes = max(0, totalSeconds / 60)
        if totalMinutes >= 60 {
            let hours = totalMinutes / 60
            let minutes = totalMinutes % 60
            if minutes == 0 {
                return "\(hours) hr"
            }
            return "\(hours) hr \(minutes) min"
        }

        return "\(totalMinutes) min"
    }

    private func sankalpaDetail(for progress: SankalpaProgress) -> String {
        switch progress.goal.kind {
        case .observanceBased:
            return "\(progress.matchedObservanceCount) of \(progress.targetObservanceCount) observed dates"
        case .durationBased:
            return "\(formatDuration(progress.matchedDurationSeconds)) of \(formatDuration(progress.targetDurationSeconds))"
        case .sessionCount:
            return "\(progress.matchedSessionCount) of \(progress.targetSessionCount) session logs"
        }
    }

    private func remainingDetail(for progress: SankalpaProgress) -> String {
        switch progress.goal.kind {
        case .observanceBased:
            return "\(progress.pendingObservanceCount) pending · \(progress.missedObservanceCount) missed"
        case .durationBased:
            let remainingSeconds = max(0, progress.targetDurationSeconds - progress.matchedDurationSeconds)
            return "\(formatDuration(remainingSeconds)) remaining"
        case .sessionCount:
            let remainingCount = max(0, progress.targetSessionCount - progress.matchedSessionCount)
            return "\(remainingCount) session logs remaining"
        }
    }
}
