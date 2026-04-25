import AVFoundation
import Combine
import Foundation
import os
import SwiftUI
import UIKit
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
            return "You can allow a completion notification for fixed-duration sessions. The timer itself stays local-first, and lock-screen delivery still depends on what iOS allows at the moment of completion."
        case .denied:
            return "You can still meditate in the app, but longer lock-screen completions will rely on the in-app timer catching up when you return unless you re-enable notifications in Settings."
        case .authorized:
            return "Fixed-duration sessions can schedule a local completion notification when appropriate, including a fallback when iOS does not keep the app runnable through the end bell."
        case .provisional:
            return "The app can schedule local completion notifications, but the system may still present them quietly and lock-screen behavior remains best-effort."
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
        meditationType: MeditationType,
        endSoundName: String?
    ) async
    func cancelTimerCompletionNotification() async
}

enum TimerCompletionNotificationSoundSupport {
    static func bundledFilename(for endSoundName: String?) -> String? {
        TimerSoundCatalog.bundledFilename(for: endSoundName)
    }

    static func notificationSound(for endSoundName: String?) -> UNNotificationSound {
        guard let filename = bundledFilename(for: endSoundName) else {
            return .default
        }

        return UNNotificationSound(named: UNNotificationSoundName(rawValue: filename))
    }
}

@MainActor
protocol TimerCompletionBridging: AnyObject {
    func armTimerCompletionBridge(
        targetEndAt: Date,
        onBridgeFire: @escaping @MainActor @Sendable (Date) -> Void
    )
    func cancelTimerCompletionBridge()
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
        meditationType: MeditationType,
        endSoundName: String?
    ) async {
        await cancelTimerCompletionNotification()

        let interval = max(1, date.timeIntervalSinceNow.rounded(.up))
        let content = UNMutableNotificationContent()
        content.title = "Meditation complete"
        content.body = "\(meditationType.rawValue) timer finished."
        content.sound = TimerCompletionNotificationSoundSupport.notificationSound(for: endSoundName)

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
final class LiveTimerCompletionBridge: TimerCompletionBridging {
    static let maxLeadTime: TimeInterval = 25

    private let application: UIApplication
    private let nowProvider: @Sendable () -> Date
    private var backgroundTaskIdentifier: UIBackgroundTaskIdentifier = .invalid
    private var pendingBridgeTask: Task<Void, Never>?

    init(
        application: UIApplication,
        nowProvider: @escaping @Sendable () -> Date
    ) {
        self.application = application
        self.nowProvider = nowProvider
    }

    convenience init() {
        self.init(
            application: .shared,
            nowProvider: { Date() }
        )
    }

    deinit {
        let application = application
        let backgroundTaskIdentifier = backgroundTaskIdentifier
        pendingBridgeTask?.cancel()
        if backgroundTaskIdentifier != .invalid {
            application.endBackgroundTask(backgroundTaskIdentifier)
        }
    }

    func armTimerCompletionBridge(
        targetEndAt: Date,
        onBridgeFire: @escaping @MainActor @Sendable (Date) -> Void
    ) {
        cancelTimerCompletionBridge()

        let remainingSeconds = targetEndAt.timeIntervalSince(nowProvider())
        guard remainingSeconds > 0, remainingSeconds <= Self.maxLeadTime else {
            return
        }

        backgroundTaskIdentifier = application.beginBackgroundTask(
            withName: "meditation-native-timer-completion"
        ) { [weak self] in
            Task { @MainActor [weak self] in
                self?.cancelTimerCompletionBridge()
            }
        }

        pendingBridgeTask = Task { [weak self] in
            if remainingSeconds > 0 {
                try? await Task.sleep(
                    nanoseconds: UInt64(remainingSeconds * 1_000_000_000)
                )
            }

            guard Task.isCancelled == false else {
                return
            }

            await MainActor.run {
                onBridgeFire(targetEndAt)
                self?.cancelTimerCompletionBridge()
            }
        }
    }

    func cancelTimerCompletionBridge() {
        pendingBridgeTask?.cancel()
        pendingBridgeTask = nil

        guard backgroundTaskIdentifier != .invalid else {
            return
        }

        application.endBackgroundTask(backgroundTaskIdentifier)
        backgroundTaskIdentifier = .invalid
    }
}

@MainActor
protocol TimerSoundPlaying: AnyObject {
    func playSound(named soundName: String?)
}

@MainActor
protocol BackgroundAudioKeeping: AnyObject {
    var isActive: Bool { get }
    func begin()
    func end()
}

@MainActor
final class SystemSoundPlayer: NSObject, TimerSoundPlaying, @preconcurrency AVAudioPlayerDelegate {
    private var activePlayers: [AVAudioPlayer] = []
    private var cancellables = Set<AnyCancellable>()

    override init() {
        super.init()
        NotificationCenter.default.publisher(for: AVAudioSession.interruptionNotification)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] notification in
                guard let self,
                      let typeValue = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
                      let interruptionType = AVAudioSession.InterruptionType(rawValue: typeValue) else { return }
                switch interruptionType {
                case .began:
                    let playerCount = self.activePlayers.count
                    self.activePlayers.forEach { $0.stop() }
                    self.activePlayers = []
                    for _ in 0..<playerCount {
                        PlaybackAudioSessionSupport.deactivatePlaybackSessionIfNeeded()
                    }
                case .ended:
                    break
                @unknown default: break
                }
            }
            .store(in: &cancellables)
    }

    func playSound(named soundName: String?) {
        guard let resourceName = TimerSoundCatalog.bundledResourceName(for: soundName),
              let fileURL = Bundle.main.url(forResource: resourceName, withExtension: "mp3")
        else {
            return
        }

        do {
            try PlaybackAudioSessionSupport.activatePlaybackSession()
            let player = try AVAudioPlayer(contentsOf: fileURL)
            player.delegate = self
            player.prepareToPlay()
            guard player.play() else {
                PlaybackAudioSessionSupport.deactivatePlaybackSessionIfNeeded()
                return
            }
            activePlayers.append(player)
        } catch {
            PlaybackAudioSessionSupport.deactivatePlaybackSessionIfNeeded()
            return
        }
    }

    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        activePlayers.removeAll { $0 === player }
        PlaybackAudioSessionSupport.deactivatePlaybackSessionIfNeeded()
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
    var onPlaybackCompletion: (@MainActor @Sendable () -> Void)? { get set }
    func startPlayback(for media: CustomPlayMedia, environment: AppEnvironment, at offsetSeconds: TimeInterval) throws
    func pausePlayback()
    func resumePlayback() throws
    func stopPlayback()
}

