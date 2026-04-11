import SwiftUI

struct SettingsView: View {
    @ObservedObject var viewModel: ShellViewModel
    @State private var timerDefaultsDraft: TimerSettingsDraft

    init(viewModel: ShellViewModel) {
        self.viewModel = viewModel
        _timerDefaultsDraft = State(initialValue: viewModel.snapshot.timerDraft)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Settings")
                    .font(.largeTitle.weight(.semibold))

                TimerDraftForm(
                    draft: $timerDefaultsDraft,
                    headline: "Timer defaults",
                    showsIntroCopy: false
                )

                SectionCard(
                    title: "Timer defaults actions",
                    caption: "Review the next-session defaults here before saving them."
                ) {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack(spacing: 12) {
                            Button("Reset") {
                                timerDefaultsDraft = viewModel.snapshot.timerDraft
                                viewModel.clearTimerDefaultsFeedback()
                            }
                            .buttonStyle(.bordered)
                            .disabled(hasUnsavedTimerDefaultsChanges == false)

                            Button("Save") {
                                viewModel.saveTimerDefaults(timerDefaultsDraft)
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.teal)
                            .disabled(hasUnsavedTimerDefaultsChanges == false)
                        }

                        Text(
                            hasUnsavedTimerDefaultsChanges
                                ? "Changes stay in this screen until you save them."
                                : "The saved timer defaults match what is shown here."
                        )
                        .font(.footnote)
                        .foregroundStyle(.secondary)

                        if let timerDefaultsFeedbackMessage = viewModel.timerDefaultsFeedbackMessage {
                            Text(timerDefaultsFeedbackMessage)
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }

                        if let timerDefaultsValidationMessage = viewModel.timerDefaultsValidationMessage {
                            Text(timerDefaultsValidationMessage)
                                .font(.footnote)
                                .foregroundStyle(.red)
                        }
                    }
                }

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

                SectionCard(title: "Environment", caption: "Current native runtime profile") {
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
            .dismissesKeyboardOnBackgroundTap()
        }
        .scrollDismissesKeyboard(.interactively)
        .navigationTitle("Settings")
        .onChange(of: timerDefaultsDraft) { _, _ in
            viewModel.clearTimerDefaultsFeedback()
        }
        .onChange(of: viewModel.snapshot.timerDraft) { _, newValue in
            if hasUnsavedTimerDefaultsChanges == false {
                timerDefaultsDraft = newValue
            }
        }
    }

    private var hasUnsavedTimerDefaultsChanges: Bool {
        timerDefaultsDraft != viewModel.snapshot.timerDraft
    }
}
