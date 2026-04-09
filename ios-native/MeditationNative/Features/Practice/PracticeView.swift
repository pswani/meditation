import SwiftUI

struct PracticeView: View {
    @ObservedObject var viewModel: ShellViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Practice")
                    .font(.largeTitle.weight(.semibold))

                SectionCard(title: "Timer setup", caption: "Local-first draft state only for this milestone") {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Meditation type: \(viewModel.snapshot.timerDraft.meditationType.rawValue)")
                        Text("Duration: \(viewModel.snapshot.timerDraft.durationMinutes) minutes")
                        Text("Advanced sounds stay intentionally out of the main surface for now.")
                            .foregroundStyle(.secondary)
                    }
                }

                SectionCard(title: "Custom plays", caption: "Sample entries only") {
                    ForEach(viewModel.snapshot.customPlays) { play in
                        HStack {
                            Text(play.name)
                            Spacer()
                            Text("\(play.durationSeconds / 60) min")
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                SectionCard(title: "Playlists", caption: "Navigation and vocabulary foundation") {
                    ForEach(viewModel.snapshot.playlists) { playlist in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(playlist.name)
                            Text("\(playlist.items.count) items • \(playlist.totalDurationSeconds / 60) min")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Practice")
    }
}
