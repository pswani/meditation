import Foundation
import Testing
@testable import MeditationNativeCore

@Test func sampleSnapshotSeedsAllPrimaryDestinations() throws {
    #expect(ReferenceData.primaryDestinations.count == 5)
    #expect(SampleData.snapshot.recentSessionLogs.isEmpty == false)
    #expect(SampleData.snapshot.customPlays.isEmpty == false)
    #expect(SampleData.snapshot.playlists.isEmpty == false)
    #expect(SampleData.snapshot.sankalpas.isEmpty == false)
}

@Test func summarySeedIncludesOverallAndTypeRows() throws {
    #expect(SampleData.snapshot.summary.overallRows.count >= 2)
    #expect(SampleData.snapshot.summary.byMeditationTypeRows.count >= 2)
    #expect(SampleData.snapshot.summary.byTimeOfDayRows.count >= 2)
}
