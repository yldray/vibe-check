# React Native / Expo — chronic issues

### EXPO-001 · Secrets in EXPO_PUBLIC_ vars
**Severity:** P0
**Why it breaks:** AI puts private API keys in `EXPO_PUBLIC_*`; they are embedded in the app.
**How to test:** Search the exported bundle for key prefixes.
**Pass:** No private keys.
**Fix:** Move calls to your backend.

### EXPO-002 · OTA update breaks native code
**Severity:** P0
**Why it breaks:** A JS update is pushed that needs a native module the installed build doesn't have. With `runtimeVersion: { policy: "appVersion" }` or a fixed string, every build of one version shares a runtime, so an update made for one build reaches another build of the same version with different native code.
**How to test:** Install the store build, push the update to a preview channel. Read `runtimeVersion` in the app config; install two builds of one version with different native dependencies and publish one update to their channel.
**Pass:** App opens and works.
**Fix:** Use `runtimeVersion` policy; rebuild when native deps change. Prefer `policy: "fingerprint"`, or bump the version on every native change. If the app doesn't use OTA, remove `expo-updates` and `updates.url` so no build can download an update.

### EXPO-003 · Works in Expo Go, fails in production build
**Severity:** P0
**Why it breaks:** Native modules or config missing in the dev build / EAS build.
**How to test:** Test an EAS production build on a real device.
**Pass:** All features work.
**Fix:** Test release builds, not Expo Go.

### EXPO-004 · Missing permission strings
**Severity:** P0
**Why it breaks:** iOS rejects or crashes without usage descriptions; AI forgets `infoPlist` / plugin config.
**How to test:** Trigger every permission on a fresh install.
**Pass:** Clear, specific prompts; no crash.
**Fix:** Set permission messages in app config plugins.

### EXPO-005 · Keyboard covers inputs
**Severity:** P1
**Why it breaks:** No KeyboardAvoidingView / wrong behavior on Android.
**How to test:** Fill every form on a small Android and iPhone.
**Pass:** The focused input and the Save / Submit button stay visible.
**Fix:** KeyboardAvoidingView or react-native-keyboard-controller.

### EXPO-006 · FlatList performance
**Severity:** P1
**Why it breaks:** ScrollView with map() over big lists; no keyExtractor.
**How to test:** Scroll a list with 1,000 items on a low-end Android.
**Pass:** Smooth scroll, no blank areas.
**Fix:** FlatList / FlashList with stable keys.

### EXPO-007 · Safe area and notch
**Severity:** P1
**Why it breaks:** Content under the status bar or home indicator.
**How to test:** Check on notch iPhone and Android with gesture nav.
**Pass:** Nothing hidden.
**Fix:** react-native-safe-area-context.

### EXPO-008 · Deep links broken
**Severity:** P1
**Why it breaks:** Scheme / universal links not configured or route not handled on cold start.
**How to test:** Open a link with the app killed and in background: `xcrun simctl openurl booted <scheme>://<path>` and `adb shell am start -a android.intent.action.VIEW -d "<scheme>://<path>" <package>`.
**Pass:** Opens the right screen both times. The scheme is in `CFBundleURLTypes` and in an Android `VIEW`/`DEFAULT`/`BROWSABLE` intent filter; a bare React Native AppDelegate forwards `openURL` and `continueUserActivity` to `RCTLinkingManager`; OS links and push-body links go through one router with the same auth guard.
**Fix:** Configure scheme + associated domains; handle initial URL.

### EXPO-019 · Invisible layers swallow touches
**Severity:** P1
**Why it breaks:** Controls hidden with `opacity: 0`, a root-level `<Modal>` that never closed, or a native fullscreen player left mounted sit on top of the screen. The UI looks fine but nothing responds to taps, often only after a notification opens the app.
**How to test:** Hide the player controls, open the app from a notification, close a video; tap every button. On Android, also hide the player controls and tap the video itself (see `EXPO-026`). `fullscreen={true}` on a video component presents a native player modally that unmount never dismisses; a JS reload that "fixes" frozen taps points to such a leftover.
**Pass:** Every visible control responds.
**Fix:** `pointerEvents="none"` on hidden layers; an overlay `View` instead of a root `Modal`; unmount native fullscreen views.

