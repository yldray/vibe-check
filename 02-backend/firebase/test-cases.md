# Firebase — pre-launch test cases

> 🌱 Seeded list. Contributions welcome.

- [ ] `FIRE-007` **P0** Rules live in the repo and are deployed from it (`firebase deploy --only firestore:rules,storage`), not edited only in the console
- [ ] `FIRE-008` **P1** Rules unit tests on the Emulator Suite cover signed out, own data and another user's data (`@firebase/rules-unit-testing`)
- [ ] `FIRE-009` **P1** App Check is enforced for Firestore, Storage and Cloud Functions
- [ ] `FIRE-010` **P1** Auth → Settings → Authorized domains lists only domains you use
