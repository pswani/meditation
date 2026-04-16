import SwiftUI

struct CustomPlayLibraryView: View {
    @ObservedObject var viewModel: ShellViewModel
    @State private var isPresentingEditor = false
    @State private var draft = CustomPlayDraft()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        List {
            if viewModel.customPlays.isEmpty {
                Section {
                    Text("No custom plays yet. Add one with real recording media so playback stays truthful on this device.")
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
                                    Text(customPlaySoundSummary(customPlay))
                                        .font(.footnote)
                                        .foregroundStyle(.secondary)
                                    if let recordingLabel = customPlay.recordingLabel {
                                        Text("Session note: \(recordingLabel)")
                                            .font(.footnote)
                                            .foregroundStyle(.secondary)
                                    }
                                    if let linkedMediaIdentifier = customPlay.linkedMediaIdentifier {
                                        Text("Linked media identifier: \(linkedMediaIdentifier)")
                                            .font(.footnote)
                                            .foregroundStyle(.secondary)
                                    }
                                    Text(mediaSummary(
                                        customPlay,
                                        canResolvePlayback: viewModel.canResolvePlayback(for: customPlay.media)
                                    ))
                                        .font(.footnote)
                                        .foregroundStyle(.secondary)
                                    if let startSupportMessage = viewModel.customPlayStartSupportMessage(for: customPlay) {
                                        Text(startSupportMessage)
                                            .font(.footnote)
                                            .foregroundStyle(.secondary)
                                    }
                                }
                                Spacer()
                                if customPlay.isFavorite {
                                    Image(systemName: "star.fill")
                                        .foregroundStyle(.yellow)
                                }
                            }

                            HStack {
                                Button("Start") {
                                    if viewModel.startCustomPlay(customPlay) {
                                        dismiss()
                                    }
                                }
                                .buttonStyle(.borderedProminent)
                                .tint(.teal)
                                .disabled(viewModel.canStartCustomPlay(customPlay) == false)

                                Button("Apply to timer") {
                                    viewModel.applyCustomPlayToTimer(customPlay)
                                }
                                .buttonStyle(.bordered)

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
                                    viewModel.requestDeleteCustomPlayConfirmation(customPlay)
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

struct CustomPlayEditorView: View {
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
            }

            Section("Sounds") {
                Picker("Start sound (optional)", selection: $draft.startSoundName) {
                    Text("None").tag(String?.none)
                    ForEach(ReferenceData.timerSoundOptions, id: \.self) { sound in
                        Text(sound.rawValue).tag(Optional(sound.rawValue))
                    }
                }

                Picker("End sound (optional)", selection: $draft.endSoundName) {
                    Text("None").tag(String?.none)
                    ForEach(ReferenceData.timerSoundOptions, id: \.self) { sound in
                        Text(sound.rawValue).tag(Optional(sound.rawValue))
                    }
                }
            }

            Section("Recording details") {
                TextField("Session note", text: $draft.recordingLabel)
                TextField("Linked media identifier", text: $draft.linkedMediaIdentifier)
                Picker("Bundled sample media", selection: bundledSampleSelection) {
                    if draft.media?.source == .remote {
                        Text("Keep current linked media").tag(CustomPlayMediaAsset?.none)
                    } else {
                        Text("Choose").tag(CustomPlayMediaAsset?.none)
                    }
                    ForEach(ReferenceData.customPlayMediaAssets, id: \.self) { mediaAsset in
                        Text(mediaAsset.rawValue).tag(Optional(mediaAsset))
                    }
                }

                Toggle("Favorite", isOn: $draft.isFavorite)
            }

            Section("Media guidance") {
                if let media = draft.media {
                    Text("Current media: \(media.label) • \(media.sourceSummary)")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                Text("Choose bundled sample media for local-only playback, or keep a backend-linked recording when one is already synced. The linked media identifier remains the sync seam for managed media.")
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

    private var bundledSampleSelection: Binding<CustomPlayMediaAsset?> {
        Binding(
            get: { draft.media?.bundledAsset },
            set: { selectedAsset in
                if let selectedAsset {
                    draft.media = .bundledSample(selectedAsset)
                    if draft.linkedMediaIdentifier.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        draft.linkedMediaIdentifier = selectedAsset.id
                    }
                } else if draft.media?.source == .bundledSample {
                    draft.media = nil
                }
            }
        )
    }
}

private func mediaSummary(_ customPlay: CustomPlay, canResolvePlayback: Bool) -> String {
    guard let media = customPlay.media else {
        return "Recording unavailable on this device"
    }

    if canResolvePlayback {
        return "Recording: \(media.label) • \(media.sourceSummary)"
    }

    return "Recording unavailable on this device"
}
