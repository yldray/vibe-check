# React Native / Expo — chronic issues

### EXPO-001 · Secrets in EXPO_PUBLIC_ vars
**Severity:** P0
**Why it breaks:** AI puts private API keys in `EXPO_PUBLIC_*`; they are embedded in the app.
**How to test:** Search the exported bundle for key prefixes.
**Pass:** No private keys.
**Fix:** Move calls to your backend.

### EXPO-002 · OTA update breaks native code
**Severity:** P0
**Why it breaks:** A JS update is pushed that needs a native module the installed build doesn't have.
**How to test:** Install the store build, push the update to a preview channel.
**Pass:** App opens and works.
**Fix:** Use `runtimeVersion` policy; rebuild when native deps change.

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
