# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-05-27

### Added
- Add native Android application in Kotlin to improve GPS tracking reliability and performance.
- Add real-time GPS run tracking using `FusedLocationProviderClient`.
- Add local storage using `SharedPreferences` to save and display run history on Android.
- Add `redline-android.apk` to the repository root for direct user download and installation.

### Changed
- **Breaking**: Restructure the repository into an npm workspace monorepo (`apps/web` and `apps/android`).
- Update Vercel deployment requirements (Root Directory must now be set to `apps/web`).

### Removed
- **Breaking**: Remove Capacitor Android wrapper and all associated boilerplate.
- Remove Supabase authentication barriers from the web app to allow immediate access for local prototyping.
