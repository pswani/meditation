import SwiftUI

struct HistoryView: View {
    @ObservedObject var viewModel: ShellViewModel
    @State private var filter = SessionLogFilter()
    @State private var isPresentingManualLogSheet = false
    @State private var manualLogDraft = ManualLogDraft()

    var body: some View {
        List {
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
                        }
                        .padding(.vertical, 6)
                    }
                }
            }
        }
        .navigationTitle("History")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Manual log") {
                    viewModel.manualLogValidationMessage = nil
                    manualLogDraft = ManualLogDraft(
                        meditationType: viewModel.snapshot.timerDraft.meditationType,
                        durationMinutes: max(1, viewModel.snapshot.timerDraft.durationMinutes),
                        endedAt: Date()
                    )
                    isPresentingManualLogSheet = true
                }
            }
        }
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

                        Stepper(value: $manualLogDraft.durationMinutes, in: 1 ... 360) {
                            HStack {
                                Text("Duration")
                                Spacer()
                                Text("\(manualLogDraft.durationMinutes) min")
                                    .foregroundStyle(.secondary)
                            }
                        }

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
}
