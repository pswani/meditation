#!/usr/bin/env zsh

set -euo pipefail

project="ios-native/MeditationNative.xcodeproj"
scheme="MeditationNative"
target="MeditationNative"
configuration="${MEDITATION_IOS_CONFIGURATION:-Debug}"
sdk="${MEDITATION_IOS_SIMULATOR_SDK:-iphonesimulator}"
requested_destination="${MEDITATION_IOS_SIMULATOR_DESTINATION:-}"
scheme_test_mode="${MEDITATION_IOS_RUN_SCHEME_TESTS:-auto}"
derived_data_path="${MEDITATION_IOS_DERIVED_DATA_PATH:-/tmp/meditation-ios-simulator-derived-data}"
clang_module_cache_path="${MEDITATION_IOS_CLANG_MODULE_CACHE_PATH:-/tmp/meditation-ios-clang-module-cache}"

destinations_output="$(xcodebuild -project "${project}" -scheme "${scheme}" -showdestinations 2>&1 || true)"

resolve_simulator_destination() {
  if [[ -n "${requested_destination}" ]]; then
    print -- "${requested_destination}"
    return 0
  fi

  local simulator_name
  simulator_name="$(
    print -r -- "${destinations_output}" \
      | sed -n 's/^[[:space:]]*{ platform:iOS Simulator,.* name:\([^}]*\) }.*/\1/p' \
      | rg '^iPhone ' -m 1 \
      || true
  )"

  if [[ -n "${simulator_name}" ]]; then
    print -- "platform=iOS Simulator,name=${simulator_name}"
    return 0
  fi

  local simulator_id
  simulator_id="$(
    xcrun simctl list devices available 2>/dev/null \
      | sed -n 's/^[[:space:]]*iPhone[^()]* (\([A-F0-9-]\+\)) ([^)]*)$/\1/p' \
      | head -n 1 \
      || true
  )"

  if [[ -n "${simulator_id}" ]]; then
    print -- "platform=iOS Simulator,id=${simulator_id}"
  fi
}

destination="$(resolve_simulator_destination)"

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
  build

if [[ "${scheme_test_mode}" == "0" ]]; then
  print "Skipping scheme XCTest run because MEDITATION_IOS_RUN_SCHEME_TESTS=0."
elif [[ -n "${destination}" ]]; then
  print "Testing ${scheme} on simulator destination: ${destination}"
  CLANG_MODULE_CACHE_PATH="${clang_module_cache_path}" \
  xcodebuild \
    -project "${project}" \
    -scheme "${scheme}" \
    -destination "${destination}" \
    -derivedDataPath "${derived_data_path}" \
    -parallel-testing-enabled NO \
    test
else
  if [[ "${scheme_test_mode}" == "1" ]]; then
    print "No eligible iPhone simulator destination was found for ${scheme}. Set MEDITATION_IOS_SIMULATOR_DESTINATION explicitly after checking -showdestinations."
    exit 1
  fi

  print "Skipping scheme XCTest run because Xcode did not list an eligible iPhone simulator destination for ${scheme}."
fi

print "Running shared native core package tests"
SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache \
CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache \
swift test --package-path ios-native
