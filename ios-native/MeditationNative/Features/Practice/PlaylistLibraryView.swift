import SwiftUI

struct PlaylistLibraryView: View {
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
                        let validationMessage = viewModel.playlistRunValidationMessage(for: playlist)
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
                                .disabled(validationMessage != nil)

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
                                    viewModel.requestDeletePlaylistConfirmation(playlist)
                                }
                                .buttonStyle(.bordered)
                            }
                            .font(.footnote)

                            if let validationMessage {
                                Text(validationMessage)
                                    .font(.footnote)
                                    .foregroundStyle(.secondary)
                            }
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
        .safeAreaInset(edge: .bottom) {
            Color.clear.frame(height: 12)
        }
        .alert(
            viewModel.runtimeSafetyPrompt?.title ?? "",
            isPresented: runtimeSafetyPromptIsPresented,
            presenting: viewModel.runtimeSafetyPrompt
        ) { prompt in
            Button(prompt.confirmButtonTitle, role: prompt.confirmButtonRole) {
                viewModel.confirmRuntimeSafetyPrompt()
            }
            Button("Cancel", role: .cancel) {
                viewModel.cancelRuntimeSafetyPrompt()
            }
        } message: { prompt in
            Text(prompt.message)
        }
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

    private var runtimeSafetyPromptIsPresented: Binding<Bool> {
        Binding(
            get: { viewModel.runtimeSafetyPrompt != nil },
            set: { isPresented in
                if isPresented == false {
                    viewModel.cancelRuntimeSafetyPrompt()
                }
            }
        )
    }
}

struct PlaylistEditorView: View {
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
                    canResolvePlayback: viewModel.canResolvePlayback(for:),
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

struct PlaylistItemEditorView: View {
    let availableCustomPlays: [CustomPlay]
    let canResolvePlayback: (CustomPlayMedia?) -> Bool
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
                        Text(
                            canResolvePlayback(selectedCustomPlay.media)
                                ? "Uses the saved custom play title, type, duration, and linked recording media."
                                : "This custom play needs an available recording before the playlist can run."
                        )
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
