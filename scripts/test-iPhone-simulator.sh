#!/usr/bin/env zsh

set -euo pipefail

project="ios-native/MeditationNative.xcodeproj"
scheme="MeditationNative"
target="MeditationNative"
configuration="${MEDITATION_IOS_CONFIGURATION:-Debug}"
sdk="${MEDITATION_IOS_SIMULATOR_SDK:-iphonesimulator}"
destination="${MEDITATION_IOS_SIMULATOR_DESTINATION:-platform=iOS Simulator,name=iPhone 17 Pro,OS=26.4}"

print "Available Xcode destinations:"
xcodebuild -project "${project}" -scheme "${scheme}" -showdestinations || true

print "Building ${target} for ${sdk} (${configuration})"
xcodebuild \
  -project "${project}" \
  -target "${target}" \
  -sdk "${sdk}" \
  -configuration "${configuration}" \
  build

if [[ "${MEDITATION_IOS_RUN_SCHEME_TESTS:-0}" == "1" ]]; then
  print "Testing ${scheme} on simulator destination: ${destination}"
  xcodebuild \
    -project "${project}" \
    -scheme "${scheme}" \
    -destination "${destination}" \
    -parallel-testing-enabled NO \
    test
else
  print "Skipping scheme XCTest run; set MEDITATION_IOS_RUN_SCHEME_TESTS=1 when Xcode lists an eligible simulator destination for ${scheme}."
fi

print "Running shared native core package tests"
SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache \
CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache \
swift test --package-path ios-native
