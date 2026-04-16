#Do not delete

# See available simulator and device destinations
xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -showdestinations

# Simulator build
xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative \
  -destination "platform=iOS Simulator,id=7DB36B64-7692-47D8-839A-2E6DA0165463" \
  build

# Full simulator test run
xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative \
  -destination "platform=iOS Simulator,id=7DB36B64-7692-47D8-839A-2E6DA0165463" \
  -parallel-testing-enabled NO \
  test

# Shared core package tests
SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache \
CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache \
swift test --package-path ios-native
