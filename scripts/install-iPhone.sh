#!/usr/bin/env bash
set -euo pipefail

PROJECT="ios-native/MeditationNative.xcodeproj"
SCHEME="MeditationNative"
DEVICE_NAME="Prashant’s iPhone"
TEAM_ID="435KZ98WJR"
DERIVED_DATA=".build/ios"
APP_PATH="$DERIVED_DATA/Build/Products/Debug-iphoneos/MeditationNative.app"

echo "Building app for $DEVICE_NAME..."

xcodebuild \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -destination "platform=iOS,name=$DEVICE_NAME" \
  -derivedDataPath "$DERIVED_DATA" \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  -allowProvisioningUpdates \
  build

echo "Installing app on $DEVICE_NAME..."

xcrun devicectl device install app \
  --device "$DEVICE_NAME" \
  "$APP_PATH"

echo "Done."