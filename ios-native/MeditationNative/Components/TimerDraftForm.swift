import SwiftUI

struct MinuteValueField: View {
    let title: String
    @Binding var value: Int
    var range: ClosedRange<Int>
    var step: Int = 1
    var helperText: String?

    @State private var textValue: String

    init(
        title: String,
        value: Binding<Int>,
        range: ClosedRange<Int>,
        step: Int = 1,
        helperText: String? = nil
    ) {
        self.title = title
        self._value = value
        self.range = range
        self.step = step
        self.helperText = helperText
        self._textValue = State(initialValue: value.wrappedValue > 0 ? String(value.wrappedValue) : "")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline, spacing: 12) {
                Text(title)
                Spacer()
                TextField("0", text: $textValue)
                    .keyboardType(.numberPad)
                    .multilineTextAlignment(.trailing)
                    .textFieldStyle(.roundedBorder)
                    .frame(width: 84)
                Text("min")
                    .foregroundStyle(.secondary)
            }

            Stepper("Use +/- for quick changes", value: stepperBinding, in: range, step: step)
                .font(.footnote)
                .foregroundStyle(.secondary)

            if let helperText {
                Text(helperText)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .onChange(of: textValue) { _, newValue in
            applyTextValue(newValue)
        }
        .onChange(of: value) { _, newValue in
            let normalizedTextValue = newValue > 0 ? String(newValue) : ""
            if textValue != normalizedTextValue {
                textValue = normalizedTextValue
            }
        }
    }

    private var stepperBinding: Binding<Int> {
        Binding(
            get: { min(max(value, range.lowerBound), range.upperBound) },
            set: { newValue in
                value = newValue
                textValue = String(newValue)
            }
        )
    }

    private func applyTextValue(_ newValue: String) {
        let digitsOnly = newValue.filter(\.isNumber)
        if digitsOnly != newValue {
            textValue = digitsOnly
            return
        }

        guard digitsOnly.isEmpty == false else {
            value = 0
            return
        }

        if let parsedValue = Int(digitsOnly) {
            value = min(parsedValue, range.upperBound)
        }
    }
}

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
                    MinuteValueField(
                        title: "Duration",
                        value: $draft.durationMinutes,
                        range: 1 ... 180,
                        step: 5,
                        helperText: "Fixed sessions count down to a scheduled finish."
                    )
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

                            MinuteValueField(
                                title: "Interval",
                                value: intervalMinutesBinding,
                                range: 1 ... 90,
                                step: 5,
                                helperText: "Each interval should stay shorter than the total fixed session."
                            )
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
            get: { draft.intervalMinutes ?? 0 },
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
