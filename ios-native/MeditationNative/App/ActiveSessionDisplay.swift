import Observation
import SwiftUI

/// Publishes only the display-layer properties of an active practice session.
/// Separating this from ShellViewModel prevents all ViewModel observers from
/// re-rendering on every timer tick — only views that observe this object will
/// update at tick frequency.
@Observable
final class ActiveSessionDisplay {
    // MARK: - Timer

    var timerPrimaryText: String = "00:00"
    var timerSecondaryText: String = ""
    var timerIsPaused: Bool = false
    var timerIsOpenEnded: Bool = false

    // MARK: - Custom Play

    var customPlayPrimaryText: String = "00:00"
    var customPlaySecondaryText: String = ""
    var customPlayIsPaused: Bool = false
    var customPlayName: String = ""
    var customPlaySoundSummaryText: String = ""
    var customPlayRecordingLabel: String?
    var customPlayLinkedMediaIdentifier: String?
    var customPlayMediaLabel: String?
    var customPlayMediaSourceSummary: String?
    var customPlayCanResolvePlayback: Bool = false

    // MARK: - Playlist

    var playlistPrimaryText: String = "00:00"
    var playlistTitle: String = ""
    var playlistSecondaryText: String = ""
    var playlistIsPaused: Bool = false
    var playlistUpcomingItemTitle: String?
}
