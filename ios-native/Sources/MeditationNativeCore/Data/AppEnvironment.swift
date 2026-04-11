import Foundation

public enum AppEnvironmentConfigurationError: Error, Equatable, Sendable {
    case invalidAPIBaseURL

    public var message: String {
        switch self {
        case .invalidAPIBaseURL:
            return "Enter a full backend URL such as http://prashants-mac-mini.local."
        }
    }
}

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

    public static let defaultBackend = AppEnvironment(
        profileName: "Prashant's Mac Mini",
        apiBaseURL: URL(string: "http://prashants-mac-mini.local"),
        requiresBackend: true
    )

    private enum PersistenceKey {
        static let profileName = "meditation.native.profileName"
        static let apiBaseURL = "meditation.native.apiBaseURL"
        static let defaultBackendSuppressed = "meditation.native.defaultBackendSuppressed"
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

        if userDefaults.bool(forKey: PersistenceKey.defaultBackendSuppressed) {
            return AppEnvironment(
                profileName: normalizedProfileName ?? localOnly.profileName,
                apiBaseURL: nil,
                requiresBackend: false
            )
        }

        if let defaultBackendURL = defaultBackend.apiBaseURL?.absoluteString {
            persistConfiguration(
                profileName: defaultBackend.profileName,
                apiBaseURLString: defaultBackendURL,
                userDefaults: userDefaults
            )
            return defaultBackend
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
        userDefaults.set(true, forKey: PersistenceKey.defaultBackendSuppressed)
    }

    public static func configured(
        profileName: String?,
        apiBaseURLString: String,
        userDefaults: UserDefaults = .standard
    ) throws -> AppEnvironment {
        let normalizedProfileName = profileName?.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty
        let normalizedAPIBaseURLString = apiBaseURLString.trimmingCharacters(in: .whitespacesAndNewlines)

        guard let baseURL = URL(string: normalizedAPIBaseURLString),
              let scheme = baseURL.scheme?.lowercased(),
              ["http", "https"].contains(scheme),
              baseURL.host?.nilIfEmpty != nil else {
            throw AppEnvironmentConfigurationError.invalidAPIBaseURL
        }

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
        userDefaults.set(false, forKey: PersistenceKey.defaultBackendSuppressed)
    }
}

private extension String {
    var nilIfEmpty: String? {
        isEmpty ? nil : self
    }
}
