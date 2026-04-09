import SwiftUI

@main
struct MeditationNativeApp: App {
    @StateObject private var viewModel = ShellViewModel()

    var body: some Scene {
        WindowGroup {
            ShellRootView(viewModel: viewModel)
        }
    }
}
