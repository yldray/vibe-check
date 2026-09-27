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
**How to test:** Open a link with the app killed and in background.
**Pass:** Opens the right screen both times.
**Fix:** Configure scheme + associated domains; handle initial URL.
