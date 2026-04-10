import Foundation

enum ShellSnapshotSupport {
    static func normalizedSnapshot(_ snapshot: AppSnapshot) -> AppSnapshot {
        var normalizedSnapshot = snapshot
        normalizedSnapshot.timerDraft = normalizedTimerDraft(snapshot.timerDraft)
        normalizedSnapshot.customPlays = snapshot.customPlays.map(normalizedCustomPlay)
        normalizedSnapshot.lastUsedPracticeTarget = normalizedLastUsedPracticeTarget(snapshot.lastUsedPracticeTarget)
        normalizedSnapshot.recentSessionLogs = snapshot.recentSessionLogs.sorted { $0.endedAt > $1.endedAt }
        normalizedSnapshot.summary = SummaryFeature.makeStoredSummarySnapshot(from: normalizedSnapshot.recentSessionLogs)
        if normalizedSnapshot.lastUsedPracticeTarget == nil {
            normalizedSnapshot.lastUsedPracticeTarget = deriveLastUsedPracticeTarget(from: normalizedSnapshot)
        }
        return normalizedSnapshot
    }

    static func makeTimerLastUsedTarget(
        from draft: TimerSettingsDraft,
        fallbackMeditationType: MeditationType?
    ) -> LastUsedPracticeTarget {
        let meditationType = draft.meditationType ?? fallbackMeditationType ?? .vipassana
        let title = draft.mode == .fixedDuration
            ? "\(draft.durationMinutes) min timer"
            : "Open-ended timer"

        return LastUsedPracticeTarget(
            kind: .timer,
            title: title,
            meditationType: meditationType,
            timerDraft: draft,
            updatedAt: Date()
        )
    }

    static func deriveLastUsedPracticeTarget(from snapshot: AppSnapshot) -> LastUsedPracticeTarget? {
        guard let latestLog = snapshot.recentSessionLogs.first else {
            return nil
        }

        switch latestLog.source {
        case .timer:
            let timerDraft = snapshot.timerDraft
            return LastUsedPracticeTarget(
                kind: .timer,
                title: timerDraft.mode == .fixedDuration ? "\(timerDraft.durationMinutes) min timer" : "Open-ended timer",
                meditationType: latestLog.meditationType,
                timerDraft: timerDraft,
                updatedAt: latestLog.endedAt
            )
        case .customPlay:
            let resolvedCustomPlay = resolvedCustomPlay(from: latestLog, snapshot: snapshot)
            guard let customPlay = resolvedCustomPlay else {
                return nil
            }

            return LastUsedPracticeTarget(
                kind: .customPlay,
                title: customPlay.name,
                meditationType: customPlay.meditationType,
                customPlayID: customPlay.id,
                updatedAt: latestLog.endedAt
            )
        case .playlist:
            let resolvedPlaylist = resolvedPlaylist(from: latestLog, snapshot: snapshot)
            guard let playlist = resolvedPlaylist else {
                return nil
            }

            return LastUsedPracticeTarget(
                kind: .playlist,
                title: playlist.name,
                meditationType: playlist.items.first?.meditationType ?? snapshot.timerDraft.meditationType ?? .vipassana,
                playlistID: playlist.id,
                updatedAt: latestLog.endedAt
            )
        case .manual:
            return nil
        }
    }

    private static func resolvedCustomPlay(from latestLog: SessionLog, snapshot: AppSnapshot) -> CustomPlay? {
        if let customPlayID = latestLog.context?.customPlayID {
            return snapshot.customPlays.first(where: { $0.id == customPlayID })
        }

        let candidateNames = [
            latestLog.context?.customPlayName,
            latestLog.notes?.trimmingCharacters(in: .whitespacesAndNewlines),
        ]
            .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { $0.isEmpty == false }

        return snapshot.customPlays.first { customPlay in
            candidateNames.contains(customPlay.name)
        }
    }

