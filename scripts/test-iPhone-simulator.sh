#!/usr/bin/env zsh
# Do not delete

set -euo pipefail

SIMULATOR_DESTINATION="${MEDITATION_IOS_SIMULATOR_DESTINATION:-platform=iOS Simulator,id=7DB36B64-7692-47D8-839A-2E6DA0165463}"

# See available simulator and device destinations
destinations="$(xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -showdestinations 2>&1)"
print -r -- "${destinations}"

destination_available=false
if [[ "${SIMULATOR_DESTINATION}" == *"id="* ]]; then
  simulator_id="${SIMULATOR_DESTINATION##*id=}"
  simulator_id="${simulator_id%%,*}"
  [[ "${destinations}" == *"id:${simulator_id}"* ]] && destination_available=true
elif [[ "${SIMULATOR_DESTINATION}" == *"name="* ]]; then
  simulator_name="${SIMULATOR_DESTINATION##*name=}"
  simulator_name="${simulator_name%%,*}"
  [[ "${destinations}" == *"name:${simulator_name}"* ]] && destination_available=true
else
  [[ "${destinations}" == *"platform:iOS Simulator"* ]] && destination_available=true
fi

if [[ "${destination_available}" != true ]]; then
  print -u2 "The configured simulator destination is not available to Xcode: ${SIMULATOR_DESTINATION}"
  print -u2 "Set MEDITATION_IOS_SIMULATOR_DESTINATION to an eligible simulator from the list above, or install the matching iOS simulator runtime in Xcode Settings > Components."
  exit 70
fi

# Simulator build
xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative \
  -destination "${SIMULATOR_DESTINATION}" \
  build

# Full simulator test run
xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative \
  -destination "${SIMULATOR_DESTINATION}" \
  -parallel-testing-enabled NO \
  test

# Shared core package tests
SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache \
CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache \
swift test --package-path ios-native



# # Show available destinations first
# xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -showdestinations


# # Simulator build by name
# xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative \
#   -destination "platform=iOS Simulator,name=iPhone 17 Pro,OS=26.4" \
#   build

# # Simulator test by name
# xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative \
#   -destination "platform=iOS Simulator,name=iPhone 17 Pro,OS=26.4" \
#   -parallel-testing-enabled NO \
#   test
