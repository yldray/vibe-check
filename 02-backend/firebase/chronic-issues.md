# Firebase — chronic issues

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

### FIRE-011 · Users can edit their own role, plan or credits
**Severity:** P0
**Why it breaks:** AI writes `allow write: if request.auth.uid == userId;` on `users/{userId}`. The owner check passes, but nothing limits which fields change, so a user saves `{"role": "admin"}`, `{"plan": "pro"}` or `{"credits": 99999}` on their own document, and the app trusts it.
**How to test:** Signed in as a normal user (emulator or Rules Playground), update your own user document with `role`, `isAdmin`, `plan` or `credits`.
**Pass:** Denied; only harmless fields (name, photo) can change.
**Fix:** `allow update: if request.auth.uid == userId && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['displayName', 'photoURL']);`. Set roles, plans and balances only from the server (Admin SDK) or as custom claims. See `FIRE-003`.

### FIRE-012 · Create rules that don't check the owner
**Severity:** P0
**Why it breaks:** AI writes one `allow write` rule that reads `resource.data.ownerId`. On create there is no stored document yet, so creates are denied, and AI loosens the rule to `request.auth != null`. Now anyone can create documents in another user's name, and often update or delete theirs too.
**How to test:** `grep -n "allow write" firestore.rules`. Signed in as user A, create a document with user B's `ownerId`, then update and delete one of B's documents.
**Pass:** All three denied.
**Fix:** Separate rules: `allow create: if request.resource.data.ownerId == request.auth.uid;` and `allow update, delete: if resource.data.ownerId == request.auth.uid;` (`resource` is the stored document, `request.resource` the incoming one). On update, also require `request.resource.data.ownerId == resource.data.ownerId`.

### FIRE-013 · A catch-all rule overrides the narrow ones
**Severity:** P0
**Why it breaks:** Rules are OR'ed: if any matching `allow` is true, the request passes. A leftover `match /{document=**} { allow read, write: if request.auth != null; }` (or `{allPaths=**}` in Storage), often pasted to silence "Missing or insufficient permissions", makes every careful rule next to it useless.
**How to test:** Search `firestore.rules` and `storage.rules` for `{document=**}` and `{allPaths=**}` with an `allow` that isn't `false`. In the Rules Playground, try a request a narrow rule should deny.
**Pass:** No recursive wildcard grants more than the specific rules.
**Fix:** Delete the catch-all; paths no rule matches are already denied. See `FIRE-001`.

### FIRE-014 · Admin decided by an unverified e-mail
**Severity:** P0
**Why it breaks:** AI checks `request.auth.token.email == 'admin@…'` or a domain with `.matches('.*@yourcompany[.]com')`. E-mail/password sign-up doesn't verify the address, so anyone can register an address they don't own (an admin address nobody registered yet, or any address at your domain) and pass the check.
**How to test:** `grep -n "token.email" firestore.rules storage.rules database.rules.json`.
**Pass:** Every e-mail check also requires `request.auth.token.email_verified == true`; admin rights come from a custom claim (`request.auth.token.admin == true`).
**Fix:** Set an `admin` custom claim with the Admin SDK and check that; at least add `&& request.auth.token.email_verified == true`. Never read admin flags from a document the user can write (see `FIRE-011`).

### FIRE-015 · Uploads without size or type limits
**Severity:** P1
**Why it breaks:** AI's Storage rules only check that the user is signed in or owns the folder. Nothing checks `request.resource.size` or `request.resource.contentType`, so one account can upload gigabytes (your storage and download bill) or host any file type from your bucket.
**How to test:** Read `storage.rules`; upload a 100 MB file and an `.html` file to the avatar path.
**Pass:** Both rejected; files live under a per-user path the rule enforces.
**Fix:** `allow write: if request.auth.uid == userId && request.resource.size < 5 * 1024 * 1024 && request.resource.contentType.matches('image/.*');`. See `FIRE-003`, `SEC-008`.

