# Android Development Guide (Capacitor)

This document explains how your web app is wrapped using Capacitor to run natively on Android, and how you can push updates to generate a new APK.

## What is Capacitor?
Capacitor is a cross-platform native runtime that makes it easy to build modern web apps that run natively on iOS, Android, and the Web. It essentially takes your built web assets (HTML, CSS, JS) and runs them inside a native WebView. It also bridges web APIs with native SDKs, meaning you can access device features like the camera or GPS using JavaScript.

## Setup Recap
Your application has been configured with Capacitor:
1.  **Capacitor Core & CLI:** Installed via npm.
2.  **Android Platform Added:** A native Android project is now generated in the `android/` directory.
3.  **Permissions Configured:** The `android/app/src/main/AndroidManifest.xml` file has been updated to include necessary permissions like `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, and `WAKE_LOCK`.

## How to Push an Update to Android

Whenever you make changes to your React web application (e.g., editing `App.tsx` or other components), you need to sync those changes to the native Android project and build a new APK.

Follow these simple steps:

### Step 1: Build the Web App
Compile your latest React code into static files in the `dist` directory:
```bash
npm run build
```

### Step 2: Sync Web Assets to Android
Copy the freshly built files from the `dist` folder into the native `android` project using the Capacitor CLI:
```bash
npx cap sync android
```
*(This command copies your web assets and updates any native plugins if needed.)*

### Step 3: Generate the New APK
You can use Gradle (the build system for Android) directly from the command line to build a new Debug APK. This does not require an Android Developer account.

Navigate into the `android` folder and run the build command:
```bash
cd android
./gradlew assembleDebug
cd ..
```

### Step 4: Locate the APK
Once the build is complete, your new APK will be located at:
`android/app/build/outputs/apk/debug/app-debug.apk`

You can easily copy it to the root of your project for easy access:
```bash
cp android/app/build/outputs/apk/debug/app-debug.apk redline-debug.apk
```

Now you can transfer `redline-debug.apk` to your Android device via USB, email, or a cloud drive, and install it! (Make sure "Install from Unknown Sources" is enabled on your device).
