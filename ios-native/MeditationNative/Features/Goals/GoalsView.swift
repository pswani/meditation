import SwiftUI

struct GoalsView: View {
    @ObservedObject var viewModel: ShellViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Goals")
                    .font(.largeTitle.weight(.semibold))

                SectionCard(title: "Sankalpas", caption: "Seed local goals only") {
                    ForEach(viewModel.snapshot.sankalpas) { sankalpa in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(sankalpa.title)
                            Text(sankalpa.kind.rawValue)
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                SectionCard(title: "Summary by meditation type", caption: "Sample local snapshot") {
                    ForEach(viewModel.snapshot.summary.byMeditationTypeRows) { row in
                        HStack {
                            Text(row.label)
                            Spacer()
                            Text(row.value)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Goals")
    }
}
