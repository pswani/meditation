import SwiftUI

struct HistoryView: View {
    @ObservedObject var viewModel: ShellViewModel

    var body: some View {
        List(viewModel.snapshot.recentSessionLogs) { log in
            VStack(alignment: .leading, spacing: 6) {
                Text(log.meditationType.rawValue)
                    .font(.headline)
                Text("\(log.source.rawValue) • \(log.completedDurationSeconds / 60) min")
                    .foregroundStyle(.secondary)
                if let notes = log.notes {
                    Text(notes)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.vertical, 4)
        }
        .navigationTitle("History")
    }
}
