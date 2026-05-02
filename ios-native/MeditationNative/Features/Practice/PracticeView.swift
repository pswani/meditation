import SwiftUI

struct PracticeView: View {
    private enum Destination: Hashable, Identifiable {
        case customPlays

        var id: Self { self }
    }

    // @ObservedObject: does NOT own lifecycle. Instance is owned by MeditationNativeApp's @StateObject.
    @ObservedObject var viewModel: ShellViewModel
    @State private var destination: Destination?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if viewModel.activeSession != nil {
                    ActiveTimerSection(
                        sessionDisplay: viewModel.sessionDisplay,
                        onPause: { viewModel.pauseTimer() },
                        onResume: { viewModel.resumeTimer() },
                        onRequestEnd: { viewModel.requestEndTimerConfirmation() }
                    )
                } else if viewModel.activeCustomPlaySession != nil {
                    ActiveCustomPlaySection(
                        sessionDisplay: viewModel.sessionDisplay,
                        onPause: { viewModel.pauseCustomPlay() },
                        onResume: { viewModel.resumeCustomPlay() },
                        onRequestEnd: { viewModel.requestEndCustomPlayConfirmation() }
                    )
                } else if viewModel.activePlaylistSession != nil {
                    ActivePlaylistSection(
                        sessionDisplay: viewModel.sessionDisplay,
                        onPause: { viewModel.pausePlaylist() },
                        onResume: { viewModel.resumePlaylist() },
                        onRequestEnd: { viewModel.requestEndPlaylistConfirmation() }
                    )
                } else {
                    TimerSetupSection(viewModel: viewModel)
                    FeaturedCustomPlayLibrarySection(
                        viewModel: viewModel,
                        openLibrary: { destination = .customPlays }
                    )
                    FeaturedPlaylistLibrarySection(viewModel: viewModel)
                }

                if let timerValidationMessage = viewModel.timerValidationMessage {
                    PracticeMessageText(message: timerValidationMessage, color: .red)
                }

                if let practiceRuntimeMessage = viewModel.practiceRuntimeMessage {
                    PracticeMessageText(message: practiceRuntimeMessage, color: .secondary)
                }

                if let persistenceMessage = viewModel.persistenceMessage {
                    PracticeMessageText(message: persistenceMessage, color: .secondary)
                }
            }
            .padding()
            .dismissesKeyboardOnBackgroundTap()
        }
        .scrollDismissesKeyboard(.interactively)
        .safeAreaInset(edge: .bottom) {
            Color.clear.frame(height: 12)
        }
        .navigationTitle("Practice")
        .alert(
            viewModel.runtimeSafetyPrompt?.title ?? "",
            isPresented: runtimeSafetyPromptIsPresented,
            presenting: viewModel.runtimeSafetyPrompt
        ) { prompt in
            Button(prompt.confirmButtonTitle, role: prompt.confirmButtonRole) {
                viewModel.confirmRuntimeSafetyPrompt()
            }
            Button("Cancel", role: .cancel) {
                viewModel.cancelRuntimeSafetyPrompt()
            }
        } message: { prompt in
            Text(prompt.message)
        }
        .navigationDestination(item: $destination) { destination in
            switch destination {
            case .customPlays:
                CustomPlayLibraryView(viewModel: viewModel)
            }
        }
    }

    private var runtimeSafetyPromptIsPresented: Binding<Bool> {
        Binding(
            get: { viewModel.runtimeSafetyPrompt != nil },
            set: { isPresented in
                if isPresented == false {
                    viewModel.cancelRuntimeSafetyPrompt()
                }
            }
        )
    }
}