### FIRE-016 · A function that triggers itself
**Severity:** P0
**Why it breaks:** AI writes an `onDocumentWritten` / `onDocumentUpdated` function (or a Storage `onObjectFinalized` thumbnailer) that writes back to the document or path it listens on. Each write fires the function again: a loop that runs until someone notices the bill. Events can also arrive more than once, so a function without a guard sends two e-mails or grants credits twice.
**How to test:** For every event-triggered function, check whether it writes where it listens and whether it returns early when nothing relevant changed. Make one write in the emulator and count the invocations in the logs.
**Pass:** One write, one invocation; side effects are keyed on `event.id` or a field the function sets once.
**Fix:** Return early when the watched field didn't change (`if (before.status === after.status) return;`), write generated files under another prefix, and store processed event ids. See `OPS-003`.

### FIRE-017 · No instance cap on functions
**Severity:** P1
**Why it breaks:** The `firebase init` template caps functions with `setGlobalOptions({ maxInstances: 10 })`, but AI often writes v1 functions (`functions.https.onRequest`), which that setting doesn't cover, or leaves the cap out of a new codebase. A traffic spike, a retry storm or one abusive caller scales out, runs up the bill and floods the database or API behind the function. A Cloud Billing budget only sends e-mails; it doesn't stop anything.
**How to test:** `grep -rnE "maxInstances|setGlobalOptions|runWith" functions/`; in the Firebase console, check Usage and billing → Accounts & budgets.
**Pass:** Every function has a `maxInstances` that fits its load; a spend cap is set for Cloud Functions (and Firebase AI Logic, if used).
**Fix:** `setGlobalOptions({ maxInstances: 10 })` for v2 functions, `functions.runWith({ maxInstances: 10 })` for each v1 function, and a spend cap, which pauses the service when its budget is used up. See `CLOUD-006`, `LLM-001`.

### FIRE-018 · `functions.config()` from training data
**Severity:** P1
**Why it breaks:** AI reads keys with `functions.config().stripe.secret`. firebase-functions v7 removed that API (calling it throws), and the Runtime Config service behind it shuts down in March 2027, after which deploys that rely on it fail. The values also sit in plain config instead of Secret Manager.
**How to test:** `grep -rn "functions.config()" functions/`; check the `firebase-functions` version in `functions/package.json`.
**Pass:** No hits; plain settings use params (`defineString`), secrets use `defineSecret`.
**Fix:** `firebase functions:config:export`, then read plain values through params and bind secrets with `defineSecret` and the function's `secrets` option. See `UNI-009`.

### FIRE-019 · Functions on a retired Node.js version
**Severity:** P1
**Why it breaks:** AI copies `"engines": { "node": "18" }` into `functions/package.json`. Node.js 18 was decommissioned on 2025-10-30 and Node.js 20 is decommissioned on 2026-10-30. After that the CLI refuses to deploy, so the next urgent fix can't ship.
**How to test:** Read `engines.node` in `functions/package.json`; `firebase deploy --only functions` warns about deprecated runtimes.
**Pass:** `22` or `24`.
**Fix:** Set `"node": "22"` (or `"24"`), run the tests and redeploy.

### FIRE-020 · An unrestricted API key in a project with Gemini
**Severity:** P1
**Why it breaks:** The `apiKey` in `firebaseConfig` is public by design, but a Google API key without restrictions can call every API enabled in its project. Once the Generative Language (Gemini) API is turned on there, anyone who copies the key from your web page can run billable Gemini calls on your account and read files uploaded through it (Truffle Security found 2,863 exposed keys with this access in February 2026).
**How to test:** Google Cloud console → APIs & Services → Credentials: open each key and read its API restrictions and application restrictions (HTTP referrers, Android, iOS). Check whether the Generative Language API is enabled in the project.
**Pass:** Every key is limited to the APIs its client uses and has an application restriction; Gemini is called from the server or through Firebase AI Logic with App Check.
**Fix:** Add API and application restrictions to every key; give server-side APIs their own key that never ships to clients. See `LLM-001`.