@MainActor
final class BundledCustomPlayAudioPlayer: NSObject, CustomPlayAudioControlling {
    var onPlaybackCompletion: (@MainActor @Sendable () -> Void)?

    private var player: AVPlayer?
    private var playbackCompletionObserver: NSObjectProtocol?
    private var holdsPlaybackSessionLease = false
    private var cancellables = Set<AnyCancellable>()

    override init() {
        super.init()
        NotificationCenter.default.publisher(for: AVAudioSession.interruptionNotification)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] notification in
                guard let self,
                      let typeValue = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
                      let interruptionType = AVAudioSession.InterruptionType(rawValue: typeValue) else { return }
                switch interruptionType {
                case .began:
                    self.player?.pause()
                    if self.holdsPlaybackSessionLease {
                        self.holdsPlaybackSessionLease = false
                        PlaybackAudioSessionSupport.deactivatePlaybackSessionIfNeeded()
                    }
                case .ended:
                    let shouldResume = (notification.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt)
                        .flatMap(AVAudioSession.InterruptionOptions.init(rawValue:))
                        .map { $0.contains(.shouldResume) } ?? false
                    if shouldResume { try? self.resumePlayback() }
                @unknown default: break
                }
            }
            .store(in: &cancellables)
    }

    func startPlayback(for media: CustomPlayMedia, environment: AppEnvironment, at offsetSeconds: TimeInterval = 0) throws {
        stopPlayback()
        let url = try resolvePlaybackURL(for: media, environment: environment)

        do {
            try PlaybackAudioSessionSupport.activatePlaybackSession()
            holdsPlaybackSessionLease = true

            let player = AVPlayer(url: url)
            player.automaticallyWaitsToMinimizeStalling = true
            attachPlaybackCompletionObserver(to: player.currentItem)
            let startTime = max(0, offsetSeconds)
            if startTime > 0 {
                let seekTime = CMTime(seconds: startTime, preferredTimescale: 600)
                player.seek(to: seekTime, toleranceBefore: .zero, toleranceAfter: .zero)
            }
            player.play()
            self.player = player
        } catch let playbackError as LocalAudioPlaybackError {
            releasePlaybackSessionLeaseIfNeeded()
            throw playbackError
        } catch {
            releasePlaybackSessionLeaseIfNeeded()
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

        if holdsPlaybackSessionLease == false {
            try PlaybackAudioSessionSupport.activatePlaybackSession()
            holdsPlaybackSessionLease = true
        }
        player.play()
    }

    func stopPlayback() {
        detachPlaybackCompletionObserver()
        player?.pause()
        player = nil
        releasePlaybackSessionLeaseIfNeeded()
    }

    private func attachPlaybackCompletionObserver(to item: AVPlayerItem?) {
        detachPlaybackCompletionObserver()
        guard let item else {
            return
        }

        playbackCompletionObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: item,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor [weak self] in
                self?.onPlaybackCompletion?()
            }
        }
    }

    private func detachPlaybackCompletionObserver() {
        guard let playbackCompletionObserver else {
            return
        }

        NotificationCenter.default.removeObserver(playbackCompletionObserver)
        self.playbackCompletionObserver = nil
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

    private func releasePlaybackSessionLeaseIfNeeded() {
        guard holdsPlaybackSessionLease else {
            return
        }

        holdsPlaybackSessionLease = false
        PlaybackAudioSessionSupport.deactivatePlaybackSessionIfNeeded()
    }
}

