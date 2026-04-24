#!/usr/bin/env zsh

set -euo pipefail

project="ios-native/MeditationNative.xcodeproj"
scheme="MeditationNative"
target="MeditationNative"
configuration="${MEDITATION_IOS_CONFIGURATION:-Debug}"
sdk="${MEDITATION_IOS_DEVICE_SDK:-iphoneos}"
requested_destination="${MEDITATION_IOS_DEVICE_DESTINATION:-}"
development_team="${MEDITATION_IOS_DEVELOPMENT_TEAM:-435KZ98WJR}"
scheme_test_mode="${MEDITATION_IOS_RUN_SCHEME_TESTS:-auto}"
derived_data_path="${MEDITATION_IOS_DERIVED_DATA_PATH:-/tmp/meditation-ios-device-derived-data}"
clang_module_cache_path="${MEDITATION_IOS_CLANG_MODULE_CACHE_PATH:-/tmp/meditation-ios-clang-module-cache}"

destinations_output="$(xcodebuild -project "${project}" -scheme "${scheme}" -showdestinations 2>&1 || true)"

resolve_device_destination() {
  if [[ -n "${requested_destination}" ]]; then
    print -- "${requested_destination}"
    return 0
  fi

  local device_name
  device_name="$(
    print -r -- "${destinations_output}" \
      | sed -n 's/^[[:space:]]*{ platform:iOS,.* name:\([^}]*\) }.*/\1/p' \
      | grep -Fv 'Any iOS Device' \
      | head -n 1 \
      || true
  )"

  if [[ -n "${device_name}" ]]; then
    print -- "platform=iOS,name=${device_name}"
  fi
}

destination="$(resolve_device_destination)"

print "Available Xcode destinations:"
print -r -- "${destinations_output}"

print "Building ${scheme} for ${sdk} (${configuration})"
CLANG_MODULE_CACHE_PATH="${clang_module_cache_path}" \
xcodebuild \
  -project "${project}" \
  -scheme "${scheme}" \
  -sdk "${sdk}" \
  -configuration "${configuration}" \
  -derivedDataPath "${derived_data_path}" \
  DEVELOPMENT_TEAM="${development_team}" \
  -allowProvisioningUpdates \
  build

if [[ "${scheme_test_mode}" == "0" ]]; then
  print "Skipping scheme XCTest run because MEDITATION_IOS_RUN_SCHEME_TESTS=0."
elif [[ -n "${destination}" ]]; then
  print "Testing ${scheme} on device destination: ${destination}"
  CLANG_MODULE_CACHE_PATH="${clang_module_cache_path}" \
  xcodebuild \
    -project "${project}" \
    -scheme "${scheme}" \
    -destination "${destination}" \
    -derivedDataPath "${derived_data_path}" \
    DEVELOPMENT_TEAM="${development_team}" \
    -allowProvisioningUpdates \
    -parallel-testing-enabled NO \
    test
else
  if [[ "${scheme_test_mode}" == "1" ]]; then
    print "No eligible iPhone destination was found for ${scheme}. Set MEDITATION_IOS_DEVICE_DESTINATION explicitly after checking -showdestinations."
    exit 1
  fi

  print "Skipping scheme XCTest run because Xcode did not list an eligible iPhone destination for ${scheme}."
fi

print "Running shared native core package tests"
SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache \
CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache \
swift test --package-path ios-native
