import SwiftUI

@main
struct MeditationNativeApp: App {
    @StateObject private var viewModel: ShellViewModel

    init() {
        Self.resetPersistentStateIfNeeded()
        _viewModel = StateObject(wrappedValue: ShellViewModel())
    }

    var body: some Scene {
        WindowGroup {
            ShellRootView(viewModel: viewModel)
        }
    }

    private static func resetPersistentStateIfNeeded() {
        guard ProcessInfo.processInfo.environment["MEDITATION_UI_TEST_RESET"] == "1" else {
            return
        }

        let fileManager = FileManager.default
        let applicationSupportDirectory = fileManager.urls(
            for: .applicationSupportDirectory,
            in: .userDomainMask
        ).first ?? fileManager.temporaryDirectory
        let meditationDirectory = applicationSupportDirectory
            .appendingPathComponent("MeditationNative", isDirectory: true)

        try? fileManager.removeItem(at: meditationDirectory.appendingPathComponent("foundation-snapshot.json"))
        try? fileManager.removeItem(at: meditationDirectory.appendingPathComponent("sync-state.json"))
    }
}
