import SwiftUI

struct ShellRootView: View {
    @ObservedObject var viewModel: ShellViewModel

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
    }
}

#Preview {
    ShellRootView(viewModel: ShellViewModel())
}
