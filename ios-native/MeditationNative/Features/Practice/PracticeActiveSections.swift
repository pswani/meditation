import SwiftUI

struct ActiveTimerSection: View {
    @ObservedObject var viewModel: ShellViewModel

    var body: some View {
        SectionCard(title: "Active timer", caption: "Keep the session calm and uninterrupted") {
            VStack(alignment: .leading, spacing: 16) {
                Text(viewModel.activeTimerPrimaryText())
                    .font(.system(size: 52, weight: .semibold, design: .rounded))
                    .monospacedDigit()

                Text(viewModel.activeTimerSecondaryText())
                    .foregroundStyle(.secondary)

                HStack(spacing: 12) {
                    if viewModel.activeSession?.isPaused == true {
                        Button("Resume") {
                            viewModel.resumeTimer()
                        }
                        .buttonStyle(.borderedProminent)
                    } else {
                        Button("Pause") {
                            viewModel.pauseTimer()
                        }
                        .buttonStyle(.bordered)
                    }

                    Button(timerEndButtonTitle) {
                        viewModel.requestEndTimerConfirmation()
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.teal)
                }

                Text(timerCaption)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var timerEndButtonTitle: String {
        if viewModel.activeSession?.configuration.mode == .fixedDuration {
            return "End early"
        }

        return "End session"
    }

    private var timerCaption: String {
        if viewModel.activeSession?.configuration.mode == .fixedDuration {
            return "Notifications can support fixed-session completion when permission is granted, but the timer display here remains the source of truth while the app is open."
        }

        return "Open-ended sessions log the actual practiced duration when you choose to end the sit."
    }
}

struct ActiveCustomPlaySection: View {
    @ObservedObject var viewModel: ShellViewModel

    var body: some View {
        SectionCard(title: "Active custom play", caption: "The linked recording stays aligned with the current session") {
            VStack(alignment: .leading, spacing: 16) {
                Text(viewModel.activeCustomPlaySession?.customPlay.name ?? "Custom play")
                    .font(.title3.weight(.semibold))

                if let customPlay = viewModel.activeCustomPlaySession?.customPlay {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(customPlaySoundSummary(customPlay))
                        if let recordingLabel = customPlay.recordingLabel {
                            Text("Session note: \(recordingLabel)")
                        }
                        if let linkedMediaIdentifier = customPlay.linkedMediaIdentifier {
                            Text("Linked media identifier: \(linkedMediaIdentifier)")
                        }
                        if let media = customPlay.media {
                            Text("Recording: \(media.label) • \(media.sourceSummary)")
                        }
                    }
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                }

                Text(viewModel.activeCustomPlayPrimaryText())
                    .font(.system(size: 52, weight: .semibold, design: .rounded))
                    .monospacedDigit()

                Text(viewModel.activeCustomPlaySecondaryText())
                    .foregroundStyle(.secondary)

                HStack(spacing: 12) {
                    if viewModel.activeCustomPlaySession?.isPaused == true {
                        Button("Resume") {
                            viewModel.resumeCustomPlay()
                        }
                        .buttonStyle(.borderedProminent)
                    } else {
                        Button("Pause") {
                            viewModel.pauseCustomPlay()
                        }
                        .buttonStyle(.bordered)
                    }

                    Button("End session") {
                        viewModel.requestEndCustomPlayConfirmation()
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.teal)
                }

                Text("The session timing here follows the saved recording contract. If media is missing later, the app will say so instead of substituting another sound.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

struct ActivePlaylistSection: View {
    @ObservedObject var viewModel: ShellViewModel

    var body: some View {
        SectionCard(title: "Active playlist", caption: "Each item logs explicitly while gaps stay silent") {
            VStack(alignment: .leading, spacing: 16) {
                Text(viewModel.activePlaylistTitle())
                    .font(.title3.weight(.semibold))

                Text(viewModel.activePlaylistPrimaryText())
                    .font(.system(size: 52, weight: .semibold, design: .rounded))
                    .monospacedDigit()

                Text(viewModel.activePlaylistSecondaryText())
                    .foregroundStyle(.secondary)

                HStack(spacing: 12) {
                    if viewModel.activePlaylistSession?.isPaused == true {
                        Button("Resume") {
                            viewModel.resumePlaylist()
                        }
                        .buttonStyle(.borderedProminent)
                    } else {
                        Button("Pause") {
                            viewModel.pausePlaylist()
                        }
                        .buttonStyle(.bordered)
                    }

                    Button("End playlist") {
                        viewModel.requestEndPlaylistConfirmation()
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.teal)
                }

                if let upcomingItem = viewModel.activePlaylistSession?.upcomingItem {
                    Text("Upcoming: \(upcomingItem.title)")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }
}
