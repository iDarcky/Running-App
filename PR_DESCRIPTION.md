# Feature: Capacitor Android Wrapper

## Description
This PR integrates `@capacitor/core` and `@capacitor/android` to wrap the React web application as a native Android application. It provides an `ANDROID_GUIDE.md` to assist developers in building and pushing updates for Android platforms easily using the native Gradle build system.

## Changes Included:
- **Dependencies Installed:** Added `@capacitor/core`, `@capacitor/cli`, and `@capacitor/android`.
- **Capacitor Configuration Initialized:** App ID initialized with `com.redline.app`.
- **Android Platform Configured:** Added the `android` native directory.
- **Permissions Updated:** `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`, and `WAKE_LOCK` are added in the `android/app/src/main/AndroidManifest.xml` file.
- **Guide File Created:** Added `ANDROID_GUIDE.md` containing detailed step-by-step instructions for syncing web assets and generating APK builds using the local Gradle wrapper setup, bypassing the need for an Android Developer Account for test builds.
- **Debug APK Provided:** Automatically built a local copy of the `redline-debug.apk` directly into the project root directory.

## Testing Performed:
- Verified `npm test` successfully completed over formatters tests.
- Verified `npm run build` completes web compilation successfully.
- Verified `./gradlew assembleDebug` completes android compilation outputting `app-debug.apk` with no errors.

## Recent Updates:
- Integrated edge-to-edge support for Android using Capacitor's specific css safe-area-inset variables.
- Added `@capacitor/status-bar` initialization code to `App.tsx` to overlay webview content correctly behind transparent status bar.
- Updated main application wrappers and bottom navs to correctly pad out system safe areas utilizing `pt-safe` and `pb-safe`.
- Incremented Android `versionName` to `0.0.1` inside `build.gradle`.
- Stored newly compiled debug APK into `/apks/0.0.1.apk`.

- Added extra margin bottom (`mb-4`) to the mobile floating bottom navigation to give it extra spacing from the safe area edge.
- Re-built and refreshed APK in `/apks/0.0.1.apk`.