    private static func resolvedPlaylist(from latestLog: SessionLog, snapshot: AppSnapshot) -> Playlist? {
        if let playlistName = latestLog.context?.playlistName {
            return snapshot.playlists.first(where: { $0.name == playlistName })
        }

        guard let playlistName = playlistName(from: latestLog.notes) else {
            return nil
        }

        return snapshot.playlists.first(where: { $0.name == playlistName })
    }

    private static func playlistName(from notes: String?) -> String? {
        guard let notes else {
            return nil
        }

        let prefix = "Playlist: "
        let itemMarker = " • Item: "
        guard notes.hasPrefix(prefix),
              let itemRange = notes.range(of: itemMarker)
        else {
            return nil
        }

        let extractedName = String(notes[notes.index(notes.startIndex, offsetBy: prefix.count)..<itemRange.lowerBound])
            .trimmingCharacters(in: .whitespacesAndNewlines)

        return extractedName.isEmpty ? nil : extractedName
    }

    private static func normalizedTimerDraft(_ draft: TimerSettingsDraft) -> TimerSettingsDraft {
        var normalizedDraft = draft
        normalizedDraft.startSoundName = TimerSoundCatalog.normalizeSelection(draft.startSoundName)
        normalizedDraft.endSoundName = TimerSoundCatalog.normalizeSelection(draft.endSoundName)
        normalizedDraft.intervalSoundName = TimerSoundCatalog.normalizeSelection(draft.intervalSoundName)
        if normalizedDraft.intervalSoundName == nil {
            normalizedDraft.intervalMinutes = nil
        }
        return normalizedDraft
    }

    private static func normalizedCustomPlay(_ customPlay: CustomPlay) -> CustomPlay {
        var normalizedCustomPlay = customPlay
        normalizedCustomPlay.startSoundName = TimerSoundCatalog.normalizeSelection(customPlay.startSoundName)
        normalizedCustomPlay.endSoundName = TimerSoundCatalog.normalizeSelection(customPlay.endSoundName)
        normalizedCustomPlay.linkedMediaIdentifier = trimmedOrNil(customPlay.linkedMediaIdentifier)

        if let bundledSampleAsset = CustomPlayMediaAsset.resolve(identifier: normalizedCustomPlay.linkedMediaIdentifier) {
            normalizedCustomPlay.media = .bundledSample(bundledSampleAsset)
            normalizedCustomPlay.linkedMediaIdentifier = bundledSampleAsset.id
            if normalizedCustomPlay.durationSeconds <= 0 {
                normalizedCustomPlay.durationSeconds = bundledSampleAsset.durationSeconds
            }
            return normalizedCustomPlay
        }

        switch normalizedCustomPlay.media?.source {
        case .legacyPlaceholder:
            normalizedCustomPlay.media = nil
        case .bundledSample:
            if let bundledAsset = normalizedCustomPlay.media?.bundledAsset {
                normalizedCustomPlay.media = .bundledSample(bundledAsset)
                normalizedCustomPlay.linkedMediaIdentifier = normalizedCustomPlay.linkedMediaIdentifier ?? bundledAsset.id
            } else {
                normalizedCustomPlay.media = nil
            }
        case .remote:
            if let media = normalizedCustomPlay.media {
                normalizedCustomPlay.media = media.updatedIdentifier(normalizedCustomPlay.linkedMediaIdentifier ?? media.id)
                normalizedCustomPlay.linkedMediaIdentifier = normalizedCustomPlay.linkedMediaIdentifier ?? media.id
            }
        case nil:
            break
        }

        return normalizedCustomPlay
    }

    private static func normalizedLastUsedPracticeTarget(_ target: LastUsedPracticeTarget?) -> LastUsedPracticeTarget? {
        guard var target else {
            return nil
        }

        target.timerDraft = target.timerDraft.map(normalizedTimerDraft)
        return target
    }

    private static func trimmedOrNil(_ value: String?) -> String? {
        guard let trimmedValue = value?.trimmingCharacters(in: .whitespacesAndNewlines),
              trimmedValue.isEmpty == false
        else {
            return nil
        }

        return trimmedValue
    }
}
