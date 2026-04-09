// swift-tools-version: 6.3

import PackageDescription

let package = Package(
    name: "MeditationNativeCore",
    platforms: [
        .macOS(.v14),
    ],
    products: [
        .library(
            name: "MeditationNativeCore",
            targets: ["MeditationNative"]
        ),
    ],
    targets: [
        .target(
            name: "MeditationNative",
            path: "Sources/MeditationNativeCore"
        ),
        .testTarget(
            name: "MeditationNativeCoreTests",
            dependencies: ["MeditationNative"],
            path: "Tests/MeditationNativeCoreTests"
        ),
    ],
    swiftLanguageModes: [.v6]
)
