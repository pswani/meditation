import SwiftUI

struct ShellRootView: View {
    @ObservedObject var viewModel: ShellViewModel
    @Environment(\.scenePhase) private var scenePhase
    private let accentColor = Color(red: 0.12, green: 0.48, blue: 0.42)

    var body: some View {
        TabView {
            NavigationStack {
                HomeView(viewModel: viewModel)
            }
            .tabItem {
                Label("Home", systemImage: "house")
            }

            NavigationStack {
                PracticeView(viewModel: viewModel)
            }
            .tabItem {
                Label("Practice", systemImage: "figure.mind.and.body")
            }

            NavigationStack {
                HistoryView(viewModel: viewModel)
            }
            .tabItem {
                Label("History", systemImage: "clock.arrow.circlepath")
            }

            NavigationStack {
                GoalsView(viewModel: viewModel)
            }
            .tabItem {
                Label("Goals", systemImage: "target")
            }

            NavigationStack {
                SettingsView(viewModel: viewModel)
            }
            .tabItem {
                Label("Settings", systemImage: "gearshape")
            }
        }
        .tint(accentColor)
        .safeAreaInset(edge: .top) {
            if let syncBannerMessage = viewModel.syncBannerMessage {
                HStack {
                    Spacer(minLength: 0)
                    Text(syncBannerMessage)
                        .font(.footnote.weight(.medium))
                        .lineLimit(1)
                        .minimumScaleFactor(0.84)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(accentColor.opacity(0.12))
                        .clipShape(Capsule())
                    Spacer(minLength: 0)
                }
                .padding(.horizontal, 16)
                .padding(.top, 4)
                .padding(.bottom, 2)
            }
        }
        .task {
            await viewModel.refreshNotificationPermissionState()
        }
        .onChange(of: scenePhase) { _, newValue in
            viewModel.handleScenePhaseChange(to: newValue)
        }
    }
}
