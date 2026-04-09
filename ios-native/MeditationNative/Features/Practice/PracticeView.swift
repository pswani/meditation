import SwiftUI

struct PracticeView: View {
    @ObservedObject var viewModel: ShellViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Practice")
                    .font(.largeTitle.weight(.semibold))

                if viewModel.activeSession != nil {
                    activeTimerSection
                } else if viewModel.activeCustomPlaySession != nil {
                    activeCustomPlaySection
                } else if viewModel.activePlaylistSession != nil {
                    activePlaylistSection
                } else {
                    timerSetupSection
                    customPlayLibrarySection
                    playlistLibrarySection
                }

                if let timerValidationMessage = viewModel.timerValidationMessage {
                    messageText(timerValidationMessage, color: .red)
                }

                if let practiceRuntimeMessage = viewModel.practiceRuntimeMessage {
                    messageText(practiceRuntimeMessage, color: .secondary)
                }

                if let persistenceMessage = viewModel.persistenceMessage {
                    messageText(persistenceMessage, color: .secondary)
                }
            }
            .padding()
        }
        .navigationTitle("Practice")
    }

    private var activeTimerSection: some View {
        SectionCard(title: "Active timer", caption: "Keep the session calm and uninterrupted") {
            VStack(alignment: .leading, spacing: 16) {
                Text(viewModel.activeTimerPrimaryText())
                    .font(.system(size: 52, weight: .semibold, design: .rounded))
                    .monospacedDigit()

                Text(viewModel.activeTimerSecondaryText())
                    .foregroundStyle(.secondary)

                HStack(spacing: 12) {
                    if viewModel.activeSession?.isPaused == true {
                        Button("Resume") {
                            viewModel.resumeTimer()
                        }
                        .buttonStyle(.borderedProminent)
                    } else {
                        Button("Pause") {
                            viewModel.pauseTimer()
                        }
                        .buttonStyle(.bordered)
                    }

                    Button(timerEndButtonTitle) {
                        viewModel.endTimerManually()
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.teal)
                }

                Text(timerCaption)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var activeCustomPlaySection: some View {
        SectionCard(title: "Active custom play", caption: "Bundled placeholder audio is looping locally") {
            VStack(alignment: .leading, spacing: 16) {
                Text(viewModel.activeCustomPlaySession?.customPlay.name ?? "Custom play")
                    .font(.title3.weight(.semibold))

                Text(viewModel.activeCustomPlayPrimaryText())
                    .font(.system(size: 52, weight: .semibold, design: .rounded))
                    .monospacedDigit()

                Text(viewModel.activeCustomPlaySecondaryText())
                    .foregroundStyle(.secondary)

                HStack(spacing: 12) {
                    if viewModel.activeCustomPlaySession?.isPaused == true {
                        Button("Resume") {
                            viewModel.resumeCustomPlay()
                        }
                        .buttonStyle(.borderedProminent)
                    } else {
                        Button("Pause") {
                            viewModel.pauseCustomPlay()
                        }
                        .buttonStyle(.bordered)
                    }

                    Button("End session") {
                        viewModel.endCustomPlayManually()
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.teal)
                }

                Text("This milestone uses calm bundled placeholder audio so custom plays stay local-first on simulator and device without widening into media import yet.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var activePlaylistSection: some View {
        SectionCard(title: "Active playlist", caption: "Each item logs explicitly while gaps stay silent") {
            VStack(alignment: .leading, spacing: 16) {
                Text(viewModel.activePlaylistTitle())
                    .font(.title3.weight(.semibold))

                Text(viewModel.activePlaylistPrimaryText())
                    .font(.system(size: 52, weight: .semibold, design: .rounded))
                    .monospacedDigit()

                Text(viewModel.activePlaylistSecondaryText())
                    .foregroundStyle(.secondary)

                HStack(spacing: 12) {
                    if viewModel.activePlaylistSession?.isPaused == true {
                        Button("Resume") {
                            viewModel.resumePlaylist()
                        }
                        .buttonStyle(.borderedProminent)
                    } else {
                        Button("Pause") {
                            viewModel.pausePlaylist()
                        }
                        .buttonStyle(.bordered)
                    }

                    Button("End playlist") {
                        viewModel.endPlaylistManually()
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.teal)
                }

                if let upcomingItem = viewModel.activePlaylistSession?.upcomingItem {
                    Text("Upcoming: \(upcomingItem.title)")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private var timerSetupSection: some View {
        Group {
            TimerDraftForm(
                draft: viewModel.timerDraftBinding,
                headline: "Timer setup"
            )

            Button("Start session") {
                viewModel.startTimer()
            }
            .buttonStyle(.borderedProminent)
            .tint(.teal)

            Text("Fixed-duration stays the default. Open-ended practice remains available when you want to sit without a planned finish.")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
    }

    private var customPlayLibrarySection: some View {
        SectionCard(title: "Custom plays", caption: "Create, favorite, and start prerecorded-style local sessions") {
            VStack(alignment: .leading, spacing: 12) {
                if let featuredCustomPlay = viewModel.customPlays.first {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(featuredCustomPlay.name)
                            .font(.headline)
                        Text("\(featuredCustomPlay.meditationType.rawValue) • \(featuredCustomPlay.durationSeconds / 60) min")
                            .foregroundStyle(.secondary)
                        Text(featuredCustomPlay.media == nil ? "Needs bundled placeholder audio before it can start." : "Ready to play locally on this device.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }

                    if featuredCustomPlay.media != nil {
                        Button("Start featured custom play") {
                            viewModel.startCustomPlay(featuredCustomPlay)
                        }
                        .buttonStyle(.bordered)
                    }
                } else {
                    Text("No custom plays yet. Add one with a bundled placeholder track so you can start it quickly from Practice.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                NavigationLink {
                    CustomPlayLibraryView(viewModel: viewModel)
                } label: {
                    Label("Open custom play library", systemImage: "music.note.list")
                        .font(.body.weight(.medium))
                }
            }
        }
    }

    private var playlistLibrarySection: some View {
        SectionCard(title: "Playlists", caption: "Sequence timer items and custom plays in a calm order") {
            VStack(alignment: .leading, spacing: 12) {
                if let featuredPlaylist = viewModel.playlists.first {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(featuredPlaylist.name)
                            .font(.headline)
                        Text("\(featuredPlaylist.items.count) items • \(featuredPlaylist.totalDurationSeconds / 60) min total")
                            .foregroundStyle(.secondary)
                        Text(featuredPlaylist.gapSeconds > 0 ? "Includes \(featuredPlaylist.gapSeconds)-second small gaps between items." : "Runs items back to back with no gap.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }

                    Button("Start featured playlist") {
                        viewModel.startPlaylist(featuredPlaylist)
                    }
                    .buttonStyle(.bordered)
                } else {
                    Text("No playlists yet. Build one from timer items and saved custom plays when you want an ordered practice flow.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                NavigationLink {
                    PlaylistLibraryView(viewModel: viewModel)
                } label: {
                    Label("Open playlist library", systemImage: "list.bullet.rectangle")
                        .font(.body.weight(.medium))
                }
            }
        }
    }

    private var timerEndButtonTitle: String {
        if viewModel.activeSession?.configuration.mode == .fixedDuration {
            return "End early"
        }

        return "End session"
    }

    private var timerCaption: String {
        if viewModel.activeSession?.configuration.mode == .fixedDuration {
            return "Notifications can support fixed-session completion when permission is granted, but the timer display here remains the source of truth while the app is open."
        }

        return "Open-ended sessions log the actual practiced duration when you choose to end the sit."
    }

    private func messageText(_ message: String, color: Color) -> some View {
        Text(message)
            .font(.footnote)
            .foregroundStyle(color)
    }
}

private struct CustomPlayLibraryView: View {
    @ObservedObject var viewModel: ShellViewModel
    @State private var isPresentingEditor = false
    @State private var draft = CustomPlayDraft()

    var body: some View {
        List {
            if viewModel.customPlays.isEmpty {
                Section {
                    Text("No custom plays yet. Add one with bundled placeholder audio so playback stays local-first.")
                        .foregroundStyle(.secondary)
                }
            } else {
                Section {
                    ForEach(viewModel.customPlays) { customPlay in
                        VStack(alignment: .leading, spacing: 10) {
                            HStack(alignment: .top) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(customPlay.name)
                                        .font(.headline)
                                    Text("\(customPlay.meditationType.rawValue) • \(customPlay.durationSeconds / 60) min")
                                        .font(.footnote)
                                        .foregroundStyle(.secondary)
                                    Text(customPlay.media?.asset.rawValue ?? "Needs bundled placeholder audio")
                                        .font(.footnote)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                if customPlay.isFavorite {
                                    Image(systemName: "star.fill")
                                        .foregroundStyle(.yellow)
                                }
                            }

                            HStack {
                                Button("Start") {
                                    viewModel.startCustomPlay(customPlay)
                                }
                                .buttonStyle(.borderedProminent)
                                .tint(.teal)
                                .disabled(customPlay.media == nil)

                                Button("Edit") {
                                    viewModel.customPlayValidationMessage = nil
                                    draft = CustomPlayFeature.makeDraft(from: customPlay)
                                    isPresentingEditor = true
                                }
                                .buttonStyle(.bordered)

                                Button(customPlay.isFavorite ? "Unfavorite" : "Favorite") {
                                    viewModel.toggleFavorite(for: customPlay)
                                }
                                .buttonStyle(.bordered)

                                Button("Delete", role: .destructive) {
                                    viewModel.deleteCustomPlay(customPlay)
                                }
                                .buttonStyle(.bordered)
                            }
                            .font(.footnote)
                        }
                        .padding(.vertical, 4)
                    }
                }
            }

            if let practiceRuntimeMessage = viewModel.practiceRuntimeMessage {
                Section {
                    Text(practiceRuntimeMessage)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .navigationTitle("Custom plays")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Add") {
                    viewModel.customPlayValidationMessage = nil
                    draft = CustomPlayDraft()
                    isPresentingEditor = true
                }
            }
        }
        .sheet(isPresented: $isPresentingEditor) {
            NavigationStack {
                CustomPlayEditorView(
                    viewModel: viewModel,
                    draft: $draft
                )
            }
        }
    }
}

private struct CustomPlayEditorView: View {
    @ObservedObject var viewModel: ShellViewModel
    @Binding var draft: CustomPlayDraft
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        Form {
            Section("Details") {
                TextField("Name", text: $draft.name)

                Picker("Meditation type", selection: $draft.meditationType) {
                    Text("Choose").tag(MeditationType?.none)
                    ForEach(ReferenceData.meditationTypes, id: \.self) { meditationType in
                        Text(meditationType.rawValue).tag(Optional(meditationType))
                    }
                }

                Stepper(value: $draft.durationMinutes, in: 1 ... 240) {
                    HStack {
                        Text("Duration")
                        Spacer()
                        Text("\(draft.durationMinutes) min")
                            .foregroundStyle(.secondary)
                    }
                }

                Picker("Bundled audio", selection: $draft.mediaAsset) {
                    Text("Choose").tag(CustomPlayMediaAsset?.none)
                    ForEach(ReferenceData.customPlayMediaAssets, id: \.self) { mediaAsset in
                        Text(mediaAsset.rawValue).tag(Optional(mediaAsset))
                    }
                }

                Toggle("Favorite", isOn: $draft.isFavorite)
            }

            Section("Local media guidance") {
                Text("Milestone 3 uses bundled placeholder tracks so custom plays stay runnable in simulator and on device without widening into import yet.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            if let customPlayValidationMessage = viewModel.customPlayValidationMessage {
                Section {
                    Text(customPlayValidationMessage)
                        .font(.footnote)
                        .foregroundStyle(.red)
                }
            }
        }
        .navigationTitle(draft.id == nil ? "New custom play" : "Edit custom play")
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Cancel") {
                    dismiss()
                }
            }
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") {
                    if viewModel.saveCustomPlay(draft) {
                        dismiss()
                    }
                }
            }
        }
    }
}

private struct PlaylistLibraryView: View {
    @ObservedObject var viewModel: ShellViewModel
    @State private var isPresentingEditor = false
    @State private var draft = PlaylistDraft()

    var body: some View {
        List {
            if viewModel.playlists.isEmpty {
                Section {
                    Text("No playlists yet. Add timer items and saved custom plays when you want an ordered practice flow.")
                        .foregroundStyle(.secondary)
                }
            } else {
                Section {
                    ForEach(viewModel.playlists) { playlist in
                        VStack(alignment: .leading, spacing: 10) {
                            HStack(alignment: .top) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(playlist.name)
                                        .font(.headline)
                                    Text("\(playlist.items.count) items • \(playlist.totalDurationSeconds / 60) min")
                                        .font(.footnote)
                                        .foregroundStyle(.secondary)
                                    Text(playlist.gapSeconds > 0 ? "Gap: \(playlist.gapSeconds) sec" : "No gap between items")
                                        .font(.footnote)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                if playlist.isFavorite {
                                    Image(systemName: "star.fill")
                                        .foregroundStyle(.yellow)
                                }
                            }

                            HStack {
                                Button("Start") {
                                    viewModel.startPlaylist(playlist)
                                }
                                .buttonStyle(.borderedProminent)
                                .tint(.teal)

                                Button("Edit") {
                                    viewModel.playlistValidationMessage = nil
                                    draft = PlaylistFeature.makeDraft(from: playlist)
                                    isPresentingEditor = true
                                }
                                .buttonStyle(.bordered)

                                Button(playlist.isFavorite ? "Unfavorite" : "Favorite") {
                                    viewModel.toggleFavorite(for: playlist)
                                }
                                .buttonStyle(.bordered)

                                Button("Delete", role: .destructive) {
                                    viewModel.deletePlaylist(playlist)
                                }
                                .buttonStyle(.bordered)
                            }
                            .font(.footnote)
                        }
                        .padding(.vertical, 4)
                    }
                }
            }

            if let practiceRuntimeMessage = viewModel.practiceRuntimeMessage {
                Section {
                    Text(practiceRuntimeMessage)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .navigationTitle("Playlists")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Add") {
                    viewModel.playlistValidationMessage = nil
                    draft = PlaylistDraft()
                    isPresentingEditor = true
                }
            }
        }
        .sheet(isPresented: $isPresentingEditor) {
            NavigationStack {
                PlaylistEditorView(
                    viewModel: viewModel,
                    draft: $draft
                )
            }
        }
    }
}

private struct PlaylistEditorView: View {
    @ObservedObject var viewModel: ShellViewModel
    @Binding var draft: PlaylistDraft
    @Environment(\.dismiss) private var dismiss
    @State private var isPresentingItemEditor = false
    @State private var itemDraft = PlaylistDraftItem()

    var body: some View {
        Form {
            Section("Details") {
                TextField("Playlist name", text: $draft.name)

                Stepper(value: $draft.gapSeconds, in: 0 ... 120, step: 15) {
                    HStack {
                        Text("Small gap")
                        Spacer()
                        Text(draft.gapSeconds == 0 ? "None" : "\(draft.gapSeconds) sec")
                            .foregroundStyle(.secondary)
                    }
                }

                Toggle("Favorite", isOn: $draft.isFavorite)
            }

            Section("Items") {
                if draft.items.isEmpty {
                    Text("Add at least 1 timer or custom play item.")
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(Array(draft.items.enumerated()), id: \.element.id) { index, item in
                        VStack(alignment: .leading, spacing: 8) {
                            Text(item.title.isEmpty ? item.kind.rawValue : item.title)
                                .font(.headline)
                            Text(itemSummary(item))
                                .font(.footnote)
                                .foregroundStyle(.secondary)

                            HStack {
                                Button("Up") {
                                    moveItem(from: index, to: index - 1)
                                }
                                .buttonStyle(.bordered)
                                .disabled(index == 0)

                                Button("Down") {
                                    moveItem(from: index, to: index + 1)
                                }
                                .buttonStyle(.bordered)
                                .disabled(index == draft.items.count - 1)

                                Button("Remove", role: .destructive) {
                                    draft.items.removeAll { $0.id == item.id }
                                }
                                .buttonStyle(.bordered)
                            }
                            .font(.footnote)
                        }
                        .padding(.vertical, 4)
                    }
                }
            }

            Section("Add item") {
                Button("Add timer item") {
                    itemDraft = PlaylistDraftItem(
                        kind: .timer,
                        durationMinutes: 10,
                        meditationType: viewModel.snapshot.timerDraft.meditationType ?? .vipassana
                    )
                    isPresentingItemEditor = true
                }

                Button("Add custom play item") {
                    let preferredCustomPlay = viewModel.customPlays.first
                    itemDraft = PlaylistDraftItem(
                        title: preferredCustomPlay?.name ?? "",
                        kind: .customPlay,
                        durationMinutes: max(1, (preferredCustomPlay?.durationSeconds ?? 600) / 60),
                        meditationType: preferredCustomPlay?.meditationType,
                        customPlayID: preferredCustomPlay?.id
                    )
                    isPresentingItemEditor = true
                }
                .disabled(viewModel.customPlays.isEmpty)

                if viewModel.customPlays.isEmpty {
                    Text("Save at least 1 custom play before adding a linked custom-play item.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }

            if let playlistValidationMessage = viewModel.playlistValidationMessage {
                Section {
                    Text(playlistValidationMessage)
                        .font(.footnote)
                        .foregroundStyle(.red)
                }
            }
        }
        .navigationTitle(draft.id == nil ? "New playlist" : "Edit playlist")
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Cancel") {
                    dismiss()
                }
            }
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") {
                    if viewModel.savePlaylist(draft) {
                        dismiss()
                    }
                }
            }
        }
        .sheet(isPresented: $isPresentingItemEditor) {
            NavigationStack {
                PlaylistItemEditorView(
                    availableCustomPlays: viewModel.customPlays,
                    draft: $itemDraft
                ) { savedItem in
                    draft.items.append(savedItem)
                }
            }
        }
    }

    private func moveItem(from sourceIndex: Int, to destinationIndex: Int) {
        guard draft.items.indices.contains(sourceIndex),
              draft.items.indices.contains(destinationIndex)
        else {
            return
        }

        let item = draft.items.remove(at: sourceIndex)
        draft.items.insert(item, at: destinationIndex)
    }

    private func itemSummary(_ item: PlaylistDraftItem) -> String {
        switch item.kind {
        case .timer:
            let meditationTypeLabel = item.meditationType?.rawValue ?? "Choose type"
            return "Timer • \(meditationTypeLabel) • \(item.durationMinutes) min"
        case .customPlay:
            let meditationTypeLabel = item.meditationType?.rawValue ?? "Linked custom play"
            return "Custom play • \(meditationTypeLabel) • \(item.durationMinutes) min"
        }
    }
}

private struct PlaylistItemEditorView: View {
    let availableCustomPlays: [CustomPlay]
    @Binding var draft: PlaylistDraftItem
    let onSave: (PlaylistDraftItem) -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        Form {
            Section("Item kind") {
                Picker("Kind", selection: $draft.kind) {
                    Text("Timer").tag(PlaylistItem.Kind.timer)
                    Text("Custom play").tag(PlaylistItem.Kind.customPlay)
                }
                .pickerStyle(.segmented)
            }

            if draft.kind == .timer {
                Section("Timer item") {
                    TextField("Title", text: $draft.title)

                    Picker("Meditation type", selection: $draft.meditationType) {
                        Text("Choose").tag(MeditationType?.none)
                        ForEach(ReferenceData.meditationTypes, id: \.self) { meditationType in
                            Text(meditationType.rawValue).tag(Optional(meditationType))
                        }
                    }

                    Stepper(value: $draft.durationMinutes, in: 1 ... 180) {
                        HStack {
                            Text("Duration")
                            Spacer()
                            Text("\(draft.durationMinutes) min")
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            } else {
                Section("Linked custom play") {
                    Picker("Custom play", selection: $draft.customPlayID) {
                        Text("Choose").tag(UUID?.none)
                        ForEach(availableCustomPlays) { customPlay in
                            Text(customPlay.name).tag(Optional(customPlay.id))
                        }
                    }

                    if let selectedCustomPlay = selectedCustomPlay {
                        LabeledContent("Meditation type", value: selectedCustomPlay.meditationType.rawValue)
                        LabeledContent("Duration", value: "\(selectedCustomPlay.durationSeconds / 60) min")
                        Text(selectedCustomPlay.media == nil ? "Needs bundled placeholder audio before this playlist can run." : "Uses the saved custom play title, type, duration, and local audio.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    } else {
                        Text("Choose a saved custom play to derive the item details.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .navigationTitle("Add item")
        .onChange(of: draft.customPlayID) { _, _ in
            syncSelectedCustomPlay()
        }
        .onChange(of: draft.kind) { _, newValue in
            if newValue == .customPlay {
                syncSelectedCustomPlay()
            }
        }
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Cancel") {
                    dismiss()
                }
            }
            ToolbarItem(placement: .confirmationAction) {
                Button("Add") {
                    onSave(draft)
                    dismiss()
                }
            }
        }
    }

    private var selectedCustomPlay: CustomPlay? {
        guard let customPlayID = draft.customPlayID else {
            return nil
        }

        return availableCustomPlays.first(where: { $0.id == customPlayID })
    }

    private func syncSelectedCustomPlay() {
        guard draft.kind == .customPlay,
              let selectedCustomPlay
        else {
            return
        }

        draft.title = selectedCustomPlay.name
        draft.durationMinutes = max(1, selectedCustomPlay.durationSeconds / 60)
        draft.meditationType = selectedCustomPlay.meditationType
    }
}
