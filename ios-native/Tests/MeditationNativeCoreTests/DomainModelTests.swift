import Foundation
import Testing
@testable import MeditationNative

@Test func meditationTypesMatchProductVocabulary() throws {
    #expect(ReferenceData.meditationTypes.map(\.rawValue) == [
        "Vipassana",
        "Ajapa",
        "Tratak",
        "Kriya",
        "Sahaj",
    ])
}

@Test func playlistTotalDurationIncludesGaps() throws {
    let playlist = Playlist(
        name: "Morning",
        items: [
            PlaylistItem(title: "Sit", kind: .timer, durationSeconds: 600),
            PlaylistItem(title: "Rest", kind: .customPlay, durationSeconds: 300),
            PlaylistItem(title: "Close", kind: .timer, durationSeconds: 120),
        ],
        gapSeconds: 30
    )

    #expect(playlist.totalDurationSeconds == 1_080)
}

@Test func localEnvironmentDoesNotRequireBackend() throws {
    let environment = AppEnvironment.localOnly

    #expect(environment.apiBaseURL == nil)
    #expect(environment.requiresBackend == false)
}
