// swift-tools-version: 6.3

import PackageDescription

let package = Package(
    name: "MeditationNativeCore",
    platforms: [
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
