# 🧪 [Testing Improvement] Add tests for formatPace and fix NaN/Infinity handling

## Description
This PR addresses a testing gap identified in the `formatPace` function within `utils/formatters.ts`.

### 🎯 **What**
The `formatPace` function calculates a running/activity pace given a `distance` and `duration`. It previously lacked any automated testing, which meant its output for boundary conditions (like zero and negative numbers) could potentially regress without being noticed. Additionally, it did not properly handle `NaN` or `Infinity` inputs, outputting the string `"NaN:NaN"` or `"Infinity:NaN"` which is undesirable in UI.

I've installed `vitest` as an industry-standard modern test framework, set up test execution scripts in `package.json`, and added a robust test suite. I also fixed the function itself to make tests pass when handling invalid mathematical inputs.

### 📊 **Coverage**
The newly added test file `utils/formatters.test.ts` covers the following scenarios:
* **Happy Paths:** Valid normal outputs for standard whole number and fractional inputs.
* **Zero Boundary:** Confirms `formatPace(0, x)` and `formatPace(x, 0)` return `"0:00"`.
* **Negative Boundary:** Confirms negative durations and distances return `"0:00"`.
* **NaN and Infinity:** Validates that when mathematically undefined conditions occur (like missing/corrupted data resolving to `NaN` or `Infinity`), the function gracefully returns `"0:00"` instead of a garbled string.

### ✨ **Result**
* `utils/formatters.ts` is now safer to refactor.
* The `formatPace` function is strictly more robust by returning fallback values rather than mathematically absurd UI strings.
* Test execution is cleanly handled through standard `npm test` and `npm run test:watch` commands.
