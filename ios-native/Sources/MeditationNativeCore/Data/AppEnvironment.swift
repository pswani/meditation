import Foundation

public struct AppEnvironment: Codable, Equatable, Sendable {
    public var profileName: String
    public var apiBaseURL: URL?
    public var requiresBackend: Bool

    public init(
        profileName: String,
        apiBaseURL: URL?,
        requiresBackend: Bool
    ) {
        self.profileName = profileName
        self.apiBaseURL = apiBaseURL
        self.requiresBackend = requiresBackend
    }

    public static let localOnly = AppEnvironment(
        profileName: "Local Foundation",
        apiBaseURL: nil,
        requiresBackend: false
    )

    public static func from(
        profileName: String? = ProcessInfo.processInfo.environment["MEDITATION_IOS_PROFILE"],
        apiBaseURLString: String? = ProcessInfo.processInfo.environment["MEDITATION_IOS_API_BASE_URL"]
    ) -> AppEnvironment {
        let baseURL = apiBaseURLString.flatMap(URL.init(string:))
        return AppEnvironment(
            profileName: profileName ?? "Local Foundation",
            apiBaseURL: baseURL,
            requiresBackend: baseURL != nil
        )
    }
}
