import SwiftUI

struct PracticeView: View {
    @ObservedObject var viewModel: ShellViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Practice")
                    .font(.largeTitle.weight(.semibold))

                if viewModel.activeSession != nil {
                    ActiveTimerSection(viewModel: viewModel)
                } else if viewModel.activeCustomPlaySession != nil {
                    ActiveCustomPlaySection(viewModel: viewModel)
                } else if viewModel.activePlaylistSession != nil {
                    ActivePlaylistSection(viewModel: viewModel)
                } else {
                    TimerSetupSection(viewModel: viewModel)
                    FeaturedCustomPlayLibrarySection(viewModel: viewModel)
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
