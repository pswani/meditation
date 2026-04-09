import SwiftUI

struct PracticeView: View {
    @ObservedObject var viewModel: ShellViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Practice")
                    .font(.largeTitle.weight(.semibold))

                if viewModel.activeSession != nil {
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

                                Button(endButtonTitle) {
                                    viewModel.endTimerManually()
                                }
                                .buttonStyle(.borderedProminent)
                                .tint(.teal)
                            }

                            Text(activeTimerCaption)
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                    }
                } else {
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

                if let timerValidationMessage = viewModel.timerValidationMessage {
                    Text(timerValidationMessage)
                        .font(.footnote)
                        .foregroundStyle(.red)
                }

                if let persistenceMessage = viewModel.persistenceMessage {
                    Text(persistenceMessage)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .padding()
        }
        .navigationTitle("Practice")
    }

    private var endButtonTitle: String {
        if viewModel.activeSession?.configuration.mode == .fixedDuration {
            return "End early"
        }

        return "End session"
    }

    private var activeTimerCaption: String {
        if viewModel.activeSession?.configuration.mode == .fixedDuration {
            return "Notifications can support fixed-session completion when permission is granted, but the timer display here remains the source of truth while the app is open."
        }

        return "Open-ended sessions log the actual practiced duration when you choose to end the sit."
    }
}
