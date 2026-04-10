import Foundation

struct ShellSyncPassResult {
    var snapshot: AppSnapshot
    var syncState: AppSyncState
}

enum ShellSyncPassRunner {
    static func run(
        syncClient: AppSyncClient,
        repository: LocalAppSnapshotRepository,
        snapshot: AppSnapshot,
        syncState: AppSyncState,
        timeZoneIdentifier: String
    ) async throws -> ShellSyncPassResult {
        var updatedSnapshot = snapshot
        var updatedSyncState = syncState

        let remoteState = try await syncClient.fetchRemoteState(
            localSnapshot: updatedSnapshot,
            timeZoneIdentifier: timeZoneIdentifier
        )
        updatedSnapshot = ShellSnapshotSupport.normalizedSnapshot(
            AppSyncFeature.reconcile(
                remoteState: remoteState,
                localSnapshot: updatedSnapshot,
                pendingMutations: updatedSyncState.pendingMutations
            )
        )
        if let summary = remoteState.summary {
            updatedSyncState.lastRemoteSummary = summary
        }
        try repository.save(updatedSnapshot)

        while let nextMutation = updatedSyncState.pendingMutations.first {
            let authoritativeState = try await syncClient.applyMutation(
                nextMutation,
                localSnapshot: updatedSnapshot,
                timeZoneIdentifier: timeZoneIdentifier
            )
            updatedSnapshot = ShellSnapshotSupport.normalizedSnapshot(
                AppSyncFeature.applyAuthoritativeMutationResult(
                    mutation: nextMutation,
                    remoteState: authoritativeState,
                    to: updatedSnapshot
                )
            )
            updatedSyncState.pendingMutations.removeFirst()
            updatedSyncState.lastRemoteSummary = authoritativeState.summary ?? updatedSyncState.lastRemoteSummary
            if let syncNoticeMessage = authoritativeState.syncNoticeMessage {
                updatedSyncState.lastNoticeMessage = syncNoticeMessage
            }
            try repository.save(updatedSnapshot)
        }

        updatedSyncState.lastSuccessfulSyncAt = Date()
        updatedSyncState.lastErrorMessage = nil
        updatedSyncState.connectionState = .upToDate

        return ShellSyncPassResult(snapshot: updatedSnapshot, syncState: updatedSyncState)
    }
}
