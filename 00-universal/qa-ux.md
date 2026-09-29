# QA and UX

What AI-built UIs get wrong, and what to click through by hand before launch.

## AI UI pitfalls

### QA-001 · Dead buttons and links
**Severity:** P1
**Why it breaks:** AI renders buttons and links so the screen looks complete, with empty handlers (`onClick={() => {}}`), `href="#"` or a `TODO` inside.
**How to test:** Search components for `() => {}`, `href="#"` and `TODO`; click every button and link on the main screens.
**Pass:** Every control does something or is visibly disabled.
**Fix:** Wire it up, or hide it until it works.

### QA-002 · Fake success
**Severity:** P1
**Why it breaks:** AI shows "Saved!" before or without waiting for the API, so a failed request looks like success and data is lost. This is the UI side of `UNI-007`.
**How to test:** Block the API in DevTools (offline or a 500), then submit every form and action.
**Pass:** The user sees an error; nothing claims success.
**Fix:** Show success only after a 2xx response; show the error otherwise.

### QA-003 · New account, zero data
**Severity:** P1
**Why it breaks:** AI builds screens against seeded or mock data. A brand-new user sees a blank screen, `undefined`, `NaN` or a crash. See also `FE-005`.
**How to test:** Sign up a fresh account and open every screen before creating anything.
**Pass:** Each screen has an empty state that tells the user what to do next.
**Fix:** Add empty states with one clear call to action.

### QA-004 · Placeholder and hardcoded text
**Severity:** P1
**Why it breaks:** "Lorem ipsum", "John Doe", "Your Company", `test@example.com`, default titles like "Vite + React" or "Create Next App", and English strings hardcoded in an i18n app.
**How to test:** Search for `lorem`, `john doe`, `example.com`, `your company`, `Vite + React`, `Create Next App`. In i18n apps, search components for literal UI strings, then switch the language and walk the main flow.
**Pass:** No placeholder text; every visible string comes from the translation files.
**Fix:** Replace the text; move strings into the translation files.

### QA-005 · Form loses input on error
**Severity:** P1
**Why it breaks:** AI resets or re-mounts the form on submit, so a server error wipes everything the user typed.
**How to test:** Fill a long form, make the server reject it (block the API or send a value only the server rejects), submit.
**Pass:** Every field keeps its value and the error shows next to the right field.
**Fix:** Reset only after success; map server errors to fields.

### QA-006 · Destructive actions without confirm or undo
**Severity:** P1
**Why it breaks:** AI wires "Delete", "Cancel subscription" or "Remove" straight to the API.
**How to test:** Trigger every delete, cancel and remove action.
**Pass:** Anything that can't be reversed asks for confirmation (naming the item) or offers undo.
**Fix:** Add a confirm dialog, or soft delete with undo.

### QA-007 · Wrong keyboard and no autofill on mobile
**Severity:** P2
**Why it breaks:** AI uses plain text inputs for email, phone, numbers and one-time codes.
**How to test:** Fill every form on a real phone.
**Pass:** The right keyboard opens and autofill works (email, phone, one-time code, password).
**Fix:** Web: set `type`, `inputmode` and `autocomplete`. React Native: set `keyboardType` and `autoComplete` / `textContentType`.

## Manual QA before launch

- [ ] `QA-008` **P0** On production, with a fresh account: sign up, verify, do the main action and pay (if the app takes payments), end to end
- [ ] `QA-009` **P0** Transactional e-mails arrive in the inbox (not spam), and every link in them points to production, not localhost (if the app sends e-mail)
- [ ] `QA-010` **P1** Session expires mid-action: the user is sent to login and comes back to the same place; nothing fails silently
- [ ] `QA-011` **P1** Slow network (DevTools "Slow 4G" / "3G"): every action shows progress within 1 second
- [ ] `QA-012` **P1** Locale: special letters (e.g. Turkish İ/ı) sort, search and uppercase correctly; long translations don't break the layout; dates, numbers and currency follow the user's locale
- [ ] `QA-013` **P1** Error messages say what happened and what to do next, in the user's language; no raw `500`, `undefined` or stack text
- [ ] `QA-014` **P1** After every action the user can tell it worked (updated list, message or redirect)
- [ ] `QA-015` **P2** Copy proofread: no typos, the same term for the same thing, button labels are verbs
- [ ] `QA-016` **P1** Every translation file has the same keys as the main language: no missing, empty or untranslated entries (compare the key lists with a script or an i18n linter)
