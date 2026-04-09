import SwiftUI

struct SettingsView: View {
    @ObservedObject var viewModel: ShellViewModel

    var body: some View {
        List {
            Section("Environment") {
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

            Section("Foundation notes") {
                Text("This milestone keeps launch local-first and does not require backend connectivity.")
                Text("Timer notifications, playback, and sync arrive in later bundles.")
            }
        }
        .navigationTitle("Settings")
    }
}
