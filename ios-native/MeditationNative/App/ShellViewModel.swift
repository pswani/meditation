import Combine
import Foundation
import SwiftUI

@MainActor
final class ShellViewModel: ObservableObject {
    @Published private(set) var snapshot: AppSnapshot
    @Published private(set) var environment: AppEnvironment
    @Published private(set) var isSeedData: Bool
    @Published private(set) var activeSession: ActiveTimerSession?
    @Published private(set) var now = Date()
    @Published private(set) var notificationPermissionState: NotificationPermissionState = .checking
    @Published var timerValidationMessage: String?
    @Published var manualLogValidationMessage: String?
    @Published var persistenceMessage: String?

    private let repository: LocalAppSnapshotRepository
    private let notificationScheduler: NotificationScheduling
    private let soundPlayer: TimerSoundPlaying
    private var clockCancellable: AnyCancellable?

    init(
        repository: LocalAppSnapshotRepository = .live(
            environment: AppEnvironment.from()
        ),
        notificationScheduler: NotificationScheduling = LiveNotificationScheduler(),
        soundPlayer: TimerSoundPlaying = SystemSoundPlayer()
    ) {
        self.repository = repository
        self.notificationScheduler = notificationScheduler
        self.soundPlayer = soundPlayer

        do {
            let loadedSnapshot = try repository.loadOrSeed(seed: SampleData.snapshot)
            self.snapshot = loadedSnapshot
            self.isSeedData = loadedSnapshot == SampleData.snapshot
        } catch {
            self.snapshot = SampleData.snapshot
            self.isSeedData = true
        }

        self.environment = repository.environment
    }

    deinit {
        clockCancellable?.cancel()
    }

    var timerDraftBinding: Binding<TimerSettingsDraft> {
        Binding(
            get: { self.snapshot.timerDraft },
            set: { [weak self] newValue in
                self?.snapshot.timerDraft = newValue
                self?.persistSnapshot()
            }
        )
    }

    var recentSessionLogs: [SessionLog] {
        snapshot.recentSessionLogs.sorted { $0.endedAt > $1.endedAt }
    }

    func startTimer() {
        timerValidationMessage = nil
        persistenceMessage = nil

        do {
            activeSession = try TimerFeature.makeActiveSession(from: snapshot.timerDraft, now: Date())
            now = Date()
            soundPlayer.playSound(named: activeSession?.configuration.startSoundName)
            startClock()
            rescheduleTimerNotificationIfNeeded()
        } catch let error as TimerValidationError {
            timerValidationMessage = error.message
        } catch {
            timerValidationMessage = "The timer could not start with the current setup."
        }
    }

    func pauseTimer() {
        guard var activeSession else {
            return
        }

        activeSession.pause(at: now)
        self.activeSession = activeSession
        Task {
            await notificationScheduler.cancelTimerCompletionNotification()
        }
    }

    func resumeTimer() {
        guard var activeSession else {
            return
        }

        activeSession.resume(at: Date())
        self.activeSession = activeSession
        now = Date()
        rescheduleTimerNotificationIfNeeded()
    }

    func endTimerManually() {
        guard let activeSession else {
            return
        }

        let status: SessionStatus
        if activeSession.configuration.mode == .fixedDuration {
            status = .endedEarly
        } else {
            status = .completed
        }

        finishTimer(status: status, endedAt: Date())
    }

    func saveManualLog(_ draft: ManualLogDraft) -> Bool {
        manualLogValidationMessage = nil
        persistenceMessage = nil

        do {
            let log = try TimerFeature.makeManualLog(from: draft)
            insertLog(log)
            return true
        } catch let error as ManualLogValidationError {
            manualLogValidationMessage = error.message
            return false
        } catch {
            manualLogValidationMessage = "The manual log could not be saved."
            return false
        }
    }

    func handleScenePhaseChange(isActive: Bool) {
        if isActive {
            now = Date()
            handleClockTick(now)
            Task {
                await refreshNotificationPermissionState()
            }
        }
    }

    func refreshNotificationPermissionState() async {
        notificationPermissionState = await notificationScheduler.authorizationState()
    }

    func requestNotificationPermission() async {
        notificationPermissionState = await notificationScheduler.requestAuthorization()
    }

    func activeTimerPrimaryText() -> String {
        guard let activeSession else {
            return "00:00"
        }

        if let remainingSeconds = activeSession.remainingSeconds(at: now) {
            return formatClock(remainingSeconds)
        }

        return formatClock(activeSession.elapsedSeconds(at: now))
    }

    func activeTimerSecondaryText() -> String {
        guard let activeSession else {
            return ""
        }

        if activeSession.configuration.mode == .fixedDuration {
            return "Elapsed \(formatClock(activeSession.elapsedSeconds(at: now)))"
        }

        return "Open-ended practice"
    }

    private func startClock() {
        clockCancellable?.cancel()
        clockCancellable = Timer.publish(every: 1, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] currentDate in
                self?.handleClockTick(currentDate)
            }
    }

    private func stopClock() {
        clockCancellable?.cancel()
        clockCancellable = nil
    }

    private func handleClockTick(_ currentDate: Date) {
        now = currentDate

        guard var activeSession else {
            return
        }

        if activeSession.isPaused == false,
           activeSession.nextDueIntervalCount(at: currentDate) != nil {
            soundPlayer.playSound(named: activeSession.configuration.intervalSoundName)
        }

        self.activeSession = activeSession

        if activeSession.configuration.mode == .fixedDuration,
           activeSession.remainingSeconds(at: currentDate) == 0 {
            let endedAt = activeSession.targetEndAt() ?? currentDate
            finishTimer(status: .completed, endedAt: endedAt)
        }
    }

    private func finishTimer(status: SessionStatus, endedAt: Date) {
        guard let activeSession else {
            return
        }

        let log = activeSession.makeSessionLog(status: status, endedAt: endedAt)
        soundPlayer.playSound(named: activeSession.configuration.endSoundName)
        insertLog(log)
        self.activeSession = nil
        stopClock()

        Task {
            await notificationScheduler.cancelTimerCompletionNotification()
        }
    }

    private func insertLog(_ log: SessionLog) {
        snapshot.recentSessionLogs = (snapshot.recentSessionLogs + [log])
            .sorted { $0.endedAt > $1.endedAt }
        persistSnapshot()
    }

    private func persistSnapshot() {
        do {
            try repository.save(snapshot)
            isSeedData = snapshot == SampleData.snapshot
        } catch {
            persistenceMessage = "Local changes could not be saved right now."
        }
    }

    private func rescheduleTimerNotificationIfNeeded() {
        guard let activeSession,
              activeSession.configuration.mode == .fixedDuration,
              let targetEndAt = activeSession.targetEndAt()
        else {
            return
        }

        Task {
            await notificationScheduler.scheduleTimerCompletionNotification(
                at: targetEndAt,
                meditationType: activeSession.configuration.meditationType
            )
        }
    }

    private func formatClock(_ totalSeconds: Int) -> String {
        let hours = totalSeconds / 3_600
        let minutes = (totalSeconds % 3_600) / 60
        let seconds = totalSeconds % 60

        if hours > 0 {
            return String(format: "%02d:%02d:%02d", hours, minutes, seconds)
        }

        return String(format: "%02d:%02d", minutes, seconds)
    }
}
