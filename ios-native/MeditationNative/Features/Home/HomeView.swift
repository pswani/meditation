import SwiftUI

struct HomeView: View {
    @ObservedObject var viewModel: ShellViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Home")
                    .font(.largeTitle.weight(.semibold))
                Text("A calm local-first companion for timer practice on iPhone.")
                    .foregroundStyle(.secondary)

                if viewModel.isSeedData {
                    Text("Showing the seeded local snapshot until you start or log your own sessions.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

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

                if let latestLog = viewModel.recentSessionLogs.first {
                    SectionCard(title: "Most recent session", caption: "Latest local session log") {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(latestLog.meditationType.rawValue)
                            Text("\(latestLog.source.rawValue) • \(latestLog.completedDurationSeconds / 60) min")
                                .foregroundStyle(.secondary)
                            Text(latestLog.endedAt.formatted(date: .abbreviated, time: .shortened))
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                if let persistenceMessage = viewModel.persistenceMessage {
                    Text(persistenceMessage)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 4)
                }

                SectionCard(title: "Today's progress", caption: "Sample summary rows stay until later milestones") {
                    ForEach(viewModel.snapshot.summary.overallRows) { row in
                        HStack {
                            Text(row.label)
                            Spacer()
                            Text(row.value)
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                SectionCard(title: "Practice library", caption: "Local custom plays and playlists on this device") {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("\(viewModel.customPlays.count) custom plays • \(viewModel.playlists.count) playlists")
                        Text("Summary and sankalpa stay sample-backed until milestone 4.")
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Home")
    }
}
