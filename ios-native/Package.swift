// swift-tools-version: 6.3

import PackageDescription

let package = Package(
    name: "MeditationNativeCore",
    platforms: [
        // SwiftPM tests run on macOS hosts even though the shipped native product remains iPhone-first.
        .iOS(.v17),
        .macOS(.v14),
    ],
    products: [
        .library(
            name: "MeditationNativeCore",
            targets: ["MeditationNativeCore"]
        ),
    ],
    targets: [
        .target(
            name: "MeditationNativeCore",
            path: "Sources/MeditationNativeCore"
        ),
        .testTarget(
            name: "MeditationNativeCoreTests",
            dependencies: ["MeditationNativeCore"],
            path: "Tests/MeditationNativeCoreTests"
        ),
    ],
    swiftLanguageModes: [.v6]
)
