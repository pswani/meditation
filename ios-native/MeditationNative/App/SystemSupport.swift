import AVFoundation
import Foundation
@preconcurrency import UserNotifications

enum NotificationPermissionState: Equatable {
    case checking
    case notDetermined
    case denied
    case authorized
    case provisional

    var title: String {
        switch self {
        case .checking:
            return "Checking notification support"
        case .notDetermined:
            return "Notifications are available but not enabled yet"
        case .denied:
            return "Notifications are turned off for this app"
        case .authorized:
            return "Notifications are enabled"
        case .provisional:
            return "Notifications are provisionally enabled"
        }
    }

    var detail: String {
        switch self {
        case .checking:
            return "The app is reading the current permission state."
        case .notDetermined:
            return "You can allow a completion notification for fixed-duration sessions. The timer itself still stays local-first in the app."
        case .denied:
            return "You can still meditate in the app, but fixed sessions will rely on the in-app timer display unless you re-enable notifications in Settings."
        case .authorized:
            return "Fixed-duration sessions can schedule a local completion notification when appropriate."
        case .provisional:
            return "The app can schedule local completion notifications, but the system may still present them quietly."
        }
    }

    var canRequestAuthorization: Bool {
        self == .notDetermined
    }
}

protocol NotificationScheduling: Sendable {
    func authorizationState() async -> NotificationPermissionState
    func requestAuthorization() async -> NotificationPermissionState
    func scheduleTimerCompletionNotification(
        at date: Date,
        meditationType: MeditationType
    ) async
    func cancelTimerCompletionNotification() async
}

struct LiveNotificationScheduler: NotificationScheduling {
    private let center = UNUserNotificationCenter.current()
    private let requestIdentifier = "meditation-native-timer-completion"

    func authorizationState() async -> NotificationPermissionState {
        let settings = await notificationSettings()
        switch settings.authorizationStatus {
        case .authorized:
            return .authorized
        case .provisional:
            return .provisional
        case .denied:
            return .denied
        case .notDetermined:
            return .notDetermined
        case .ephemeral:
            return .provisional
        @unknown default:
            return .denied
        }
    }

    func requestAuthorization() async -> NotificationPermissionState {
        _ = try? await center.requestAuthorization(options: [.alert, .badge, .sound])
        return await authorizationState()
    }

    func scheduleTimerCompletionNotification(
        at date: Date,
        meditationType: MeditationType
    ) async {
        await cancelTimerCompletionNotification()

        let interval = max(1, date.timeIntervalSinceNow.rounded(.up))
        let content = UNMutableNotificationContent()
        content.title = "Meditation complete"
        content.body = "\(meditationType.rawValue) timer finished."
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(
            timeInterval: interval,
            repeats: false
        )
        let request = UNNotificationRequest(
            identifier: requestIdentifier,
            content: content,
            trigger: trigger
        )

        try? await center.add(request)
    }

    func cancelTimerCompletionNotification() async {
        center.removePendingNotificationRequests(withIdentifiers: [requestIdentifier])
    }

    private func notificationSettings() async -> UNNotificationSettings {
        await withCheckedContinuation { continuation in
            center.getNotificationSettings { settings in
                continuation.resume(returning: settings)
            }
        }
    }
}

@MainActor
protocol TimerSoundPlaying: AnyObject {
    func playSound(named soundName: String?)
}

@MainActor
final class SystemSoundPlayer: NSObject, TimerSoundPlaying, @preconcurrency AVAudioPlayerDelegate {
    private var activePlayers: [AVAudioPlayer] = []

    func playSound(named soundName: String?) {
        guard let resourceName = TimerSoundCatalog.bundledResourceName(for: soundName),
              let fileURL = Bundle.main.url(forResource: resourceName, withExtension: "mp3")
        else {
            return
        }

        do {
            let player = try AVAudioPlayer(contentsOf: fileURL)
            player.delegate = self
            player.prepareToPlay()
            guard player.play() else {
                return
            }
            activePlayers.append(player)
        } catch {
            return
        }
    }

    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        activePlayers.removeAll { $0 === player }
    }
}

