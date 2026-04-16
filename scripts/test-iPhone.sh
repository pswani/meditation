# Physical iPhone build by name
xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative \
  -destination "platform=iOS,name=Prashant’s iPhone" \
  build


# Physical iPhone test run
xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative \
  -destination "platform=iOS,name=Prashant’s iPhone" \
  DEVELOPMENT_TEAM=435KZ98WJR \
  -allowProvisioningUpdates \
  -parallel-testing-enabled NO \
  test

