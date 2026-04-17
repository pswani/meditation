import SwiftUI

struct ShellRootView: View {
    @ObservedObject var viewModel: ShellViewModel
    @Environment(\.scenePhase) private var scenePhase

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
        .tint(.teal)
        .safeAreaInset(edge: .top) {
            if let syncBannerMessage = viewModel.syncBannerMessage {
                Text(syncBannerMessage)
                    .font(.footnote.weight(.medium))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(Color.teal.opacity(0.12))
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
