import SwiftUI

struct GoalsView: View {
    @ObservedObject var viewModel: ShellViewModel
    @State private var summaryRangePreset: SummaryRangePreset = .last7Days
    @State private var isPresentingEditor = false
    @State private var editingSankalpa: Sankalpa?
    @State private var draft = SankalpaDraft()
    @State private var pendingArchiveSankalpa: Sankalpa?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Goals")
                    .font(.largeTitle.weight(.semibold))
                Text("Track reflective progress and keep sankalpas disciplined, local, and explicit.")
                    .foregroundStyle(.secondary)

                if let sankalpaFeedbackMessage = viewModel.sankalpaFeedbackMessage {
                    Text(sankalpaFeedbackMessage)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                summarySection

                HStack {
                    Text("Sankalpas")
                        .font(.title3.weight(.semibold))
                    Spacer()
                    Button("Create sankalpa") {
                        viewModel.sankalpaValidationMessage = nil
                        editingSankalpa = nil
                        draft = SankalpaFeature.makeDraft()
                        isPresentingEditor = true
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.teal)
                }

                sankalpaSection(
                    title: "Active sankalpas",
                    caption: "Current goals and observance windows.",
                    entries: viewModel.sankalpaProgressGroups.active
                )
                sankalpaSection(
                    title: "Completed sankalpas",
                    caption: "Finished goals remain visible until you archive them.",
                    entries: viewModel.sankalpaProgressGroups.completed
                )
                sankalpaSection(
                    title: "Expired sankalpas",
                    caption: "Past windows stay explicit so the record remains trustworthy.",
                    entries: viewModel.sankalpaProgressGroups.expired
                )
                sankalpaSection(
                    title: "Archived sankalpas",
                    caption: "Archived goals stay out of the active path until restored.",
                    entries: viewModel.sankalpaProgressGroups.archived
                )

                if let persistenceMessage = viewModel.persistenceMessage {
                    Text(persistenceMessage)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .padding()
        }
        .navigationTitle("Goals")
        .sheet(isPresented: $isPresentingEditor) {
            NavigationStack {
                Form {
                    Section("Sankalpa") {
                        TextField("Title (optional)", text: $draft.title)

                        Picker("Goal type", selection: $draft.kind) {
                            ForEach(ReferenceData.sankalpaKinds, id: \.self) { kind in
                                Text(kind.title).tag(kind)
                            }
                        }

                        if draft.kind == .observanceBased {
                            TextField("Observance", text: $draft.observanceLabel, axis: .vertical)
                                .lineLimit(2 ... 4)
                        } else {
                            Stepper(value: $draft.targetValue, in: 1 ... 1_440) {
                                HStack {
                                    Text(draft.kind == .durationBased ? "Target duration" : "Target session logs")
                                    Spacer()
                                    Text(targetValueText(for: draft))
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }

                        Stepper(value: $draft.days, in: 1 ... 365) {
                            HStack {
                                Text("Days")
                                Spacer()
                                Text("\(draft.days)")
                                    .foregroundStyle(.secondary)
                            }
                        }

                        if draft.kind != .observanceBased {
                            Picker("Meditation type", selection: $draft.meditationType) {
                                Text("Any").tag(MeditationType?.none)
                                ForEach(ReferenceData.meditationTypes, id: \.self) { meditationType in
                                    Text(meditationType.rawValue).tag(Optional(meditationType))
                                }
                            }

                            Picker("Time of day", selection: $draft.timeOfDayBucket) {
                                Text("Any").tag(TimeOfDayBucket?.none)
                                ForEach(ReferenceData.timeOfDayBuckets, id: \.self) { bucket in
                                    Text("\(bucket.title) (\(bucket.detail))").tag(Optional(bucket))
                                }
                            }
                        }
                    }

                    if let sankalpaValidationMessage = viewModel.sankalpaValidationMessage {
                        Section {
                            Text(sankalpaValidationMessage)
                                .font(.footnote)
                                .foregroundStyle(.red)
                        }
                    }
                }
                .navigationTitle(editingSankalpa == nil ? "Create sankalpa" : "Edit sankalpa")
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") {
                            isPresentingEditor = false
                        }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Save") {
                            if viewModel.saveSankalpa(draft, editing: editingSankalpa) {
                                isPresentingEditor = false
                            }
                        }
                    }
                }
            }
        }
        .alert(
            "Archive sankalpa?",
            isPresented: Binding(
                get: { pendingArchiveSankalpa != nil },
                set: { isPresented in
                    if isPresented == false {
                        pendingArchiveSankalpa = nil
                    }
                }
            )
        ) {
            Button("Cancel", role: .cancel) {
                pendingArchiveSankalpa = nil
            }
            Button("Archive", role: .destructive) {
                if let pendingArchiveSankalpa {
                    viewModel.archiveSankalpa(pendingArchiveSankalpa)
                }
                pendingArchiveSankalpa = nil
            }
        } message: {
            Text("Move this sankalpa out of the active path while keeping its progress history visible.")
        }
    }

    private var summarySection: some View {
        let summary = viewModel.summarySnapshot(for: summaryRangePreset)

        return SectionCard(title: "Summary", caption: "Date range applies to session log end time.") {
            VStack(alignment: .leading, spacing: 16) {
                Picker("Summary range", selection: $summaryRangePreset) {
                    ForEach(SummaryRangePreset.allCases, id: \.self) { preset in
                        Text(preset.title).tag(preset)
                    }
                }
                .pickerStyle(.segmented)

                if summary.sessionLogs.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("No session logs match this range yet.")
                        Text("Practice sessions and manual logs will fill this summary automatically.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                } else {
                    LazyVGrid(
                        columns: [
                            GridItem(.flexible(), spacing: 12),
                            GridItem(.flexible(), spacing: 12),
                        ],
                        spacing: 12
                    ) {
                        summaryMetricCard(title: "Total duration", value: formatDuration(summary.overall.totalDurationSeconds))
                        summaryMetricCard(title: "Session logs", value: "\(summary.overall.totalSessionLogs)")
                        summaryMetricCard(
                            title: "Completed / ended early",
                            value: "\(summary.overall.completedSessionLogs) / \(summary.overall.endedEarlySessionLogs)"
                        )
                        summaryMetricCard(title: "Average duration", value: formatDuration(summary.overall.averageDurationSeconds))
                    }

                    summaryListSection(
                        title: "By meditation type",
                        rows: summary.byMeditationType.filter { $0.sessionLogs > 0 }.map {
                            SummaryListRow(
                                title: $0.meditationType.rawValue,
                                detail: "\($0.sessionLogs) session logs",
                                value: formatDuration($0.totalDurationSeconds)
                            )
                        }
                    )

                    summaryListSection(
                        title: "By source",
                        rows: summary.bySource.filter { $0.sessionLogs > 0 }.map {
                            SummaryListRow(
                                title: $0.source.title,
                                detail: "\($0.completedSessionLogs) completed · \($0.endedEarlySessionLogs) ended early",
                                value: formatDuration($0.totalDurationSeconds)
                            )
                        }
                    )
                }
            }
        }
    }

    @ViewBuilder
    private func sankalpaSection(
        title: String,
        caption: String,
        entries: [SankalpaProgress]
    ) -> some View {
        SectionCard(title: title, caption: caption) {
            if entries.isEmpty {
                Text(emptyStateText(for: title))
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            } else {
                VStack(alignment: .leading, spacing: 14) {
                    ForEach(entries) { progress in
                        sankalpaCard(progress)
                    }
                }
            }
        }
    }

    private func sankalpaCard(_ progress: SankalpaProgress) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(progress.goal.title)
                        .font(.headline)
                    Text(goalDescription(progress.goal))
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Text(progress.status.rawValue)
                    .font(.caption.weight(.medium))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(Capsule())
            }

            ProgressView(value: progress.progressRatio)
                .tint(.teal)

            Text(progressDetail(progress))
                .font(.footnote)
            Text(remainingDetail(progress))
                .font(.footnote)
                .foregroundStyle(.secondary)
            Text("Deadline: \(progress.deadlineAt.formatted(date: .abbreviated, time: .omitted))")
                .font(.footnote)
                .foregroundStyle(.secondary)

            if progress.goal.kind != .observanceBased {
                Text(filterDetail(progress.goal))
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            } else {
                observanceSection(progress)
            }

            HStack(spacing: 12) {
                if progress.status != .archived {
                    Button("Edit") {
                        viewModel.sankalpaValidationMessage = nil
                        editingSankalpa = progress.goal
                        draft = SankalpaFeature.makeDraft(from: progress.goal)
                        isPresentingEditor = true
                    }
                    .buttonStyle(.bordered)

                    Button("Archive") {
                        pendingArchiveSankalpa = progress.goal
                    }
                    .buttonStyle(.bordered)
                } else {
                    Button("Restore") {
                        viewModel.restoreSankalpa(progress.goal)
                    }
                    .buttonStyle(.bordered)
                }
            }
        }
        .padding(.vertical, 4)
    }

    private func observanceSection(_ progress: SankalpaProgress) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(progress.goal.observanceLabel ?? "Observance")
                .font(.footnote.weight(.medium))

            ForEach(progress.observanceDays) { day in
                HStack(alignment: .center, spacing: 12) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(formattedDate(day.dateKey))
                        Text(day.status.title)
                            .font(.caption)
                            .foregroundStyle(day.isFuture ? .secondary : .secondary)
                    }

                    Spacer()

                    if day.isFuture || progress.status == .archived {
                        Text(day.isFuture ? "Locked until that day" : "Read only")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    } else {
                        Menu(day.status.title) {
                            Button("Pending") {
                                viewModel.setObservanceStatus(for: progress.goal, dateKey: day.dateKey, status: .pending)
                            }
                            Button("Observed") {
                                viewModel.setObservanceStatus(for: progress.goal, dateKey: day.dateKey, status: .observed)
                            }
                            Button("Missed") {
                                viewModel.setObservanceStatus(for: progress.goal, dateKey: day.dateKey, status: .missed)
                            }
                        }
                    }
                }
            }

            Text("Future dates unlock on their day so check-ins stay trustworthy.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }

    private func summaryMetricCard(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title3.weight(.semibold))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color(.tertiarySystemBackground))
        )
    }

    private func summaryListSection(title: String, rows: [SummaryListRow]) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.headline)

            if rows.isEmpty {
                Text("No active categories in this range.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            } else {
                ForEach(rows) { row in
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(row.title)
                            Text(row.detail)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text(row.value)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
    }

    private func emptyStateText(for title: String) -> String {
        switch title {
        case "Active sankalpas":
            return "No active sankalpas yet. Create one when you want a current intention to stay in view."
        case "Completed sankalpas":
            return "Completed sankalpas will appear here until you archive them."
        case "Expired sankalpas":
            return "Expired sankalpas will stay visible here so the result remains explicit."
        default:
            return "Archived sankalpas will appear here after you move them out of the active path."
        }
    }

    private func targetValueText(for draft: SankalpaDraft) -> String {
        if draft.kind == .durationBased {
            return "\(draft.targetValue) min"
        }
        return "\(draft.targetValue)"
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

    private func goalDescription(_ goal: Sankalpa) -> String {
        switch goal.kind {
        case .observanceBased:
            return "\(goal.observanceLabel ?? "Observance") for \(goal.days) day\(goal.days == 1 ? "" : "s")"
        case .durationBased:
            return "\(goal.targetValue) min in \(goal.days) day\(goal.days == 1 ? "" : "s")"
        case .sessionCount:
            return "\(goal.targetValue) session logs in \(goal.days) day\(goal.days == 1 ? "" : "s")"
        }
    }

    private func progressDetail(_ progress: SankalpaProgress) -> String {
        switch progress.goal.kind {
        case .observanceBased:
            return "\(progress.matchedObservanceCount) / \(progress.targetObservanceCount) observed dates"
        case .durationBased:
            return "\(formatDuration(progress.matchedDurationSeconds)) / \(formatDuration(progress.targetDurationSeconds))"
        case .sessionCount:
            return "\(progress.matchedSessionCount) / \(progress.targetSessionCount) session logs"
        }
    }

    private func remainingDetail(_ progress: SankalpaProgress) -> String {
        switch progress.goal.kind {
        case .observanceBased:
            return "\(progress.pendingObservanceCount) pending · \(progress.missedObservanceCount) missed"
        case .durationBased:
            let remainingSeconds = max(0, progress.targetDurationSeconds - progress.matchedDurationSeconds)
            return "\(formatDuration(remainingSeconds)) remaining"
        case .sessionCount:
            let remainingCount = max(0, progress.targetSessionCount - progress.matchedSessionCount)
            return "\(remainingCount) session logs remaining"
        }
    }

    private func filterDetail(_ goal: Sankalpa) -> String {
        let filters = [
            goal.meditationType.map { "Meditation type: \($0.rawValue)" },
            goal.timeOfDayBucket.map { "Time of day: \($0.title) (\($0.detail))" },
        ]
        .compactMap { $0 }

        return filters.isEmpty ? "No filters" : filters.joined(separator: " · ")
    }

    private func formattedDate(_ dateKey: String) -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"

        guard let date = formatter.date(from: dateKey) else {
            return dateKey
        }

        return date.formatted(date: .abbreviated, time: .omitted)
    }
}

private struct SummaryListRow: Identifiable {
    let id = UUID()
    let title: String
    let detail: String
    let value: String
}