### EXPO-020 · Notification tap navigates before the screen exists
**Severity:** P1
**Why it breaks:** The tap handler calls `navigate` while the user is logged out or the target stack isn't mounted yet. React Navigation throws or shows a black screen, and a retry loop keeps firing.
**How to test:** Kill the app, log out, tap a notification; repeat while logged in.
**Pass:** Logged out: login first, then the target opens; logged in: the target opens once.
**Fix:** Store the pending target and apply it once the stack is ready; skip `reset` if already on that route.

### EXPO-021 · Never measured on a 90/120 Hz mid-range Android
**Severity:** P1
**Why it breaks:** AI tunes scrolling and animation on an emulator or a flagship. Many mid-range Androids run at 120 Hz, so each frame has about 8 ms instead of 16; with a 12–13 ms median frame most frames miss. Twice the frames also means twice the allocations and frequent GC: periodic stutter nobody on the team can reproduce.
**How to test:** Release build on a mid-range Android with a 90/120 Hz screen (`adb shell dumpsys display | grep -i "refreshRate\|mActiveMode"`); `adb shell dumpsys gfxinfo <package> reset`, scroll the main list for 30 s, then `adb shell dumpsys gfxinfo <package>`.
**Pass:** Janky frames under 5%, 90th percentile under one frame budget, missed vsyncs near 0.
**Fix:** Remove per-frame work first (JS-driven animation, real-time blur, full-size decodes). A video or content app gains nothing from 120 Hz and can request a 60 Hz display mode with the same resolution (`preferredDisplayModeId`, `preferredRefreshRate` as fallback).

### EXPO-022 · Images decoded at full resolution on Android
**Severity:** P1
**Why it breaks:** AI points `<Image>` at a 1920px banner and renders it in a 120px card. iOS downsamples cheaply; on Android, decoding many full-size bitmaps fills native and GPU memory. Scrolling is smooth while images load and stutters once they arrive.
**How to test:** On a mid-range Android, scroll image-heavy screens and compare `adb shell dumpsys meminfo <package>` (Native Heap, Graphics) and `gfxinfo` with images loaded vs blocked; grep `<Image` without `resizeMethod`.
**Pass:** Memory and jank don't jump when images arrive; each image is decoded close to its display size.
**Fix:** Serve sizes that match the display (thumbnail URLs); `resizeMethod="resize"`, or an image library that downsamples (expo-image, FastImage).

### EXPO-023 · A home screen that mounts every row and never unmounts
**Severity:** P1
**Why it breaks:** AI builds a "Netflix-style" home as one vertical `ScrollView` of dozens of horizontal lists. Each row is virtualized, the outer list is not, so every row and card stays mounted. A 12 GB test phone never notices; on a 4–6 GB phone the app becomes the biggest memory user, the kernel reclaims memory in bursts, and scrolling freezes for seconds while app CPU looks low.
**How to test:** On a phone with 6 GB RAM or less, scroll the whole home screen down and back, then read `adb shell dumpsys meminfo <package>` (TOTAL PSS, Views) and `adb shell dumpsys meminfo | head -30`.
**Pass:** PSS and view count stay flat as you scroll further; the app isn't the top memory user.
**Fix:** Make the outer container a virtualized list (`FlatList` / `FlashList`, rows as items, hero as `ListHeaderComponent`) with a small `windowSize`.

### EXPO-024 · `removeClippedSubviews` blanks rows; turning it off everywhere causes jank
**Severity:** P1
**Why it breaks:** When a list reappears before it has layout (tab un-freeze, returning from a pushed screen, rendering during a transition), `removeClippedSubviews` detaches cells and doesn't reattach them until the user touches the screen: rows show only titles or slivers. AI then disables the flag globally and scrolling on Android with many lists turns heavy.
**How to test:** Scroll down, switch tab and come back; open and close a detail screen; on iOS and Android, without touching the list. Then record `gfxinfo` while scrolling the longest list.
**Pass:** Rows are fully drawn without a touch, and scroll jank is no worse than before.
**Fix:** Decide per list and platform: keep it on for long Android lists, off only where the un-freeze bug appears. Retest both symptoms on every change. See `EXPO-006`.

### EXPO-025 · Real-time blur copied from iOS to Android
**Severity:** P1
**Why it breaks:** AI uses a blur view for glassy bars and overlays. Cheap on iOS; on Android it redraws every frame, so always-visible bars jank constantly and transitions drop frames. Some blur libraries also crash when there is no current Activity (cold start from a notification or the lock screen).
**How to test:** Grep for blur components on always-visible chrome; on Android record `gfxinfo` on those screens and cold-start the app from a notification with the app killed.
**Pass:** No crash; no steady jank from chrome.
**Fix:** On Android use a semi-transparent solid fill (`Platform.OS` fallback); keep blur for iOS.

