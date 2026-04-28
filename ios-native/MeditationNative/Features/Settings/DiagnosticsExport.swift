import OSLog

@MainActor
enum DiagnosticsExport {
    private static let subsystem = "com.meditation.native"

    static func collectLogs(since: Date = Date().addingTimeInterval(-3600)) async throws -> String {
        let store = try OSLogStore(scope: .currentProcessIdentifier)
        let position = store.position(date: since)
        let entries = try store.getEntries(at: position)
            .compactMap { $0 as? OSLogEntryLog }
            .filter { $0.subsystem == subsystem }
            .map { "[\($0.date)] [\($0.category)] \($0.composedMessage)" }
        return entries.isEmpty ? "No recent log entries." : entries.joined(separator: "\n")
    }
}
