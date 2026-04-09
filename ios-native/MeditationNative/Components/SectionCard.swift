import SwiftUI

struct SectionCard<Content: View>: View {
    let title: String
    let caption: String?
    @ViewBuilder let content: Content

    init(
        title: String,
        caption: String? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.title = title
        self.caption = caption
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                if let caption {
                    Text(caption)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }

            content
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Color(.secondarySystemBackground))
        )
    }
}

#Preview {
    SectionCard(title: "Preview", caption: "Calm reusable card") {
        Text("Sample content")
    }
    .padding()
}
