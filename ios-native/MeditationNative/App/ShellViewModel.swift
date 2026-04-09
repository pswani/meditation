import Combine
import Foundation

@MainActor
final class ShellViewModel: ObservableObject {
    @Published private(set) var snapshot: AppSnapshot
    @Published private(set) var environment: AppEnvironment
    @Published private(set) var isSeedData: Bool

    private let repository: LocalAppSnapshotRepository

    init(
        repository: LocalAppSnapshotRepository = .live(
            environment: AppEnvironment.from()
        )
    ) {
        self.repository = repository

        do {
            let loadedSnapshot = try repository.loadOrSeed(seed: SampleData.snapshot)
            self.snapshot = loadedSnapshot
            self.isSeedData = loadedSnapshot == SampleData.snapshot
        } catch {
            self.snapshot = SampleData.snapshot
            self.isSeedData = true
        }

        self.environment = repository.environment
    }
}
