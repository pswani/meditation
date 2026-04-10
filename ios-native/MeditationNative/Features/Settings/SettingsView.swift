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
                        Text("Use your Mac's LAN IP for a physical iPhone. `localhost` only works for simulator-adjacent tooling on the same machine.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }

                SectionCard(title: "Sync", caption: "Backend-backed local-first status") {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(viewModel.syncStatusHeadline)
                            .font(.headline)
                        Text(viewModel.syncStatusDetail)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                        if let syncBannerMessage = viewModel.syncBannerMessage {
                            Text(syncBannerMessage)
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                        if let lastErrorMessage = viewModel.syncState.lastErrorMessage {
                            Text(lastErrorMessage)
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
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
