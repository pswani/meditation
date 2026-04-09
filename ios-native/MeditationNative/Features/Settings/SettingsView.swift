import SwiftUI

struct SettingsView: View {
    @ObservedObject var viewModel: ShellViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Settings")
                    .font(.largeTitle.weight(.semibold))

                TimerDraftForm(
                    draft: viewModel.timerDraftBinding,
                    headline: "Timer defaults",
                    showsIntroCopy: false
                )

                SectionCard(title: "Notifications", caption: "Fixed-duration completion support") {
                    VStack(alignment: .leading, spacing: 12) {
                        Text(viewModel.notificationPermissionState.title)
                        Text(viewModel.notificationPermissionState.detail)
                            .font(.footnote)
                            .foregroundStyle(.secondary)

                        if viewModel.notificationPermissionState.canRequestAuthorization {
                            Button("Allow notifications") {
                                Task {
                                    await viewModel.requestNotificationPermission()
                                }
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.teal)
                        }
                    }
                }

                SectionCard(title: "Environment", caption: "Native local-first profile") {
                    VStack(alignment: .leading, spacing: 8) {
                        LabeledContent("Profile", value: viewModel.environment.profileName)
                        LabeledContent(
                            "API base URL",
                            value: viewModel.environment.apiBaseURL?.absoluteString ?? "Not configured"
                        )
                        LabeledContent(
                            "Backend required",
                            value: viewModel.environment.requiresBackend ? "Yes" : "No"
                        )
                    }
                }

                if let persistenceMessage = viewModel.persistenceMessage {
                    Text(persistenceMessage)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .padding()
        }
        .navigationTitle("Settings")
    }
}
