import SwiftUI

struct HomeView: View {
    @ObservedObject var viewModel: ShellViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Home")
                    .font(.largeTitle.weight(.semibold))
                Text("A calm local foundation for the native iPhone app.")
                    .foregroundStyle(.secondary)

                if viewModel.isSeedData {
                    Text("Showing sample local data for milestone 1. Later milestones add real flows and sync.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                SectionCard(
                    title: "Quick start",
                    caption: "Foundation preview of the timer setup shape"
                ) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("\(viewModel.snapshot.timerDraft.durationMinutes) minute \(viewModel.snapshot.timerDraft.meditationType.rawValue)")
                        Text("Mode: \(viewModel.snapshot.timerDraft.mode.rawValue)")
                            .foregroundStyle(.secondary)
                    }
                }

                SectionCard(title: "Today's progress", caption: "Seed summary rows") {
                    ForEach(viewModel.snapshot.summary.overallRows) { row in
                        HStack {
                            Text(row.label)
                            Spacer()
                            Text(row.value)
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                SectionCard(title: "Favorites", caption: "Sample custom plays and playlists") {
                    ForEach(viewModel.snapshot.customPlays.filter { $0.isFavorite }) { play in
                        Text(play.name)
                    }
                    ForEach(viewModel.snapshot.playlists.filter { $0.isFavorite }) { playlist in
                        Text(playlist.name)
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Home")
    }
}
