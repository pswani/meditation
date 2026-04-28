import SwiftUI

struct ActiveTimerSection: View {
    var sessionDisplay: ActiveSessionDisplay
    var onPause: () -> Void
    var onResume: () -> Void
    var onRequestEnd: () -> Void

    var body: some View {
        SectionCard(title: "Active timer", caption: "Keep the session calm and uninterrupted") {
            VStack(alignment: .leading, spacing: 16) {
                Text(sessionDisplay.timerPrimaryText)
                    .font(.system(size: 52, weight: .semibold, design: .rounded))
                    .monospacedDigit()
                    .accessibilityIdentifier("activeTimerPrimaryText")

                Text(sessionDisplay.timerSecondaryText)
                    .foregroundStyle(.secondary)

                HStack(spacing: 12) {
                    if sessionDisplay.timerIsPaused {
                        Button("Resume") { onResume() }
                            .buttonStyle(.borderedProminent)
                    } else {
                        Button("Pause") { onPause() }
                            .buttonStyle(.bordered)
                    }

                    Button(timerEndButtonTitle) { onRequestEnd() }
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
        sessionDisplay.timerIsOpenEnded ? "End session" : "End early"
    }

    private var timerCaption: String {
        if !sessionDisplay.timerIsOpenEnded {
            return "While this screen stays open, the timer display and selected end bell are the source of truth. If iOS locks the app near completion, the app will try to finish with the same bell; longer lock-screen spans can still fall back to notification sound or foreground catch-up."
        }
        return "Open-ended sessions log the actual practiced duration when you choose to end the sit."
    }
}

struct ActiveCustomPlaySection: View {
    var sessionDisplay: ActiveSessionDisplay
    var onPause: () -> Void
    var onResume: () -> Void
    var onRequestEnd: () -> Void

    var body: some View {
        SectionCard(title: "Active custom play", caption: customPlayCaption) {
            VStack(alignment: .leading, spacing: 16) {
                Text(sessionDisplay.customPlayName)
                    .font(.title3.weight(.semibold))

                VStack(alignment: .leading, spacing: 6) {
                    Text(sessionDisplay.customPlaySoundSummaryText)
                    if let recordingLabel = sessionDisplay.customPlayRecordingLabel {
                        Text("Session note: \(recordingLabel)")
                    }
                    if let linkedMediaIdentifier = sessionDisplay.customPlayLinkedMediaIdentifier {
                        Text("Linked media identifier: \(linkedMediaIdentifier)")
                    }
                    if let mediaLabel = sessionDisplay.customPlayMediaLabel,
                       let mediaSourceSummary = sessionDisplay.customPlayMediaSourceSummary {
                        Text("Recording: \(mediaLabel) • \(mediaSourceSummary)")
                    }
                }
                .font(.footnote)
                .foregroundStyle(.secondary)

                Text(sessionDisplay.customPlayPrimaryText)
                    .font(.system(size: 52, weight: .semibold, design: .rounded))
                    .monospacedDigit()

                Text(sessionDisplay.customPlaySecondaryText)
                    .foregroundStyle(.secondary)

                HStack(spacing: 12) {
                    if sessionDisplay.customPlayIsPaused {
                        Button("Resume") { onResume() }
                            .buttonStyle(.borderedProminent)
                    } else {
                        Button("Pause") { onPause() }
                            .buttonStyle(.bordered)
                    }

                    Button("End session") { onRequestEnd() }
                        .buttonStyle(.borderedProminent)
                        .tint(.teal)
                }

                Text(customPlayFooter)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var customPlayCaption: String {
        sessionDisplay.customPlayCanResolvePlayback
            ? "The linked recording stays aligned with the current session"
            : "This session is running with its saved duration and bells only"
    }

    private var customPlayFooter: String {
        sessionDisplay.customPlayCanResolvePlayback
            ? "The session timing here follows the saved recording contract. If media is missing later, the app will say so instead of substituting another sound."
            : "The recording is unavailable on this device, so this custom play is finishing with its saved timing and bells only."
    }
}

struct ActivePlaylistSection: View {
    var sessionDisplay: ActiveSessionDisplay
    var onPause: () -> Void
    var onResume: () -> Void
    var onRequestEnd: () -> Void

    var body: some View {
        SectionCard(title: "Active playlist", caption: "Each item logs explicitly while gaps stay silent") {
            VStack(alignment: .leading, spacing: 16) {
                Text(sessionDisplay.playlistTitle)
                    .font(.title3.weight(.semibold))

                Text(sessionDisplay.playlistPrimaryText)
                    .font(.system(size: 52, weight: .semibold, design: .rounded))
                    .monospacedDigit()

                Text(sessionDisplay.playlistSecondaryText)
                    .foregroundStyle(.secondary)

                HStack(spacing: 12) {
                    if sessionDisplay.playlistIsPaused {
                        Button("Resume") { onResume() }
                            .buttonStyle(.borderedProminent)
                    } else {
                        Button("Pause") { onPause() }
                            .buttonStyle(.bordered)
                    }

                    Button("End playlist") { onRequestEnd() }
                        .buttonStyle(.borderedProminent)
                        .tint(.teal)
                }

                if let upcomingItemTitle = sessionDisplay.playlistUpcomingItemTitle {
                    Text("Upcoming: \(upcomingItemTitle)")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }
}
