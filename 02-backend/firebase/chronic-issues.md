# Firebase — chronic issues

> 🌱 Seeded list. Contributions welcome.

### FIRE-001 · Rules open to everyone
**Severity:** P0
**Why it breaks:** AI ships `allow read, write: if true;` (Firestore, Storage) or `".read": true, ".write": true` (Realtime Database) to make permission errors go away.
**How to test:** Read `firestore.rules`, `storage.rules` and `database.rules.json`; try a read and a write while signed out (Rules Playground or the REST API).
**Pass:** Both are denied.
**Fix:** Rules scoped to `request.auth.uid` and the document's owner.

### FIRE-002 · Test-mode rules with an expiry date
**Severity:** P0
**Why it breaks:** "Test mode" rules allow everything until a date (`request.time < timestamp.date(...)`). Until then the data is public; after that the app stops working overnight.
**How to test:** Search the rules for `request.time <`.
**Pass:** None found.
**Fix:** Write real rules before launch.

### FIRE-003 · Signed in means allowed everything
**Severity:** P0
**Why it breaks:** AI writes `allow read, write: if request.auth != null;`, so any signed-in user can read and change everyone's data.
**How to test:** Signed in as user A, read and update user B's documents.
**Pass:** Denied.
**Fix:** Match on the owner: `request.auth.uid == userId` or `resource.data.ownerId`.

### FIRE-004 · Admin credentials in the client
**Severity:** P0
**Why it breaks:** AI bundles a service account JSON or uses `firebase-admin` in client code to get past rules. The Admin SDK bypasses all rules. (The web `apiKey` in `firebaseConfig` is not a secret; the service account is.)
**How to test:** Search client code and the build output for `private_key`, `"type": "service_account"` and `firebase-admin`.
**Pass:** Found only in server code.
**Fix:** Remove it and rotate the key in Google Cloud.

### FIRE-005 · Cloud Function without an auth check
**Severity:** P1
**Why it breaks:** A callable or HTTP function trusts its input and never checks who is calling.
**How to test:** Call it signed out, then as another user with their IDs.
**Pass:** Rejected.
**Fix:** Check `request.auth` (v2) or `context.auth` (v1) and the caller's ownership.

### FIRE-006 · Unbounded reads and no budget alert
**Severity:** P1
**Why it breaks:** AI listens to whole collections without `limit()`, so reads (and the bill) grow with the data.
**How to test:** Open the main screens with a large collection; check read counts in the console.
**Pass:** Reads grow with what's on screen, not with the collection size; a budget alert exists.
**Fix:** `limit()` and pagination; a budget alert in Google Cloud Billing.