### EXPO-026 · The native video view eats taps on Android
**Severity:** P0
**Why it breaks:** AI wraps the video in a touchable to show and hide custom controls. On iOS the player view lets touches through; on Android the native player view (Media3/ExoPlayer) is clickable and takes the touch first, even with native controls off. After the controls auto-hide, no tap brings them back and the user is stuck in the player. The same layer can cancel a native cast button placed on top.
**How to test:** On a real Android device, play a video, wait for the controls to hide, tap and double-tap the video; tap every overlay button, including cast.
**Pass:** Taps toggle the controls every time; every overlay button works.
**Fix:** A transparent touch-catcher above the video and below the controls (Android), or handle taps natively; open the cast picker from JS. See `EXPO-019`.

### EXPO-027 · Heavy work during screen transitions on Android
**Severity:** P2
**Why it breaks:** AI mounts the full detail body, starts focus-time fetches and unmounts a video player exactly while a push, pop or tab animation runs. On Android all of it competes with the animation on the UI thread, so every open, close and swipe-back stutters.
**How to test:** On a mid-range Android, `gfxinfo` reset, open and close a heavy screen 10 times, switch tabs 10 times, swipe back 10 times, read `gfxinfo`.
**Pass:** No visible hitch; transition janky frames under about 10%.
**Fix:** Mount heavy content after `transitionEnd` or in `InteractionManager.runAfterInteractions`; pause an off-screen video instead of unmounting it mid-animation; consider `freezeOnBlur` off on Android.

### EXPO-028 · "Go home" buttons that stack a new navigator each time
**Severity:** P1
**Why it breaks:** For an empty-state button like "Browse", AI writes `navigate('<TabsNavigator>', { screen: 'Home' })` from a screen inside that navigator. Each press pushes a whole new copy of the tab tree; memory and view count grow with every loop until the OS kills the app.
**How to test:** Repeat empty screen → button → back 10 times; compare `adb shell dumpsys meminfo <package>` (Views, TOTAL PSS) before and after, or Xcode's memory gauge.
**Pass:** Views and memory return to the same level after each loop.
**Fix:** `popToTop()`, navigate to a route already in the current stack, or `reset`; never push a navigator that is already an ancestor.

### EXPO-029 · Casting works on iOS but no cast button on Android
**Severity:** P1
**Why it breaks:** AI follows the iOS setup and lets the Android cast framework start lazily from the first JS hook. The Android library expects the cast context to start eagerly in the main activity, so discovery never really begins. Android 13+ also needs `NEARBY_WIFI_DEVICES` (`neverForLocation`), and a cast button unmounted while no device is known stops discovery.
**How to test:** On Android 13+, same Wi-Fi as a receiver: cold start, background/foreground, open the player and tap cast; also a device without (or with outdated) Google Play Services.
**Pass:** The button appears within seconds and stays while a device is present; the picker opens from the player; no crash without Play Services.
**Fix:** Start the cast context in `MainActivity.onCreate` inside try/catch; declare and request `NEARBY_WIFI_DEVICES`; keep the cast button mounted.

### EXPO-030 · A ported feature stays switched off on Android
**Severity:** P1
**Why it breaks:** AI adds the Android native side of a feature that started on iOS but leaves the JS gate as `Platform.OS === 'ios' && !!NativeModules.X`. Or the JS lives in a local `file:` package: the package manager installs a copy, not a symlink, and doesn't refresh it while the version is unchanged, and the bundle cache reuses old JS. The release build says "not supported on this device" with no error.
**How to test:** Grep for `Platform.OS === 'ios'` next to `isSupported` and feature flags; diff each local `file:` package with its `node_modules` copy; build the Android release from clean caches and use the feature on a device.
**Pass:** The feature works in the Android release build; `node_modules` copies match their source.
**Fix:** Gate on the native module existing, not the platform; after changing a local package reinstall with `--force`, clear the Metro cache, build with `--rerun-tasks` (or use a workspace symlink).

