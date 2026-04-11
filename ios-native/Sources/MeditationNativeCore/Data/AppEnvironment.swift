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

    private enum PersistenceKey {
        static let profileName = "meditation.native.profileName"
        static let apiBaseURL = "meditation.native.apiBaseURL"
    }

    public static func from(
        profileName: String? = ProcessInfo.processInfo.environment["MEDITATION_IOS_PROFILE"],
        apiBaseURLString: String? = ProcessInfo.processInfo.environment["MEDITATION_IOS_API_BASE_URL"],
        userDefaults: UserDefaults = .standard
    ) -> AppEnvironment {
        let normalizedProfileName = profileName?.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty
        let normalizedAPIBaseURLString = apiBaseURLString?.trimmingCharacters(in: .whitespacesAndNewlines)

        if let normalizedAPIBaseURLString {
            guard normalizedAPIBaseURLString.isEmpty == false else {
                clearPersistedConfiguration(userDefaults: userDefaults)
                return AppEnvironment(
                    profileName: normalizedProfileName ?? localOnly.profileName,
                    apiBaseURL: nil,
                    requiresBackend: false
                )
            }

            if let baseURL = URL(string: normalizedAPIBaseURLString) {
                let resolvedProfileName = normalizedProfileName ?? "Configured Backend"
                persistConfiguration(
                    profileName: resolvedProfileName,
                    apiBaseURLString: normalizedAPIBaseURLString,
                    userDefaults: userDefaults
                )
                return AppEnvironment(
                    profileName: resolvedProfileName,
                    apiBaseURL: baseURL,
                    requiresBackend: true
                )
            }

            clearPersistedConfiguration(userDefaults: userDefaults)
        }

        if let persistedEnvironment = persistedConfiguration(userDefaults: userDefaults) {
            return persistedEnvironment
        }

        return AppEnvironment(
            profileName: normalizedProfileName ?? localOnly.profileName,
            apiBaseURL: nil,
            requiresBackend: false
        )
    }

    public static func clearPersistedConfiguration(userDefaults: UserDefaults = .standard) {
        userDefaults.removeObject(forKey: PersistenceKey.profileName)
        userDefaults.removeObject(forKey: PersistenceKey.apiBaseURL)
    }

    private static func persistedConfiguration(userDefaults: UserDefaults) -> AppEnvironment? {
        guard let persistedAPIBaseURLString = userDefaults.string(forKey: PersistenceKey.apiBaseURL)?.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty,
              let baseURL = URL(string: persistedAPIBaseURLString) else {
            return nil
        }

        let persistedProfileName = userDefaults.string(forKey: PersistenceKey.profileName)?
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .nilIfEmpty ?? "Configured Backend"

        return AppEnvironment(
            profileName: persistedProfileName,
            apiBaseURL: baseURL,
            requiresBackend: true
        )
    }

    private static func persistConfiguration(
        profileName: String,
        apiBaseURLString: String,
        userDefaults: UserDefaults
    ) {
        userDefaults.set(profileName, forKey: PersistenceKey.profileName)
        userDefaults.set(apiBaseURLString, forKey: PersistenceKey.apiBaseURL)
    }
}

private extension String {
    var nilIfEmpty: String? {
        isEmpty ? nil : self
    }
}
