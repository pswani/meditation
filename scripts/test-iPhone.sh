#!/usr/bin/env zsh

set -euo pipefail

project="ios-native/MeditationNative.xcodeproj"
scheme="MeditationNative"
target="MeditationNative"
configuration="${MEDITATION_IOS_CONFIGURATION:-Debug}"
sdk="${MEDITATION_IOS_DEVICE_SDK:-iphoneos}"
destination="${MEDITATION_IOS_DEVICE_DESTINATION:-platform=iOS,name=Prashant’s iPhone}"
development_team="${MEDITATION_IOS_DEVELOPMENT_TEAM:-435KZ98WJR}"

print "Available Xcode destinations:"
xcodebuild -project "${project}" -scheme "${scheme}" -showdestinations || true

print "Building ${target} for ${sdk} (${configuration})"
xcodebuild \
  -project "${project}" \
  -target "${target}" \
  -sdk "${sdk}" \
  -configuration "${configuration}" \
  DEVELOPMENT_TEAM="${development_team}" \
  -allowProvisioningUpdates \
  build

if [[ "${MEDITATION_IOS_RUN_SCHEME_TESTS:-0}" == "1" ]]; then
  print "Testing ${scheme} on device destination: ${destination}"
  xcodebuild \
    -project "${project}" \
    -scheme "${scheme}" \
    -destination "${destination}" \
    DEVELOPMENT_TEAM="${development_team}" \
    -allowProvisioningUpdates \
    -parallel-testing-enabled NO \
    test
else
  print "Skipping scheme XCTest run; set MEDITATION_IOS_RUN_SCHEME_TESTS=1 when Xcode lists an eligible device destination for ${scheme}."
fi

print "Running shared native core package tests"
SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache \
CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache \
swift test --package-path ios-native