### EXPO-031 · Progress math divides by a zero duration
**Severity:** P1
**Why it breaks:** `currentTime / duration * width` runs in `onProgress`, which can fire before `onLoad` (almost always for local or downloaded files), so `0/0 = NaN`. Clamps like `x <= 0 ? 0 : x >= max ? max : x` let NaN through because every comparison with NaN is false. React Native throws "NaN is not usable as a native method argument" in debug and draws a broken bar in release.
**How to test:** Play a downloaded or local file and a slow stream; grep progress code for division by `duration`, `total` or `length`.
**Pass:** No error; the bar starts at 0.
**Fix:** Divide only when the denominator is a positive finite number; pass widths through `Number.isFinite` before styles.

### EXPO-032 · Landscape lock ignored on iOS 16+
**Severity:** P1
**Why it breaks:** Orientation libraries (and AI-written native code) rotate with `UIDevice setValue:forKey:@"orientation"`, which iOS 16+ ignores. `requestGeometryUpdate` also fails while the view controller's cached supported orientations are still portrait (`UISceneErrorDomain Code=101`). React Native lays out in landscape while the window stays portrait, and taps land at transposed coordinates.
**How to test:** On an iOS 16+ device locked to portrait, open the forced-landscape screen (the player); watch the console for error 101 and tap every control.
**Pass:** The window rotates, no error 101, every control responds where it is drawn.
**Fix:** `setNeedsUpdateOfSupportedInterfaceOrientations` before `requestGeometryUpdate`; patch or upgrade the library (see `MOB-022`).

### EXPO-033 · Video keeps playing on a screen the user left
**Severity:** P1
**Why it breaks:** AI hardcodes `paused={false}` on trailers and autoplay previews. With `freezeOnBlur` or a screen pushed on top, React stops rendering but the native player keeps playing: two audio tracks overlap, data and battery drain. After backgrounding, the play/pause icon no longer matches the player.
**How to test:** Unmute a trailer, then start the main video or open another detail screen and listen; background the app during playback, return and check the icon.
**Pass:** Only one player makes sound; unfocused screens pause and resume on focus; the icon follows `AppState`.
**Fix:** `paused={!isFocused || appState !== 'active'}`.

### EXPO-034 · Leaving a screen waits for a network call
**Severity:** P1
**Why it breaks:** AI writes `await saveProgress(); unlockOrientation(); goBack()`. Offline (watching downloaded content) the request hangs until its timeout: the screen doesn't close, orientation doesn't reset, the app looks frozen.
**How to test:** Airplane mode, play downloaded content, exit.
**Pass:** The exit is immediate; the save is fire-and-forget or queued.
**Fix:** Never await non-critical network calls on exit or navigation paths; queue them with retry. See `MOB-005`.

### EXPO-035 · Hand-written subtitle (WebVTT) handling
**Severity:** P1
**Why it breaks:** AI writes a small VTT parser and a "current cue" cursor. Numeric cue ids show up as subtitle text; `\r\n` files leave `\r` and break blank-line detection; the last cue is dropped; the cursor advances one cue per progress tick, so a subtitle picked mid-video appears minutes later; a listed track whose file is missing (403 or an HTML body) crashes or stops playback.
**How to test:** Load a VTT with numbered cues, CRLF and no trailing blank line; pick a subtitle 30 minutes in; pick a language whose file returns 403.
**Pass:** Clean text, last cue shown, the right cue within a second, a missing file shows a short notice and playback continues.
**Fix:** A spec-compliant parser or the player's native text tracks; find the cue by time (binary search) on seek or track change; validate content (`-->` present) before applying.

### EXPO-036 · Route names resolve to the wrong navigator or to none
**Severity:** P1
**Why it breaks:** A screen is registered only in the logged-in stack, so terms or privacy opened from sign-up fail with "not handled by any navigator" (a dead legal link before signup). The same route name is registered twice (inside tabs and bare in the stack), so after login or purchase `navigate('Home')` opens the bare copy and the tab bar disappears. An auth effect `reset`s to the screen already showing, which mounts it twice (two video decoders; a permission dialog freezes the transition).
**How to test:** Logged out, open every link on sign-up and onboarding; finish a purchase or login and check the tab bar; on a fresh install grant or deny the first permission while onboarding plays.
**Pass:** Every screen reachable from a stack is registered in it; returning to tabs resets to the tab parent; `reset` is skipped when already on that route.
**Fix:** Register shared screens in both stacks; unique route names; guard `reset`. See `EXPO-020`.

