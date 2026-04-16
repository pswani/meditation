import Foundation

enum ShellViewModelPresentation {
    static func syncBannerMessage(for syncState: AppSyncState) -> String? {
        switch syncState.connectionState {
        case .localOnly:
            if syncState.pendingMutationCount > 0 {
                return syncState.pendingMutationCount == 1
                    ? "This iPhone is in local-only mode. 1 saved change will stay on this device until a backend base URL is configured."
                    : "This iPhone is in local-only mode. \(syncState.pendingMutationCount) saved changes will stay on this device until a backend base URL is configured."
            }
            return "This iPhone is running in intentional local-only mode."
        case .syncing:
            return "Syncing with the configured backend."
        case .upToDate:
            return syncState.lastNoticeMessage
        case .pendingSync:
            let count = syncState.pendingMutationCount
            guard count > 0 else {
                return nil
            }
            return count == 1 ? "1 local change is pending sync." : "\(count) local changes are pending sync."
        case .offline:
            let count = syncState.pendingMutationCount
            if count > 0 {
                return count == 1
                    ? "Offline. 1 local change will sync when the connection returns."
                    : "Offline. \(count) local changes will sync when the connection returns."
            }
            return "Offline. Showing the latest saved local state."
        case .backendUnavailable:
            let count = syncState.pendingMutationCount
            if count > 0 {
                return count == 1
                    ? "Backend unavailable. 1 local change will sync when the API is reachable."
                    : "Backend unavailable. \(count) local changes will sync when the API is reachable."
            }
            return "Backend unavailable. Showing the latest saved local state."
        case .invalidBackendResponse:
            let count = syncState.pendingMutationCount
            if count > 0 {
                return count == 1
                    ? "Backend response invalid. 1 local change will stay queued until the backend contract is corrected."
                    : "Backend response invalid. \(count) local changes will stay queued until the backend contract is corrected."
            }
            return "Backend response invalid. Showing the latest saved local state."
        }
    }

    static func syncStatusHeadline(for syncState: AppSyncState) -> String {
        switch syncState.connectionState {
        case .localOnly:
            return "Local-only mode"
        case .syncing:
            return "Syncing"
        case .upToDate:
            return "Backend synced"
        case .pendingSync:
            return "Pending sync"
        case .offline:
            return "Offline"
        case .backendUnavailable:
            return "Backend unavailable"
        case .invalidBackendResponse:
            return "Backend response invalid"
        }
    }

    static func syncStatusDetail(for syncState: AppSyncState, now: Date) -> String {
        let pendingCount = syncState.pendingMutationCount
        switch syncState.connectionState {
        case .localOnly:
            if pendingCount > 0 {
                return "This profile is working intentionally on-device only right now. Save a backend base URL below when you want saved changes to replay to a backend."
            }
            return "This iPhone is working in local-only mode. Save a backend base URL below when you want backend sync."
        case .syncing:
            return "The app is refreshing backend-backed timer settings, session logs, custom plays, playlists, sankalpas, and summary data."
        case .upToDate:
            if let lastSuccessfulSyncAt = syncState.lastSuccessfulSyncAt {
                return "Last successful sync: \(RelativeDateTimeFormatter().localizedString(for: lastSuccessfulSyncAt, relativeTo: now))."
            }
            return "Local-first data is aligned with the configured backend."
        case .pendingSync:
            return pendingCount == 1
                ? "1 local change is queued safely on this device and will replay next time the backend is reachable."
                : "\(pendingCount) local changes are queued safely on this device and will replay next time the backend is reachable."
        case .offline:
            return "The device appears offline. Local-first changes stay visible here and will replay when connectivity returns."
        case .backendUnavailable:
            return "The device is online, but the configured backend could not be reached. Local-first changes stay visible here in the meantime."
        case .invalidBackendResponse:
            return "The device reached the configured backend, but one or more API responses did not match the app's expected contract. Local-first changes stay visible here in the meantime."
        }
    }

    static func sortedCustomPlays(from customPlays: [CustomPlay]) -> [CustomPlay] {
        customPlays.sorted(by: sortCustomPlays)
    }

    static func sortedPlaylists(from playlists: [Playlist]) -> [Playlist] {
        playlists.sorted(by: sortPlaylists)
    }

    static func homeQuickStartSummary(for timerDraft: TimerSettingsDraft) -> String {
        let meditationType = timerDraft.meditationType?.rawValue ?? "Choose a meditation type"
        if timerDraft.mode == .fixedDuration {
            return "\(timerDraft.durationMinutes) min fixed-duration • \(meditationType)"
        }

        return "Open-ended • \(meditationType)"
    }

