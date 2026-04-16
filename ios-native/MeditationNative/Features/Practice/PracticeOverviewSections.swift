import SwiftUI

struct TimerSetupSection: View {
    @ObservedObject var viewModel: ShellViewModel

    var body: some View {
        Group {
            TimerDraftForm(
                draft: viewModel.timerDraftBinding,
                headline: "Timer setup"
            )

            Button("Start session") {
                viewModel.startTimer()
            }
            .buttonStyle(.borderedProminent)
            .tint(.teal)

            Text("Fixed-duration stays the default. Open-ended practice remains available when you want to sit without a planned finish.")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
    }
}

struct FeaturedCustomPlayLibrarySection: View {
    @ObservedObject var viewModel: ShellViewModel
    let openLibrary: () -> Void

    var body: some View {
        SectionCard(title: "Custom plays", caption: "Create, favorite, and start prerecorded-style local sessions") {
            VStack(alignment: .leading, spacing: 12) {
                if let featuredCustomPlay = viewModel.customPlays.first {
                    let startSupportMessage = viewModel.customPlayStartSupportMessage(for: featuredCustomPlay)

                    VStack(alignment: .leading, spacing: 6) {
                        Text(featuredCustomPlay.name)
                            .font(.headline)
                        Text("\(featuredCustomPlay.meditationType.rawValue) • \(featuredCustomPlay.durationSeconds / 60) min")
                            .foregroundStyle(.secondary)
                        Text(customPlaySoundSummary(featuredCustomPlay))
                            .foregroundStyle(.secondary)
                        if let recordingLabel = featuredCustomPlay.recordingLabel {
                            Text("Session note: \(recordingLabel)")
                                .foregroundStyle(.secondary)
                        }
                        if let linkedMediaIdentifier = featuredCustomPlay.linkedMediaIdentifier {
                            Text("Linked media identifier: \(linkedMediaIdentifier)")
                                .foregroundStyle(.secondary)
                        }
                        Text(
                            viewModel.canResolvePlayback(for: featuredCustomPlay.media)
                                ? "Ready to play with linked recording media on this device."
                                : "Needs available recording media before it can start."
                        )
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }

                    HStack(spacing: 12) {
                        Button("Start featured custom play") {
                            viewModel.startCustomPlay(featuredCustomPlay)
                        }
                        .buttonStyle(.bordered)
                        .disabled(viewModel.canStartCustomPlay(featuredCustomPlay) == false)

                        Button("Apply to timer") {
                            viewModel.applyCustomPlayToTimer(featuredCustomPlay)
                        }
                        .buttonStyle(.bordered)
                    }

                    if let startSupportMessage {
                        Text(startSupportMessage)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                } else {
                    Text("No custom plays yet. Add one with bundled sample media or a synced linked recording so you can start it quickly from Practice.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Button(action: openLibrary) {
                    Label("Open custom play library", systemImage: "music.note.list")
                        .font(.body.weight(.medium))
                }
                .buttonStyle(.bordered)
            }
        }
    }
}

struct FeaturedPlaylistLibrarySection: View {
    @ObservedObject var viewModel: ShellViewModel

    var body: some View {
        SectionCard(title: "Playlists", caption: "Sequence timer items and custom plays in a calm order") {
            VStack(alignment: .leading, spacing: 12) {
                if let featuredPlaylist = viewModel.playlists.first {
                    let validationMessage = viewModel.playlistRunValidationMessage(for: featuredPlaylist)
                    VStack(alignment: .leading, spacing: 6) {
                        Text(featuredPlaylist.name)
                            .font(.headline)
                        Text("\(featuredPlaylist.items.count) items • \(featuredPlaylist.totalDurationSeconds / 60) min total")
                            .foregroundStyle(.secondary)
                        Text(featuredPlaylist.gapSeconds > 0 ? "Includes \(featuredPlaylist.gapSeconds)-second small gaps between items." : "Runs items back to back with no gap.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }

                    Button("Start featured playlist") {
                        viewModel.startPlaylist(featuredPlaylist)
                    }
                    .buttonStyle(.bordered)
                    .disabled(validationMessage != nil)

                    if let validationMessage {
                        Text(validationMessage)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                } else {
                    Text("No playlists yet. Build one from timer items and saved custom plays when you want an ordered practice flow.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                NavigationLink {
                    PlaylistLibraryView(viewModel: viewModel)
                } label: {
                    Label("Open playlist library", systemImage: "list.bullet.rectangle")
                        .font(.body.weight(.medium))
                }
            }
        }
    }
}