### EXPO-037 · Per-frame JS animation swallows taps
**Severity:** P1
**Why it breaks:** AI drives auto-scrolling strips, marquees or control slides with `requestAnimationFrame` + `scrollTo`, or animates layout props (`marginTop`, `height`) that can't use the native driver. The JS thread is busy every frame, so taps on the same screen (plan selection on a paywall, login) are dropped and animations stutter when responses arrive.
**How to test:** Open the Perf Monitor on the animated screen, watch JS FPS and tap every button; grep for `requestAnimationFrame` loops and `useNativeDriver: false`.
**Pass:** JS FPS stays near 60 and taps respond.
**Fix:** `Animated.loop` on `transform` with `useNativeDriver: true` (or Reanimated); `pointerEvents="none"` on decorative layers.

### EXPO-043 · A local store build ships the developer's `.env`
**Severity:** P0
**Why it breaks:** Expo CLI loads `.env`, `.env.local` and `.env.production` when it bundles and inlines every `EXPO_PUBLIC_*` value; `.env.local` wins over `.env.production`. When AI moves releases off EAS to `expo prebuild` plus `xcodebuild` / `./gradlew bundleRelease` on a laptop, the developer's API URL (localhost, a LAN IP, staging) is baked into the store binary. The upload succeeds and every request fails on users' phones.
**How to test:** Read the release scripts: is `EXPO_NO_DOTENV=1` set, and where do the production values come from? List `.env*` files in the app folder and their `EXPO_PUBLIC_` hosts. Build the release the way it ships and search the bundle for dev hosts: iOS `strings <App>.app/main.jsbundle | grep -nE "localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.|staging"`; Android `unzip -p app-release.aab base/assets/index.android.bundle | strings | grep -nE "…"` with the same pattern.
**Pass:** The bundle contains only production hosts, and the release script stops before upload when it finds a dev host.
**Fix:** `EXPO_NO_DOTENV=1` plus explicit production values in release scripts, or build in CI from a clean checkout; make the bundle search a blocking step before upload. See `EXPO-001`, `MOB-021`.

### EXPO-044 · Native packages left behind after an SDK upgrade
**Severity:** P0
**Why it breaks:** AI bumps `expo`, then adds or keeps native packages with plain `npm install` / `pnpm add`, so some stay on the previous SDK's version (image picker, secure store, camera). Type checks and Expo Go pass, but the iOS build fails inside the package's native code or the Android release crashes at launch (`NoClassDefFoundError` in `expo.modules.kotlin`). A lockfile hides the drift until the next native build.
**How to test:** Run `npx expo install --check` and `npx expo-doctor` in the app folder. After an SDK upgrade, build and cold start a release build on iOS and Android.
**Pass:** Both commands report nothing, and release builds start on both platforms.
**Fix:** `npx expo install --fix`; add native packages only with `npx expo install <pkg>`; run `npx expo install --check` in CI so drift fails the build. See `EXPO-003`, `MOB-022`.

### EXPO-045 · Media permission requests that can never be granted
**Severity:** P1
**Why it breaks:** AI calls `ImagePicker.requestMediaLibraryPermissionsAsync()` before `launchImageLibraryAsync()` on both platforms. The Android picker needs no permission, but on Android 12 and lower that request still asks for `WRITE_EXTERNAL_STORAGE` and `READ_EXTERNAL_STORAGE`. If one of them is in `android.blockedPermissions` (often added to get through a store review), the answer is "denied" and no dialog ever appears, so the feature is locked on older phones. The reverse also happens: the expo-media-library config plugin adds `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO` and `READ_MEDIA_AUDIO` by default, even for a save-only feature, and Play allows photo and video permissions only for apps that need broad library access.
**How to test:** Grep for `request*PermissionsAsync` right before picker calls. For each entry in `android.blockedPermissions`, find the library request that still asks for it. Dump the merged manifest of the release build (`aapt dump permissions app-release.apk` or `bundletool dump manifest --bundle app-release.aab`). Fresh-install the release build on Android 12 or lower, Android 13+ and iOS, and use every photo, camera and save flow.
**Pass:** Each flow either shows a system dialog or needs none, and no "permission required" message appears without a dialog. The merged manifest lists only permissions some flow uses.
**Fix:** Ask for library access only where the platform needs it (iOS), not before the Android system picker. For save-only flows call `MediaLibrary.requestPermissionsAsync(true)` (write-only) and set the plugin's `granularPermissions` to the media types the app really reads (an empty list if it only saves). After blocking a permission, retest the library's own request on the oldest supported Android. See `FLT-012`, `MOB-006`, `PLAY-008`.

