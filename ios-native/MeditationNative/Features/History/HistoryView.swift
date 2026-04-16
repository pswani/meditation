import SwiftUI

struct HistoryView: View {
    @ObservedObject var viewModel: ShellViewModel
    @State private var filter = SessionLogFilter()
    @State private var isPresentingManualLogSheet = false
    @State private var manualLogDraft = ManualLogDraft()
    @State private var editingMeditationTypeLog: SessionLog?
    @State private var editedMeditationType: MeditationType = .vipassana

    var body: some View {
        List {
            Section("Actions") {
                Button(action: presentManualLogSheet) {
                    HStack {
                        Label("Manual log", systemImage: "square.and.pencil")
                        Spacer()
                    }
                }
                .accessibilityIdentifier("historyManualLogButton")

                Text("Add off-app meditation here. Only manual logs can change meditation type later; auto-created history stays read-only.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            if let historyFeedbackMessage = viewModel.historyFeedbackMessage {
                Section {
                    Text(historyFeedbackMessage)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }

            Section {
                Picker("Source", selection: $filter.source) {
                    Text("All sources").tag(SessionSource?.none)
                    ForEach(ReferenceData.sessionSources, id: \.self) { source in
                        Text(source.rawValue).tag(Optional(source))
                    }
                }

                Picker("Status", selection: $filter.status) {
                    Text("All statuses").tag(SessionStatus?.none)
                    ForEach(SessionStatus.allCases, id: \.self) { status in
                        Text(status.title).tag(Optional(status))
                    }
                }

                Picker("Meditation type", selection: $filter.meditationType) {
                    Text("All types").tag(MeditationType?.none)
                    ForEach(ReferenceData.meditationTypes, id: \.self) { meditationType in
                        Text(meditationType.rawValue).tag(Optional(meditationType))
                    }
                }
            } header: {
                Text("Filters")
            }

            if filteredLogs.isEmpty {
                Section {
                    Text("No `session log` entries match the current filters yet.")
                        .foregroundStyle(.secondary)
                }
            } else {
                Section {
                    ForEach(filteredLogs) { log in
                        VStack(alignment: .leading, spacing: 10) {
                            HStack(alignment: .top) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(log.meditationType.rawValue)
                                        .font(.headline)
                                    Text(timeRangeLabel(for: log))
                                        .font(.footnote)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                Text(durationLabel(for: log))
                                    .font(.subheadline.weight(.medium))
                            }

                            HStack(spacing: 8) {
                                badge(log.source.title)
                                badge(log.status.title)
                                if log.timerMode == .openEnded {
                                    badge("open-ended")
                                }
                            }

                            if let plannedDurationSeconds = log.plannedDurationSeconds,
                               log.status == .endedEarly {
                                Text("Planned \(formatDuration(plannedDurationSeconds))")
                                    .font(.footnote)
                                    .foregroundStyle(.secondary)
                            }

                            let contextLabel = contextLabel(for: log)

                            if let contextLabel {
                                Text(contextLabel)
                                    .font(.footnote)
                                    .foregroundStyle(.secondary)
                            }

                            if let notes = notesLabel(for: log, contextLabel: contextLabel) {
                                Text(notes)
                                    .font(.footnote)
                                    .foregroundStyle(.secondary)
                            }

                            if viewModel.canChangeHistoryMeditationType(for: log) {
                                Button("Change meditation type") {
                                    presentMeditationTypeChange(for: log)
                                }
                                .buttonStyle(.borderless)
                                .font(.footnote.weight(.medium))
                            }
                        }
                        .padding(.vertical, 6)
                    }
                }
            }
        }
        .navigationTitle("History")
        .sheet(isPresented: $isPresentingManualLogSheet) {
            NavigationStack {
                Form {
                    Section("Manual log") {
                        Picker("Meditation type", selection: $manualLogDraft.meditationType) {
                            Text("Choose").tag(MeditationType?.none)
                            ForEach(ReferenceData.meditationTypes, id: \.self) { meditationType in
                                Text(meditationType.rawValue).tag(Optional(meditationType))
                            }
                        }

                        MinuteValueField(
                            title: "Duration",
                            value: $manualLogDraft.durationMinutes,
                            range: 1 ... 360,
                            step: 5,
                            helperText: "Enter minutes directly or use +/- for quick changes."
                        )

                        DatePicker(
                            "Session time",
                            selection: $manualLogDraft.endedAt,
                            displayedComponents: [.date, .hourAndMinute]
                        )

                        TextField("Notes", text: $manualLogDraft.notes, axis: .vertical)
                            .lineLimit(3 ... 5)
                    }

                    if let manualLogValidationMessage = viewModel.manualLogValidationMessage {
                        Section {
                            Text(manualLogValidationMessage)
                                .font(.footnote)
                                .foregroundStyle(.red)
                        }
                    }
                }
                .scrollDismissesKeyboard(.interactively)
                .dismissesKeyboardOnBackgroundTap()
                .navigationTitle("Manual log")
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") {
                            isPresentingManualLogSheet = false
                        }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Save") {
                            if viewModel.saveManualLog(manualLogDraft) {
                                isPresentingManualLogSheet = false
                            }
                        }
                    }
                }
            }
        }
        .sheet(item: $editingMeditationTypeLog) { log in
            NavigationStack {
                Form {
                    Section("Meditation type") {
                        Picker("Meditation type", selection: $editedMeditationType) {
                            ForEach(ReferenceData.meditationTypes, id: \.self) { meditationType in
                                Text(meditationType.rawValue).tag(meditationType)
                            }
                        }

                        Text("Only this manual log changes here. Duration and session time stay unchanged.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }

                    Section("Eligible record") {
                        LabeledContent("Source", value: "Manual log")
                        Text(timeRangeLabel(for: log))
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }

                    if let historyFeedbackMessage = viewModel.historyFeedbackMessage {
                        Section {
                            Text(historyFeedbackMessage)
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .navigationTitle("Change meditation type")
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") {
                            editingMeditationTypeLog = nil
                        }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Save") {
                            if viewModel.updateHistoryMeditationType(for: log, to: editedMeditationType) {
                                editingMeditationTypeLog = nil
                            }
                        }
                    }
                }
            }
        }
    }

    private var filteredLogs: [SessionLog] {
        TimerFeature.filteredSessionLogs(viewModel.recentSessionLogs, using: filter)
    }

    private func durationLabel(for log: SessionLog) -> String {
        formatDuration(log.completedDurationSeconds)
    }

    private func timeRangeLabel(for log: SessionLog) -> String {
        let start = log.startedAt.formatted(date: .abbreviated, time: .shortened)
        let end = log.endedAt.formatted(date: .abbreviated, time: .shortened)
        return "\(start) → \(end)"
    }

    private func contextLabel(for log: SessionLog) -> String? {
        guard let context = log.context else {
            return nil
        }

        if log.source == .playlist,
           let playlistName = context.playlistName,
           let itemIndex = context.playlistItemIndex,
           let itemCount = context.playlistItemCount {
            return "Playlist run: \(playlistName) • Item \(itemIndex + 1) of \(itemCount)"
        }

        if log.source == .customPlay,
           let customPlayName = context.customPlayName {
            if let recordingLabel = context.recordingLabel {
                return "Custom play: \(customPlayName) • Recording: \(recordingLabel)"
            }

            return "Custom play: \(customPlayName)"
        }

        return nil
    }

    private func notesLabel(for log: SessionLog, contextLabel: String?) -> String? {
        if contextLabel != nil {
            return nil
        }

        return log.notes
    }

    private func formatDuration(_ totalSeconds: Int) -> String {
        let totalMinutes = max(0, totalSeconds / 60)
        if totalMinutes >= 60 {
            let hours = totalMinutes / 60
            let minutes = totalMinutes % 60
            if minutes == 0 {
                return "\(hours) hr"
            }
            return "\(hours) hr \(minutes) min"
        }

        return "\(totalMinutes) min"
    }

    private func badge(_ title: String) -> some View {
        Text(title)
            .font(.caption.weight(.medium))
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(Color(.secondarySystemBackground))
            .clipShape(Capsule())
    }

    private func presentManualLogSheet() {
        viewModel.manualLogValidationMessage = nil
        viewModel.historyFeedbackMessage = nil
        manualLogDraft = ManualLogDraft(
            meditationType: viewModel.snapshot.timerDraft.meditationType,
            durationMinutes: max(1, viewModel.snapshot.timerDraft.durationMinutes),
            endedAt: Date()
        )
        isPresentingManualLogSheet = true
    }

    private func presentMeditationTypeChange(for log: SessionLog) {
        viewModel.historyFeedbackMessage = nil
        editedMeditationType = log.meditationType
        editingMeditationTypeLog = log
    }
}
