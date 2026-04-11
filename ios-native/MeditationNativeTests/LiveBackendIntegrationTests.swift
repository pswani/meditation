import Foundation
import XCTest
@testable import MeditationNative

final class LiveBackendIntegrationTests: XCTestCase {
    func testFetchRemoteStateAgainstConfiguredLiveBackend() async throws {
        guard let baseURLString = ProcessInfo.processInfo.environment["MEDITATION_NATIVE_LIVE_SYNC_BASE_URL"],
              baseURLString.isEmpty == false
        else {
            throw XCTSkip("Set MEDITATION_NATIVE_LIVE_SYNC_BASE_URL to run live backend integration.")
        }

        let baseURL = try XCTUnwrap(URL(string: baseURLString))
        let session = URLSession(configuration: .ephemeral)
        let client = LiveAppSyncClient(baseURL: baseURL, session: session)

        let remoteState = try await client.fetchRemoteState(
            localSnapshot: SampleData.snapshot,
            timeZoneIdentifier: "America/Chicago"
        )

        XCTAssertGreaterThan(remoteState.snapshot.timerDraft.durationMinutes, 0)
        XCTAssertNotNil(remoteState.snapshot.timerDraft.meditationType)
        XCTAssertFalse(remoteState.snapshot.summary.overallRows.isEmpty)
        XCTAssertNotNil(remoteState.summary)
    }
}
