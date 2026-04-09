import SwiftUI

struct TimerDraftForm: View {
    @Binding var draft: TimerSettingsDraft
    var headline: String
    var showsIntroCopy: Bool = true

    var body: some View {
        SectionCard(title: headline, caption: showsIntroCopy ? caption : nil) {
            VStack(alignment: .leading, spacing: 16) {
                Picker("Mode", selection: $draft.mode) {
                    Text("Fixed").tag(TimerSettingsDraft.Mode.fixedDuration)
                    Text("Open-ended").tag(TimerSettingsDraft.Mode.openEnded)
                }
                .pickerStyle(.segmented)

                if draft.mode == .fixedDuration {
                    VStack(alignment: .leading, spacing: 8) {
                        Stepper(value: durationMinutesBinding, in: 1 ... 180) {
                            HStack {
                                Text("Duration")
                                Spacer()
                                Text("\(draft.durationMinutes) min")
                                    .foregroundStyle(.secondary)
                            }
                        }

                        Text("Fixed sessions count down to a scheduled finish.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                } else {
                    Text("Open-ended sessions track elapsed time until you choose to end the sit.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Picker("Meditation type", selection: $draft.meditationType) {
                    Text("Choose").tag(MeditationType?.none)
                    ForEach(ReferenceData.meditationTypes, id: \.self) { meditationType in
                        Text(meditationType.rawValue).tag(Optional(meditationType))
                    }
                }

                DisclosureGroup("Sounds") {
                    VStack(alignment: .leading, spacing: 12) {
                        soundPicker(
                            title: "Start sound",
                            selection: $draft.startSoundName
                        )

                        soundPicker(
                            title: "End sound",
                            selection: $draft.endSoundName
                        )

                        Toggle("Interval sounds", isOn: intervalEnabledBinding)

                        if draft.intervalSoundName != nil {
                            soundPicker(
                                title: "Interval sound",
                                selection: $draft.intervalSoundName
                            )

                            Stepper(value: intervalMinutesBinding, in: 1 ... 90) {
                                HStack {
                                    Text("Interval")
                                    Spacer()
                                    Text("\(draft.intervalMinutes ?? 5) min")
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                    }
                    .padding(.top, 8)
                }
            }
        }
    }

    private var caption: String? {
        "Local-first timer defaults that also power the next session start."
    }

    private var durationMinutesBinding: Binding<Int> {
        Binding(
            get: { max(1, draft.durationMinutes) },
            set: { draft.durationMinutes = $0 }
        )
    }

    private var intervalEnabledBinding: Binding<Bool> {
        Binding(
            get: { draft.intervalSoundName != nil },
            set: { isEnabled in
                if isEnabled {
                    draft.intervalSoundName = draft.intervalSoundName ?? TimerSoundOption.gong.rawValue
                    draft.intervalMinutes = max(1, draft.intervalMinutes ?? 5)
                } else {
                    draft.intervalSoundName = nil
                    draft.intervalMinutes = nil
                }
            }
        )
    }

    private var intervalMinutesBinding: Binding<Int> {
        Binding(
            get: { max(1, draft.intervalMinutes ?? 5) },
            set: { draft.intervalMinutes = $0 }
        )
    }

    @ViewBuilder
    private func soundPicker(title: String, selection: Binding<String?>) -> some View {
        Picker(title, selection: selection) {
            Text("None").tag(String?.none)
            ForEach(ReferenceData.timerSoundOptions, id: \.self) { sound in
                Text(sound.rawValue).tag(Optional(sound.rawValue))
            }
        }
    }
}