### EXPO-046 · Forms inside a bottom-sheet library
**Severity:** P1
**Why it breaks:** AI puts every add or edit form into a gesture bottom sheet (`@gorhom/bottom-sheet`) with a plain `TextInput` and `ScrollView`. The sheet follows the keyboard only for its own input component, so the keyboard covers the focused field and Save. On a real Android phone a plain scroll view inside the sheet often doesn't scroll, because the sheet's pan gesture takes the drag: the bottom of a long form can't be reached, and the typed values are lost when the sheet closes. A sheet drawn inside the screen also leaves the tab bar visible and tappable under the backdrop. An emulator driven by mouse or `adb` swipes may scroll fine.
**How to test:** Grep for the sheet library, then for plain `TextInput`, `ScrollView` or `FlatList` inside sheets instead of `BottomSheetTextInput`, `BottomSheetScrollView` and `BottomSheetFlatList`. On a small real Android phone and an iPhone, open every sheet form, fill the last field with the keyboard open, scroll to Save with a finger, and tap the tab bar behind the backdrop.
**Pass:** Every field and the Save button can be reached with the keyboard open, the tab bar can't be tapped while a sheet is open, and closing a sheet with unsaved input asks first.
**Fix:** Use the library's own input and scroll components, and `BottomSheetModal` with its provider above the navigator so the sheet covers the tab bar. Or move long forms to a full screen (or an RN `Modal` with `KeyboardAvoidingView` and `ScrollView`) and keep sheets for short pickers. See `EXPO-005`, `MOB-013`, `MOB-002`.

### EXPO-047 · Media URLs that only work in a browser
**Severity:** P1
**Why it breaks:** The API returns paths relative to the site (`/uploads/a.jpg`, `/api/videos/12/thumbnail`), which a browser resolves against the page's origin. AI passes them to `<Image source={{ uri }}>`, which needs an absolute URL, so covers, avatars and thumbnails show as empty boxes and nothing is logged unless `onError` is set. Video splits the same way: Android's player (Media3 / ExoPlayer) picks the format from the URL's extension, so an HLS stream at a URL without `.m3u8` is treated as a plain file and never starts, while the same URL often plays on web and iOS.
**How to test:** Grep `uri:` and player `source` values that come from API fields, and query the API for image and video fields that start with `/` or have no scheme. Open every screen with images in an Android and an iOS release build, and play every kind of video on a real Android device.
**Pass:** Every image and video loads on both platforms.
**Fix:** Resolve every media field through one `mediaUrl()` helper that prefixes the API base URL, or return absolute URLs from the API. Set the stream type explicitly (`contentType: 'hls'` in an expo-video source, `type: 'm3u8'` in a react-native-video source), or serve playlists at a path that ends in `.m3u8`. See `MOB-025`.

### EXPO-048 · Video inside a scrolling screen breaks on Android
**Severity:** P2
**Why it breaks:** On Android, expo-video's `VideoView` renders into a `SurfaceView` by default (`surfaceType="surfaceView"`), a separate layer outside the normal view drawing. Inside a scroll view, next to another video or after the stream changes resolution, it can draw at the wrong scale or outside its frame (the picture zooms into a corner). AI also hides the video with `opacity: 0` until it reports ready; on Android it can then stay black or on the first frame while the status says playing. On a slow network the first load fails, nothing retries, and the black video covers the poster for good.
**How to test:** On a real mid-range Android with a throttled network, scroll while a video plays, grab a frame every 10 seconds for a minute, let the quality switch, and make the first request fail. Grep video components for `surfaceType` / `viewType` and for `opacity: 0` on the player.
**Pass:** The picture stays inside its frame at the right scale, the poster stays until playback time actually moves, and a failed load retries once or shows a "Try again" button.
**Fix:** `surfaceType="textureView"` on `VideoView` (set it once; it can't change at runtime), or the texture `viewType` in react-native-video, for videos inside scrolling or overlapping layouts; keep the surface view for DRM streams that need a secure surface. Keep the video view visible with the poster on top, and remove the poster when `timeUpdate` shows the time moving (it needs `timeUpdateEventInterval` above 0), not on `readyToPlay`. Add a load timeout, one automatic retry and a "Try again" button. See `EXPO-019`, `EXPO-026`.
