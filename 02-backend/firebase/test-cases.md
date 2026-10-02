# Firebase — pre-launch test cases

- [ ] `FIRE-007` **P0** Rules live in the repo and are deployed from it (`firebase deploy --only firestore:rules,storage`), not edited only in the console
- [ ] `FIRE-008` **P1** Rules unit tests on the Emulator Suite cover signed out, own data and another user's data (`@firebase/rules-unit-testing`)
- [ ] `FIRE-009` **P1** App Check is enforced for Firestore, Storage and Cloud Functions
- [ ] `FIRE-010` **P1** Auth → Settings → Authorized domains lists only domains you use
- [ ] `FIRE-021` **P1** Every query that combines a filter with an order or a second range has its composite index in `firestore.indexes.json`, deployed with `firebase deploy --only firestore:indexes`. The emulator runs any valid query without an index, so a missing one fails only in production ("The query requires an index"). Test: open the main screens against a real staging project
- [ ] `FIRE-022` **P1** Deleting an account also deletes the user's Firestore, Storage and Realtime Database data (the Delete User Data extension, or a user-deletion trigger). Test: delete a test account, then search for its uid (see `LEGAL-002`)
- [ ] `FIRE-023` **P1** Every `onSnapshot` / `onValue` listener is unsubscribed when its screen closes. Leaked listeners keep reading and multiply the bill (see `FIRE-006`)
- [ ] `FIRE-024` **P1** No retired Firebase APIs: legacy FCM sends to `fcm.googleapis.com/fcm/send` with a server key (shut down from July 2024; use HTTP v1, or `sendEach` in the Admin SDK instead of `sendAll` / `sendMulticast`) and Dynamic Links (`page.link`, shut down on 25 August 2025; old links return 404). Test: `grep -rnE "fcm/send|sendAll\(|sendMulticast\(|page\.link|dynamicLinks"`
- [ ] `FIRE-025` **P1** Remote Config holds no secrets: every parameter can be read by any client that has the app