enum LocalAudioPlaybackError: Error {
    case bundledAssetMissing
    case recordingUnavailable
    case invalidMediaURL
    case audioSetupFailed

    var message: String {
        switch self {
        case .bundledAssetMissing:
            return "The bundled recording is unavailable right now."
        case .recordingUnavailable:
            return "The linked recording is unavailable on this device right now."
        case .invalidMediaURL:
            return "The linked recording media path is invalid."
        case .audioSetupFailed:
            return "The app could not start recording playback right now."
        }
    }
}

@MainActor
protocol CustomPlayAudioControlling: AnyObject {
    func startPlayback(for media: CustomPlayMedia, environment: AppEnvironment, at offsetSeconds: TimeInterval) throws
    func pausePlayback()
    func resumePlayback() throws
    func stopPlayback()
}

@MainActor
final class BundledCustomPlayAudioPlayer: NSObject, CustomPlayAudioControlling {
    private var player: AVPlayer?

    func startPlayback(for media: CustomPlayMedia, environment: AppEnvironment, at offsetSeconds: TimeInterval = 0) throws {
        stopPlayback()
        let url = try resolvePlaybackURL(for: media, environment: environment)

        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)

            let player = AVPlayer(url: url)
            player.automaticallyWaitsToMinimizeStalling = true
            let startTime = max(0, offsetSeconds)
            if startTime > 0 {
                let seekTime = CMTime(seconds: startTime, preferredTimescale: 600)
                player.seek(to: seekTime, toleranceBefore: .zero, toleranceAfter: .zero)
            }
            player.play()
            self.player = player
        } catch let playbackError as LocalAudioPlaybackError {
            throw playbackError
        } catch {
            throw LocalAudioPlaybackError.audioSetupFailed
        }
    }

    func pausePlayback() {
        player?.pause()
    }

    func resumePlayback() throws {
        guard let player else {
            throw LocalAudioPlaybackError.audioSetupFailed
        }

        player.play()
    }

    func stopPlayback() {
        player?.pause()
        player = nil
    }

    private func resolvePlaybackURL(
        for media: CustomPlayMedia,
        environment: AppEnvironment
    ) throws -> URL {
        switch media.source {
        case .bundledSample:
            guard let bundledAsset = media.bundledAsset,
                  let url = Bundle.main.url(
                      forResource: bundledAsset.bundledResourceName,
                      withExtension: bundledAsset.bundledResourceExtension
                  )
            else {
                throw LocalAudioPlaybackError.bundledAssetMissing
            }

            return url
        case .remote:
            if let filePath = media.filePath?.trimmingCharacters(in: .whitespacesAndNewlines),
               filePath.isEmpty == false {
                if let absoluteURL = URL(string: filePath), absoluteURL.scheme != nil {
                    return absoluteURL
                }

                guard let originURL = environment.apiBaseURL.flatMap(originURL(from:)) else {
                    throw LocalAudioPlaybackError.recordingUnavailable
                }

                guard let resolvedURL = URL(string: filePath.hasPrefix("/") ? filePath : "/\(filePath)", relativeTo: originURL)?.absoluteURL else {
                    throw LocalAudioPlaybackError.invalidMediaURL
                }

                return resolvedURL
            }

            guard media.relativePath.isEmpty == false,
                  let originURL = environment.apiBaseURL.flatMap(originURL(from:)),
                  let resolvedURL = URL(string: "/media/\(media.relativePath)", relativeTo: originURL)?.absoluteURL
            else {
                throw LocalAudioPlaybackError.recordingUnavailable
            }

            return resolvedURL
        case .legacyPlaceholder:
            throw LocalAudioPlaybackError.recordingUnavailable
        }
    }

    private func originURL(from apiBaseURL: URL) -> URL? {
        guard var components = URLComponents(url: apiBaseURL, resolvingAgainstBaseURL: false) else {
            return nil
        }

        components.path = ""
        components.query = nil
        components.fragment = nil
        return components.url
    }
}