    static func lastUsedPracticeSummary(for target: LastUsedPracticeTarget?) -> String? {
        guard let target else {
            return nil
        }

        switch target.kind {
        case .timer:
            if let timerDraft = target.timerDraft {
                let meditationType = timerDraft.meditationType?.rawValue ?? target.meditationType.rawValue
                if timerDraft.mode == .fixedDuration {
                    return "\(target.title) • \(timerDraft.durationMinutes) min • \(meditationType)"
                }

                return "\(target.title) • Open-ended • \(meditationType)"
            }

            return "\(target.title) • \(target.meditationType.rawValue)"
        case .customPlay, .playlist:
            return "\(target.title) • \(target.meditationType.rawValue)"
        }
    }

    static func canStartCustomPlay(
        canResolvePlayback: Bool,
        hasActivePracticeRuntime: Bool
    ) -> Bool {
        canResolvePlayback && hasActivePracticeRuntime == false
    }

    static func customPlayStartSupportMessage(
        canResolvePlayback: Bool,
        hasActivePracticeRuntime: Bool
    ) -> String? {
        if canResolvePlayback == false {
            return "Needs available recording media before it can start."
        }

        _ = hasActivePracticeRuntime
        return nil
    }

    static func canChangeHistoryMeditationType(for log: SessionLog) -> Bool {
        log.source == .manual
    }

    static func activeTimerPrimaryText(for activeSession: ActiveTimerSession?, now: Date) -> String {
        guard let activeSession else {
            return "00:00"
        }

        if let remainingSeconds = activeSession.remainingSeconds(at: now) {
            return formatClock(remainingSeconds)
        }

        return formatClock(activeSession.elapsedSeconds(at: now))
    }

    static func activeTimerSecondaryText(for activeSession: ActiveTimerSession?, now: Date) -> String {
        guard let activeSession else {
            return ""
        }

        if activeSession.configuration.mode == .fixedDuration {
            return "Elapsed \(formatClock(activeSession.elapsedSeconds(at: now)))"
        }

        return "Open-ended practice"
    }

    static func activeCustomPlayPrimaryText(for activeSession: ActiveCustomPlaySession?, now: Date) -> String {
        guard let activeSession else {
            return "00:00"
        }

        return formatClock(activeSession.remainingSeconds(at: now))
    }

    static func activeCustomPlaySecondaryText(for activeSession: ActiveCustomPlaySession?, now: Date) -> String {
        guard let activeSession else {
            return ""
        }

        return "Elapsed \(formatClock(activeSession.elapsedSeconds(at: now)))"
    }

    static func activePlaylistPrimaryText(for activeSession: ActivePlaylistSession?, now: Date) -> String {
        guard let activeSession else {
            return "00:00"
        }

        return formatClock(activeSession.remainingSecondsInPhase(at: now))
    }

    static func activePlaylistTitle(for activeSession: ActivePlaylistSession?) -> String {
        guard let activeSession else {
            return ""
        }

        switch activeSession.phase {
        case .item(let index):
            let itemCount = activeSession.playlist.items.count
            let itemTitle = activeSession.currentItem?.title ?? "Current item"
            return "Item \(index + 1) of \(itemCount): \(itemTitle)"
        case .gap:
            return "Small gap"
        }
    }

    static func activePlaylistSecondaryText(for activeSession: ActivePlaylistSession?) -> String {
        guard let activeSession else {
            return ""
        }

        switch activeSession.phase {
        case .item:
            if let upcomingItem = activeSession.upcomingItem {
                return "Next: \(upcomingItem.title)"
            }
            return "Final item in this playlist"
        case .gap:
            if let upcomingItem = activeSession.upcomingItem {
                return "Up next: \(upcomingItem.title)"
            }
            return "Preparing the next item"
        }
    }

    private static func sortCustomPlays(_ lhs: CustomPlay, _ rhs: CustomPlay) -> Bool {
        if lhs.isFavorite != rhs.isFavorite {
            return lhs.isFavorite && rhs.isFavorite == false
        }

        return lhs.name.localizedCaseInsensitiveCompare(rhs.name) == .orderedAscending
    }

    private static func sortPlaylists(_ lhs: Playlist, _ rhs: Playlist) -> Bool {
        if lhs.isFavorite != rhs.isFavorite {
            return lhs.isFavorite && rhs.isFavorite == false
        }

        return lhs.name.localizedCaseInsensitiveCompare(rhs.name) == .orderedAscending
    }

    private static func formatClock(_ totalSeconds: Int) -> String {
        let hours = totalSeconds / 3_600
        let minutes = (totalSeconds % 3_600) / 60
        let seconds = totalSeconds % 60

        if hours > 0 {
            return String(format: "%02d:%02d:%02d", hours, minutes, seconds)
        }

        return String(format: "%02d:%02d", minutes, seconds)
    }
}
