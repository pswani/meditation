import SwiftUI

struct CustomPlayLibraryView: View {
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
                                    Text(customPlay.media == nil ? "Needs bundled placeholder audio" : "Placeholder audio: \(customPlay.media?.asset.rawValue ?? "")")
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
                Picker("Bundled audio", selection: $draft.mediaAsset) {
                    Text("Choose").tag(CustomPlayMediaAsset?.none)
                    ForEach(ReferenceData.customPlayMediaAssets, id: \.self) { mediaAsset in
                        Text(mediaAsset.rawValue).tag(Optional(mediaAsset))
                    }
                }

                Toggle("Favorite", isOn: $draft.isFavorite)
            }

            Section("Local media guidance") {
                Text("Milestone 3 uses bundled placeholder tracks so custom plays stay runnable in simulator and on device. The linked media identifier is a sync seam for later, not a new playback source yet.")
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
