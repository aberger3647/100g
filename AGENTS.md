# AGENTS.md

## Cursor Cloud specific instructions

### What this is
"100 Grams" is an **Expo (React Native) mobile app** that scans food barcodes, fetches
nutrition data from the Open Food Facts API, and compares products normalized to 100 g.
There is a single app; no backend service.

### Running it in the cloud VM
- There is no mobile device/emulator here, so run the **web** target: `npx expo start --web`
  (serves on http://localhost:8081 via Metro + `react-native-web`). `npm run android` / `npm run ios`
  are not usable in this environment.
- Dependencies are installed with **npm** (`package-lock.json`). The startup update script runs `npm install`.

### Lint / typecheck / tests
- Lint: `npm run lint` (a.k.a. `npx expo lint`). Passes with only warnings; treat warnings as non-blocking.
- There is **no test script** and no test framework configured.
- `npx tsc --noEmit` reports several **pre-existing** type errors (e.g. `responsiveOrientation`,
  `ScrollView vertical`, `hitSlop` on styles). These are not part of any repo script; Metro/Babel bundles
  the app regardless and it runs fine. Do not treat these as environment breakage.

### Camera gating (important gotcha for web testing)
- The home/scan screen and the comparison **detail** screen both gate their UI behind
  `Camera.requestCameraPermissionsAsync()`. On web this calls `getUserMedia({video:true})`, so with **no
  camera device the status is "denied"** and those screens render "No access to camera".
- To exercise the full app on web, launch Chrome with a fake camera so permission is granted:
  `google-chrome --use-fake-device-for-media-stream --use-fake-ui-for-media-stream --user-data-dir=/tmp/chrome-fakecam http://localhost:8081`
- The **History list** screen (`app/(tabs)/history/index.tsx`) does not require the camera and works regardless.

### Data & network
- Persistence uses `@react-native-async-storage/async-storage`, which on web maps to `window.localStorage`
  with the raw key. Saved comparisons live under the `comparisons` key; you can seed/inspect them via the
  browser console (e.g. `localStorage.setItem('comparisons', ...)`).
- Barcode scanning fetches from `https://world.openfoodfacts.org/api/v0/product/<barcode>.json` and needs
  outbound network access.
