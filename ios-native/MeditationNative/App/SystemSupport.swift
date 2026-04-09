import AVFoundation
import AudioToolbox
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

protocol TimerSoundPlaying: Sendable {
    func playSound(named soundName: String?)
}

struct SystemSoundPlayer: TimerSoundPlaying {
    func playSound(named soundName: String?) {
        guard let soundName else {
            return
        }

        let soundID: SystemSoundID
        switch soundName {
        case TimerSoundOption.templeBell.rawValue:
            soundID = 1025
        case TimerSoundOption.gong.rawValue:
            soundID = 1016
        case TimerSoundOption.woodBlock.rawValue:
            soundID = 1104
        default:
            return
        }

        AudioServicesPlaySystemSound(soundID)
    }
}

enum LocalAudioPlaybackError: Error {
    case bundledAssetMissing
    case audioSetupFailed

    var message: String {
        switch self {
        case .bundledAssetMissing:
            return "The bundled placeholder audio is unavailable right now."
        case .audioSetupFailed:
            return "The app could not start local audio playback right now."
        }
    }
}

protocol CustomPlayAudioControlling: AnyObject {
    func startLoopingPlayback(for media: CustomPlayMedia) throws
    func pausePlayback()
    func resumePlayback() throws
    func stopPlayback()
}

final class BundledCustomPlayAudioPlayer: NSObject, CustomPlayAudioControlling, AVAudioPlayerDelegate {
    private var audioPlayer: AVAudioPlayer?

    func startLoopingPlayback(for media: CustomPlayMedia) throws {
        stopPlayback()

        guard let url = Bundle.main.url(
            forResource: media.asset.bundledResourceName,
            withExtension: media.asset.bundledResourceExtension
        ) else {
            throw LocalAudioPlaybackError.bundledAssetMissing
        }

        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)

            let player = try AVAudioPlayer(contentsOf: url)
            player.numberOfLoops = -1
            player.delegate = self
            player.prepareToPlay()
            guard player.play() else {
                throw LocalAudioPlaybackError.audioSetupFailed
            }
            audioPlayer = player
        } catch let playbackError as LocalAudioPlaybackError {
            throw playbackError
        } catch {
            throw LocalAudioPlaybackError.audioSetupFailed
        }
    }

    func pausePlayback() {
        audioPlayer?.pause()
    }

    func resumePlayback() throws {
        guard let audioPlayer else {
            throw LocalAudioPlaybackError.audioSetupFailed
        }

        guard audioPlayer.play() else {
            throw LocalAudioPlaybackError.audioSetupFailed
        }
    }

    func stopPlayback() {
        audioPlayer?.stop()
        audioPlayer = nil
    }
}
