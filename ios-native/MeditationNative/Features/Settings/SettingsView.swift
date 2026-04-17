import SwiftUI

private struct BackendConfigurationDraft: Equatable {
    var profileName: String
    var apiBaseURLString: String
}

struct SettingsView: View {
    @ObservedObject var viewModel: ShellViewModel
    @State private var timerDefaultsDraft: TimerSettingsDraft
    @State private var backendConfigurationDraft: BackendConfigurationDraft

    init(viewModel: ShellViewModel) {
        self.viewModel = viewModel
        _timerDefaultsDraft = State(initialValue: viewModel.snapshot.timerDraft)
        _backendConfigurationDraft = State(
            initialValue: BackendConfigurationDraft(
                profileName: viewModel.environment.profileName == AppEnvironment.localOnly.profileName ? "" : viewModel.environment.profileName,
                apiBaseURLString: viewModel.environment.apiBaseURL?.absoluteString ?? ""
            )
        )
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

                        Text("Foreground completion still relies on the in-app timer and selected end bell. When the phone locks near the end of a fixed sit, the app will try to finish with that bell first; longer lock-screen spans remain iOS-limited and may fall back to notification sound instead.")
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

                SectionCard(title: "Backend sync", caption: "Configure the backend this iPhone should use") {
                    VStack(alignment: .leading, spacing: 12) {
                        LabeledContent("Profile") {
                            TextField("Configured Backend", text: $backendConfigurationDraft.profileName)
                                .multilineTextAlignment(.trailing)
                                .textInputAutocapitalization(.words)
                                .autocorrectionDisabled()
                        }

                        LabeledContent("API base URL") {
                            TextField("http://meditation-mac-mini.local", text: $backendConfigurationDraft.apiBaseURLString)
                                .multilineTextAlignment(.trailing)
                                .keyboardType(.URL)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                        }

                        Text("For the supported Mac Mini install, use the nginx app origin, for example `http://meditation-mac-mini.local` or `http://192.168.1.12`. Use a direct `:8080` backend URL only when you intentionally expose the backend for debugging.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)

                        HStack(spacing: 12) {
                            Button("Clear") {
                                viewModel.clearBackendConfiguration()
                                backendConfigurationDraft = BackendConfigurationDraft(profileName: "", apiBaseURLString: "")
                            }
                            .buttonStyle(.bordered)
                            .disabled(viewModel.environment.apiBaseURL == nil && backendConfigurationDraft.apiBaseURLString.isEmpty)

                            Button("Save backend") {
                                if viewModel.saveBackendConfiguration(
                                    profileName: backendConfigurationDraft.profileName,
                                    apiBaseURLString: backendConfigurationDraft.apiBaseURLString
                                ) {
                                    backendConfigurationDraft = BackendConfigurationDraft(
                                        profileName: viewModel.environment.profileName == AppEnvironment.localOnly.profileName ? "" : viewModel.environment.profileName,
                                        apiBaseURLString: viewModel.environment.apiBaseURL?.absoluteString ?? ""
                                    )
                                }
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.teal)
                            .disabled(hasUnsavedBackendConfigurationChanges == false)
                        }

                        if let backendConfigurationFeedbackMessage = viewModel.backendConfigurationFeedbackMessage {
                            Text(backendConfigurationFeedbackMessage)
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }

                        if let backendConfigurationValidationMessage = viewModel.backendConfigurationValidationMessage {
                            Text(backendConfigurationValidationMessage)
                                .font(.footnote)
                                .foregroundStyle(.red)
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
        .onChange(of: viewModel.environment) { _, newValue in
            if hasUnsavedBackendConfigurationChanges == false {
                backendConfigurationDraft = BackendConfigurationDraft(
                    profileName: newValue.profileName == AppEnvironment.localOnly.profileName ? "" : newValue.profileName,
                    apiBaseURLString: newValue.apiBaseURL?.absoluteString ?? ""
                )
            }
        }
    }

    private var hasUnsavedTimerDefaultsChanges: Bool {
        timerDefaultsDraft != viewModel.snapshot.timerDraft
    }

    private var hasUnsavedBackendConfigurationChanges: Bool {
        let savedDraft = BackendConfigurationDraft(
            profileName: viewModel.environment.profileName == AppEnvironment.localOnly.profileName ? "" : viewModel.environment.profileName,
            apiBaseURLString: viewModel.environment.apiBaseURL?.absoluteString ?? ""
        )
        return backendConfigurationDraft != savedDraft
    }
}