@MainActor
final class SilentBackgroundAudioKeepAlive: BackgroundAudioKeeping {
    private let engine = AVAudioEngine()
    private let playerNode = AVAudioPlayerNode()
    private let silentBuffer: AVAudioPCMBuffer
    private(set) var isActive = false
    private var cancellables = Set<AnyCancellable>()

    init() {
        let format = AVAudioFormat(standardFormatWithSampleRate: 44_100, channels: 1)!
        let frameCapacity: AVAudioFrameCount = 4_410
        let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCapacity)!
        buffer.frameLength = frameCapacity
        if let channelData = buffer.floatChannelData {
            channelData[0].initialize(repeating: 0, count: Int(frameCapacity))
        }
        silentBuffer = buffer

        engine.attach(playerNode)
        engine.connect(playerNode, to: engine.mainMixerNode, format: format)
        engine.prepare()

        NotificationCenter.default.publisher(for: AVAudioSession.interruptionNotification)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] notification in
                guard let self,
                      let typeValue = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
                      let interruptionType = AVAudioSession.InterruptionType(rawValue: typeValue) else { return }
                switch interruptionType {
                case .began:
                    if self.isActive {
                        self.isActive = false
                        PlaybackAudioSessionSupport.deactivatePlaybackSessionIfNeeded()
                    }
                case .ended:
                    let shouldResume = (notification.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt)
                        .flatMap(AVAudioSession.InterruptionOptions.init(rawValue:))
                        .map { $0.contains(.shouldResume) } ?? false
                    if shouldResume { self.begin() }
                @unknown default: break
                }
            }
            .store(in: &cancellables)
    }

    deinit {
        playerNode.stop()
        engine.stop()
    }

    func begin() {
        guard isActive == false else {
            return
        }

        do {
            try PlaybackAudioSessionSupport.activatePlaybackSession()
            if engine.isRunning == false {
                try engine.start()
            }
            if playerNode.isPlaying == false {
                playerNode.scheduleBuffer(silentBuffer, at: nil, options: [.loops], completionHandler: nil)
                playerNode.play()
            }
            isActive = true
        } catch {
            PlaybackAudioSessionSupport.deactivatePlaybackSessionIfNeeded()
            playerNode.stop()
            engine.stop()
            isActive = false
        }
    }

    func end() {
        guard isActive else {
            return
        }

        playerNode.stop()
        engine.pause()
        PlaybackAudioSessionSupport.deactivatePlaybackSessionIfNeeded()
        isActive = false
    }
}

@MainActor
enum PlaybackAudioSessionSupport {
    static let category: AVAudioSession.Category = .playback
    static let mode: AVAudioSession.Mode = .default
    static let options: AVAudioSession.CategoryOptions = [
        .mixWithOthers,
        .duckOthers,
        .interruptSpokenAudioAndMixWithOthers
    ]
    private static var activationCount = 0

    static func activatePlaybackSession() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(category, mode: mode, options: options)
        try session.setActive(true)
        activationCount += 1
    }

    static func deactivatePlaybackSessionIfNeeded() {
        guard activationCount > 0 else {
            return
        }

        activationCount -= 1
        guard activationCount == 0 else {
            return
        }

        let session = AVAudioSession.sharedInstance()
        do {
            try session.setActive(false, options: [.notifyOthersOnDeactivation])
        } catch {
            os_log("Audio session deactivation failed: %{public}@", log: .default, type: .error, error.localizedDescription)
        }
    }
}

enum KeyboardSupport {
    @MainActor
    static func dismissKeyboard() {
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }
}

extension View {
    func dismissesKeyboardOnBackgroundTap() -> some View {
        background(
            Color.clear
                .contentShape(Rectangle())
                .onTapGesture {
                    KeyboardSupport.dismissKeyboard()
                }
        )
    }
}
