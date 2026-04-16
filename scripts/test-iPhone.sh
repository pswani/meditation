# Physical iPhone build
xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative \
  -destination "platform=iOS,id=00008150-00042DE92E84401C" \
  build

# Physical iPhone test run
xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative \
  -destination "platform=iOS,id=00008150-00042DE92E84401C" \
  -parallel-testing-enabled NO \
  test
