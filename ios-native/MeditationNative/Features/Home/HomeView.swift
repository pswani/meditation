import SwiftUI

struct HomeView: View {
    @ObservedObject var viewModel: ShellViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Start quickly, repeat the last used meditation, and keep today’s practice context visible.")
                    .foregroundStyle(.secondary)

                if viewModel.isSeedData {
                    Text("Showing the seeded local snapshot until you start or log your own sessions.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                if viewModel.hasActivePracticeRuntime {
                    Text("A practice is already active in Practice.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                quickStartSection
                favoriteShortcutsSection
                todaySection
                recentSessionSection
                sankalpaSection

                if let timerValidationMessage = viewModel.timerValidationMessage {
                    messageText(timerValidationMessage, color: .red)
                }

                if let practiceRuntimeMessage = viewModel.practiceRuntimeMessage {
                    messageText(practiceRuntimeMessage, color: .secondary)
                }

                if let persistenceMessage = viewModel.persistenceMessage {
                    messageText(persistenceMessage, color: .secondary)
                }
            }
            .padding()
        }
        .navigationTitle("Home")
    }

    private var quickStartSection: some View {
        SectionCard(
            title: "Quick start",
            caption: "Start the current timer defaults or repeat the last used meditation"
        ) {
            VStack(alignment: .leading, spacing: 12) {
                Text(viewModel.homeQuickStartSummary)
                    .font(.headline)

                if let lastUsedPracticeSummary = viewModel.lastUsedPracticeSummary {
                    Text("Last used: \(lastUsedPracticeSummary)")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                } else {
                    Text("No last used meditation yet.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Button("Start timer") {
                    viewModel.startTimer()
                }
                .buttonStyle(.borderedProminent)
                .tint(.teal)
                .disabled(viewModel.hasActivePracticeRuntime || viewModel.snapshot.timerDraft.meditationType == nil)

                Button("Start last used meditation") {
                    viewModel.startLastUsedPractice()
                }
                .buttonStyle(.bordered)
                .disabled(viewModel.hasActivePracticeRuntime || viewModel.hasLastUsedPracticeTarget == false)

                if viewModel.snapshot.timerDraft.meditationType == nil {
                    Text("Choose a meditation type in Practice before using the timer quick start.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private var favoriteShortcutsSection: some View {
        SectionCard(
            title: "Favorite shortcuts",
            caption: "Start saved custom plays and playlists without opening the libraries"
        ) {
            VStack(alignment: .leading, spacing: 16) {
                favoriteCustomPlaySection

                Divider()

                favoritePlaylistSection
            }
        }
    }

    private var favoriteCustomPlaySection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Custom plays")
                .font(.headline)

            if viewModel.favoriteCustomPlaysForHome.isEmpty {
                Text("Mark a custom play favorite in Practice to bring a shortcut here.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            } else {
                VStack(alignment: .leading, spacing: 12) {
                    ForEach(viewModel.favoriteCustomPlaysForHome) { customPlay in
                        let startSupportMessage = viewModel.customPlayStartSupportMessage(for: customPlay)

                        shortcutRow(
                            title: customPlay.name,
                            detail: "\(customPlay.meditationType.rawValue) • \(formatDuration(customPlay.durationSeconds))",
                            buttonTitle: "Start \(customPlay.name)",
                            isEnabled: viewModel.canStartCustomPlay(customPlay),
                            footerText: startSupportMessage
                        ) {
                            viewModel.startCustomPlay(customPlay)
                        }

                        if customPlay.id != viewModel.favoriteCustomPlaysForHome.last?.id {
                            Divider()
                        }
                    }
                }
            }
        }
    }

    private var favoritePlaylistSection: some View {
        VStack(alignment: .leading, spacing: 10) {
                Text("Playlists")
                    .font(.headline)

            if viewModel.favoritePlaylistsForHome.isEmpty {
                Text("Mark a playlist favorite in Practice to bring a shortcut here.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            } else {
                VStack(alignment: .leading, spacing: 12) {
                    ForEach(viewModel.favoritePlaylistsForHome) { playlist in
                        let validationMessage = viewModel.playlistRunValidationMessage(for: playlist)

                        shortcutRow(
                            title: playlist.name,
                            detail: "\(playlist.items.count) items • \(formatDuration(playlist.totalDurationSeconds))",
                            buttonTitle: "Start \(playlist.name)",
                            isEnabled: validationMessage == nil && viewModel.hasActivePracticeRuntime == false,
                            footerText: playlist.gapSeconds > 0 ? "Small gap: \(playlist.gapSeconds) sec" : "No gap between items"
                        ) {
                            viewModel.startPlaylist(playlist)
                        }

                        if let validationMessage {
                            Text(validationMessage)
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }

                        if playlist.id != viewModel.favoritePlaylistsForHome.last?.id {
                            Divider()
                        }
                    }
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

    private var recentSessionSection: some View {
        SectionCard(title: "Recent activity", caption: "Latest local session logs") {
            if viewModel.homeRecentSessionLogs.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("No recent session logs yet.")
                    Text("Your latest sessions will appear here after you start or log them.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            } else {
                VStack(alignment: .leading, spacing: 12) {
                    ForEach(viewModel.homeRecentSessionLogs) { log in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(log.meditationType.rawValue)
                                .font(.headline)
                            Text("\(log.source.title) • \(formatDuration(log.completedDurationSeconds))")
                                .foregroundStyle(.secondary)
                            Text(log.endedAt.formatted(date: .abbreviated, time: .shortened))
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }

                        if log.id != viewModel.homeRecentSessionLogs.last?.id {
                            Divider()
                        }
                    }
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

    private func shortcutRow(
        title: String,
        detail: String,
        buttonTitle: String,
        isEnabled: Bool,
        footerText: String? = nil,
        action: @escaping () -> Void,
    ) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.headline)
                    Text(detail)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Button(buttonTitle, action: action)
                    .buttonStyle(.bordered)
                    .disabled(isEnabled == false)
            }

            if let footerText {
                Text(footerText)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private func messageText(_ message: String, color: Color) -> some View {
        Text(message)
            .font(.footnote)
            .foregroundStyle(color)
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
