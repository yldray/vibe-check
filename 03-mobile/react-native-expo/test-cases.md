# React Native / Expo — pre-launch test cases

- [ ] `EXPO-009` **P0** EAS production build tested on real iOS and Android devices
- [ ] `EXPO-010` **P0** No private keys in EXPO_PUBLIC_ vars
- [ ] `EXPO-011` **P0** runtimeVersion / update channel strategy defined
- [ ] `EXPO-012` **P0** Account deletion inside the app
- [ ] `EXPO-013` **P0** All permission prompts have clear reasons
- [ ] `EXPO-014` **P0** Crash reporting connected
- [ ] `EXPO-015` **P1** Offline mode: no crash, retry works
- [ ] `EXPO-016` **P1** Push notification tap opens the right screen
- [ ] `EXPO-017` **P1** Dark mode + large fonts
- [ ] `EXPO-018` **P2** App size reviewed
- [ ] `EXPO-038` **P2** Animations run on the UI thread: `transform` / `opacity` use `useNativeDriver: true`, scroll-linked effects use `Animated.event(..., { useNativeDriver: true })` with no `setValue` per frame in `onScroll`, and the Reanimated (or worklets) Babel plugin is listed LAST. Test: grep `useNativeDriver: false` and `babel.config.js`; a spinner keeps turning while JS is busy
- [ ] `EXPO-039` **P2** Landscape fullscreen player on Android: open and close it 5 times with the close button and with hardware back; never a half-rotated frame, a white or black half, or the previous screen bleeding through (transparent-modal presentation added for iOS resizes badly on Android rotation; use a card presentation and rotate behind an opaque cover)
- [ ] `EXPO-040` **P2** Swipe-down-to-dismiss on a scrollable screen starts only when the content is at the top. Test on Android: scroll to the bottom, drag down a little, scroll up; the screen must not close
- [ ] `EXPO-041` **P2** iOS image caching is sized: `<Image>` uses the shared `NSURLCache`, whose default is small, so posters are downloaded again every session. Configure memory and disk capacity in the AppDelegate (or use an image library with a disk cache). Test: relaunch, browse the same screens, count image requests
- [ ] `EXPO-042` **P2** Shared wrapper components (`Text`, `Button`, `Touchable`) forward the rest of their props; otherwise `numberOfLines`, `onPress` and accessibility props are silently ignored. Test: grep wrappers for `...rest`
