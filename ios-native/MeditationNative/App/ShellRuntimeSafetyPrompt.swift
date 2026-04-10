import SwiftUI

enum RuntimeSafetyPrompt: Equatable, Identifiable {
    case endTimer(mode: TimerSettingsDraft.Mode)
    case endCustomPlay(name: String)
    case endPlaylist(name: String)
    case archiveSankalpa(title: String, sankalpaID: UUID)
    case deleteArchivedSankalpa(title: String, sankalpaID: UUID)
    case deleteCustomPlay(name: String, customPlayID: UUID)
    case deletePlaylist(name: String, playlistID: UUID)

    var id: String {
        switch self {
        case .endTimer(let mode):
            return "end-timer-\(mode.rawValue)"
        case .endCustomPlay(let name):
            return "end-custom-play-\(name)"
        case .endPlaylist(let name):
            return "end-playlist-\(name)"
        case .archiveSankalpa(_, let sankalpaID):
            return "archive-sankalpa-\(sankalpaID.uuidString)"
        case .deleteArchivedSankalpa(_, let sankalpaID):
            return "delete-archived-sankalpa-\(sankalpaID.uuidString)"
        case .deleteCustomPlay(_, let customPlayID):
            return "delete-custom-play-\(customPlayID.uuidString)"
        case .deletePlaylist(_, let playlistID):
            return "delete-playlist-\(playlistID.uuidString)"
        }
    }

    var title: String {
        switch self {
        case .endTimer(let mode):
            return mode == .fixedDuration ? "End timer early?" : "End session?"
        case .endCustomPlay:
            return "End custom play?"
        case .endPlaylist:
            return "End playlist?"
        case .archiveSankalpa:
            return "Archive sankalpa?"
        case .deleteArchivedSankalpa:
            return "Delete archived sankalpa?"
        case .deleteCustomPlay:
            return "Delete custom play?"
        case .deletePlaylist:
            return "Delete playlist?"
        }
    }

    var message: String {
        switch self {
        case .endTimer(let mode):
            if mode == .fixedDuration {
                return "This ends the fixed-duration session now and saves an ended-early session log."
            }

            return "This ends the open-ended session now and saves the session log."
        case .endCustomPlay(let name):
            return "This stops \"\(name)\" now and saves the session log."
        case .endPlaylist(let name):
            return "This stops \"\(name)\" now and saves the current item log if needed."
        case .archiveSankalpa(let title, _):
            return "This moves \"\(title)\" out of the active path while keeping its progress visible."
        case .deleteArchivedSankalpa(let title, _):
            return "This permanently removes the archived sankalpa \"\(title)\" from this device."
        case .deleteCustomPlay(let name, _):
            return "This removes the saved custom play \"\(name)\" from this device."
        case .deletePlaylist(let name, _):
            return "This removes the saved playlist \"\(name)\" from this device."
        }
    }

    var confirmButtonTitle: String {
        switch self {
        case .endTimer, .endCustomPlay, .endPlaylist:
            return "End"
        case .archiveSankalpa:
            return "Archive"
        case .deleteArchivedSankalpa, .deleteCustomPlay, .deletePlaylist:
            return "Delete"
        }
    }

    var confirmButtonRole: ButtonRole? {
        switch self {
        case .deleteArchivedSankalpa, .deleteCustomPlay, .deletePlaylist:
            return .destructive
        case .endTimer, .endCustomPlay, .endPlaylist, .archiveSankalpa:
            return nil
        }
    }
}
