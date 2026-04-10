import SwiftUI

struct PracticeMessageText: View {
    let message: String
    let color: Color

    var body: some View {
        Text(message)
            .font(.footnote)
            .foregroundStyle(color)
    }
}

func customPlaySoundSummary(_ customPlay: CustomPlay) -> String {
    let startSound = customPlay.startSoundName ?? "None"
    let endSound = customPlay.endSoundName ?? "None"
    return "Start sound: \(startSound) • End sound: \(endSound)"
}
