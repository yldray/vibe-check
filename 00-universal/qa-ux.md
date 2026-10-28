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
**How to test:** Sign up a fresh account and open every screen before creating anything. Then search and filter for something that matches nothing, open a screen your role can't use, and make a list request fail.
**Pass:** Each screen has an empty state that tells the user what to do next. A search or filter with no matches says so and offers to clear the filters; a screen the user can't access says why and whom to ask; a failed load shows an error with a retry, never the empty state.
**Fix:** Add empty states with one clear call to action.

### QA-004 · Placeholder and hardcoded text
**Severity:** P1
**Why it breaks:** "Lorem ipsum", "John Doe", "Your Company", `test@example.com`, default titles like "Vite + React" or "Create Next App", and English strings hardcoded in an i18n app.
**How to test:** Search for `lorem`, `john doe`, `example.com`, `your company`, `Vite + React`, `Create Next App`. In i18n apps, search components for literal UI strings, then switch the language and walk the main flow. Legal texts and contracts kept in a CMS or database don't show up in a repo search: check the rendered live pages for `____`, "to be updated" and `[company address]`.
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
**Why it breaks:** AI wires "Delete", "Cancel subscription" or "Remove" straight to the API. It also hangs status changes on clicks that look harmless: clicking an ID badge or a file name downloads the export and marks the item as exported, so it leaves the queue without anyone deciding that.
**How to test:** Trigger every delete, cancel and remove action and read the confirm button's label. On queue and list screens, click every badge, chip, file name and preview, then check whether any item's status changed.
**Pass:** Anything that can't be reversed asks for confirmation (naming the item) or offers undo; badges, file names and previews change no status. The confirm button repeats the action and the object ("Delete project"), not "OK" or "Yes"; where recovery is safe, undo beats a dialog.
**Fix:** Add a confirm dialog, or soft delete with undo. Change status only through a button that says so ("Export and mark as sent"), never through a link that looks like a view or a copy.

### QA-007 · Wrong keyboard and no autofill on mobile
**Severity:** P2
**Why it breaks:** AI uses plain text inputs for email, phone, numbers and one-time codes.
**How to test:** Fill every form on a real phone. On split one-time-code boxes, accept the iOS code suggestion and paste a code.
**Pass:** The right keyboard opens and autofill works (email, phone, one-time code, password); all code digits land (`maxLength={1}` per box truncates autofill and paste), and the first box has `autoFocus` and `textContentType="oneTimeCode"`.
**Fix:** Web: set `type`, `inputmode` and `autocomplete`. React Native: set `keyboardType` and `autoComplete` / `textContentType`.

### QA-017 · File imports that run twice, guess or drop rows
**Severity:** P1
**Why it breaks:** AI writes the importer for the happy path: one file is one document, every file is a supported type, every row is valid, running twice is harmless. In practice the same batch is imported twice, a merged PDF counts as one document, only the first sheet is read, a column dragged down with one repeated value is accepted, a missing unit is assumed, sentinel values like "N/D" are dropped, an unsupported file sits in the inbox with no alert, and re-importing an export applies a markup twice. A document parser loses a whole section on one OS's converter while a duplicate row elsewhere keeps the total right. The source's own status column is ignored, so expired or withdrawn rows count as active. The client checks for duplicates with a different normalization than the server, and the server adds a suffix to a duplicate key instead of refusing it, so every re-run adds copies.
**How to test:** Import the same file twice (also renamed); a merged multi-document file; an unsupported type; a workbook with several sheets; a column with one value in every row; missing units and sentinel values; an export re-imported; rows the source marks expired or withdrawn; a key that differs from an existing one only in case or spacing. Compare rows in vs out. For documents (PDF, Word, HTML) with no row count, compare section by section with a reference count, and run the import on every converter and OS production uses.
**Pass:** Every input row is imported or listed as skipped with a reason; duplicates are refused by business key (a 409, never a renamed copy); rows treated as active match the source's own active count; unsupported or suspicious files go to a rejected folder with an alert; the summary shows read / imported / skipped counts.
**Fix:** Content hash plus a unique business key, normalized by one function on client and server; a rejected folder with a reason; row-level sanity rules; no default units or fuzzy auto-match; map every status or validity value the source gives; per-section reference counts for documents; round-trip-safe export columns; regression tests with real anonymized files.

### QA-018 · Client timeout shown as failure while the server finished
**Severity:** P1
**Why it breaks:** Slow third-party senders (SMS or e-mail one-time codes) take longer than the client timeout. AI shows the same "unexpected error" for a timeout as for a 500: the code arrives, but the user is stuck on an error screen with nowhere to type it, or retries into a rate limit.
**How to test:** Delay the send endpoint past the client timeout with a proxy while the server still sends.
**Pass:** A timeout on a non-idempotent send moves on to the next step with "this may take a moment"; only a real server error asks to retry.
**Fix:** Handle timeout errors (`ECONNABORTED`, `AbortError`) separately from HTTP errors.

### QA-024 · Watch progress that erases itself
**Severity:** P1
**Why it breaks:** AI saves the player position on exit and derives "completed" from that same position. A user who leaves before the player has loaded saves 0 seconds and loses their place. A finished item resumes at its last second: a black frame, a full bar and a spinner that never stops. Rewatching a completed lesson from the start writes a small position, so it flips back to "not completed", and course completion, certificates and admin lists built on it go with it.
**How to test:** Open an item with saved progress and leave within a second, then reopen it. Watch one to the end and reopen it from every entry point (continue button, list, favorites, deep link). Complete a course, restart one lesson from 0, then check completion, the certificate and the admin lists.
**Pass:** The saved position survives; a finished item starts from the beginning; completion never goes back.
**Fix:** Save a position only after playback has started, and never save 0 (or the first few seconds) over a larger saved position; resume from 0 when the saved position is within a few seconds of the end; store completion as its own flag that only changes from false to true. Enforce these rules on the server so web and mobile behave the same. See `EXPO-031`, `EXPO-034`.

### QA-025 · Generated PDF reports that break on real data
**Severity:** P2
**Why it breaks:** AI guesses column widths, so IDs, e-mails and dates wrap, headers split mid-word, and every fix steals width from another column. Summary rows split across pages and headings are left alone at the bottom of a page. Names with line breaks, zero-width or right-to-left marks, or emoji break the layout or crash the generator. Embedded phone photos are decoded at full size (memory, decompression bombs) or shrunk until they print blurry. A row cap cuts the report with no note.
**How to test:** Generate every report with the longest real values, a name containing a line break and a zero-width character, zero rows, one row, more rows than the cap, a 12 MP phone photo and a 20,000×20,000 image. Print one page.
**Pass:** IDs, e-mails and dates stay on one line; totals and headings stay with their rows; nothing crashes; photos are sharp but size-limited; a capped report says it was cut.
**Fix:** Size fixed-format columns from their longest value and let free text take the rest; strip format characters (Unicode category Cf: zero-width spaces, bidi marks) from names and IDs, but keep the zero-width non-joiner and joiner (U+200C, U+200D) inside words in scripts that need them, such as Persian (see `QA-027`) and normalize line breaks; keep summary blocks together and reserve space before headings; read the pixel size from the image header before decoding (Pillow `Image.open(f).size` before `load()`, ImageSharp `Image.Identify`), refuse oversized images and scale the rest to a target size; print "first N of M" when capped. See `QA-012`.

### QA-026 · Layouts that only fit the demo data
**Severity:** P1
**Why it breaks:** AI builds lists, cards, headers, tables and buttons around short seed names and small numbers. A 100-character name with no spaces, an emoji, Chinese or Japanese text, a ten-digit amount, or a list of 0, 1 or 1,000 items then pushes buttons off the screen, runs into the next column or hides the part of the value the user needs. See also `QA-012`, `FE-004`.
**How to test:** Put each of those values into test records and open every screen that shows them, at the narrowest supported width on the web and on the smallest supported phone.
**Pass:** Nothing overlaps or leaves its box; long values wrap, or are truncated with the full value reachable (tooltip, detail screen); lists, badges and counters hold at 0, 1 and 1,000 items.
**Fix:** `min-width: 0` on flex children, `overflow-wrap: anywhere`, a line clamp plus `title` for the full text; in React Native, `numberOfLines` with `flexShrink: 1` on the text.

## Manual QA before launch

- [ ] `QA-008` **P0** On production, with a fresh account: sign up, verify, do the main action and pay (if the app takes payments), end to end
- [ ] `QA-009` **P0** Transactional e-mails arrive in the inbox (not spam) at Gmail, Outlook, Yahoo and iCloud, and every link in them points to production, not localhost (if the app sends e-mail). The sending domain has exactly one SPF record (no `+all`), DKIM set up as the provider says (CNAME vs TXT) and a DMARC record; check `dkim=pass` in the raw headers. Re-test after every hosting, DNS or mail-provider change. Login and reset codes use their own sender, never the mailbox used for bulk mail or load tests
- [ ] `QA-010` **P1** Session expires mid-action: the user is sent to login and comes back to the same place; nothing fails silently. The return address survives every step of a multi-step login: AI keeps `?redirect=` on the first screen and drops it on the code, sign-up or social-login step (validate it as in `AUTH-005`). Test: from every page that sends to login (checkout, a form, locked content, admin), walk each branch (existing account → code; unknown e-mail → sign-up → code; social login) and check that you land back on that page with what you had filled in or ticked
- [ ] `QA-011` **P1** Slow network (DevTools "Slow 4G" / "3G"): every action shows progress within 1 second
- [ ] `QA-012` **P1** Locale: special letters (e.g. Turkish İ/ı) sort, search and uppercase correctly, also inside keys (e-mails, codes, import headers: use invariant lowercasing), PDFs (embed a font with those glyphs) and DB columns (Unicode types, not Latin1 `varchar`); no mojibake in seed files; long translations don't break the layout; times are stored in UTC and converted once for display; dates, numbers and currency follow the user's locale; keyword and urgency detectors on user text lowercase with the user's locale (`ACİL` becomes `acil` only with Turkish rules) and match inside sentences, not only one-word messages; input-cleanup regexes run before classification keep local letters and `?` (`[^a-zA-Z0-9 ]` and JavaScript's ASCII-only `\w` strip them); search ignores case and accents, so `istanbul`, `cay` and `munchen` find `İstanbul`, `çay` and `München`, with one folding rule (locale-aware lowercase, strip diacritics, map `İ`/`I`/`ı` to `i`) used on server and client, because `ILIKE`, SQL Server's default `_CI_AS` collations and SQLite `NOCASE` don't fold accents. Test: type the accent-free and the upper-case spelling of a seeded accented name into every search box
- [ ] `QA-013` **P1** Error messages say what happened and what to do next, in the user's language; no raw `500`, `undefined` or stack text. A 403 says the user lacks access and who can grant it, a 404 shows a not-found state with a way back, a 429 says when to try again; none of them turns into a generic toast or an empty list. Error toasts stay long enough to read (about 5 seconds for a sentence, not 2). Test: force a 403, a 404 and a 429 on the main screens (DevTools response override or a proxy)
- [ ] `QA-014` **P1** After every action the user can tell it worked (updated list, message or redirect) and, when it was blocked, why. A message written into the current page (a WebForms `RegisterStartupScript` alert, MVC `ViewData`, a toast right before `window.location.href = …`) disappears when the handler then redirects, so the block works but the user sees a reload with no reason and retries; carry the message across the redirect (session, `TempData`, a flash cookie or a query flag). Test: trigger each validation or rule block on actions that redirect
- [ ] `QA-015` **P2** Copy proofread: no typos, the same term for the same thing, button labels are verbs
- [ ] `QA-016` **P1** Every translation file has the same keys as the main language: no missing, empty or untranslated entries (compare the key lists with a script or an i18n linter)
- [ ] `QA-019` **P2** Logging out from any page (deep pages, a player, the admin area), on web and mobile and with an expired session, lands on a working page, never a blank screen
- [ ] `QA-020` **P2** In lists and cards the whole row is the tap target, not only a small icon or the title text
- [ ] `QA-021` **P2** Long jobs (imports, exports, batch processing) show a count, progress and an estimated finish, so users can tell a running job from a stuck one. Progress comes from real counts the server reports, never from a timer-driven bar, and the label names the operation ("Importing 340 of 1,200 rows"). Test: pause the job on the server: the bar stops too
- [ ] `QA-022` **P2** Search finds records outside the list's default date and status filters (or says the list is filtered), and "today" means the date the user acted, not the date the record was created
- [ ] `QA-023` **P2** Replacing an image or video in the admin updates every derived value (poster, thumbnail, duration) for users on a fresh device; derived data cached on the server is cleared with the file instead of being blamed on the browser cache. Also check on a device that already showed the old image: a server-generated image at a fixed URL (`/items/12/thumbnail`) stays in app image caches, which key on the URL and can keep it for days, and in browsers until its `max-age` runs out. Put a version that changes with the file into the URL (`?v=<updatedAt or hash>`); a stamp tied to the app version only refreshes on the next release
- [ ] `QA-027` **P1** Right-to-left languages work (if the app ships Arabic, Hebrew, Persian or Urdu): the direction is set (`dir="rtl"` on `<html>`, `I18nManager` in React Native, `Directionality` in Flutter); layouts use logical properties (`margin-inline-start`, `start` / `end`) instead of left and right; arrows, back icons and progress bars mirror; text cleanup keeps the zero-width non-joiner (U+200C) that Persian words need; search treats the Arabic and Persian forms `ي` / `ی` and `ك` / `ک` as the same letter; digits and calendars come from `Intl`, not hand-written formats. Test: switch to Arabic or Hebrew and walk the main flow; grep shared components for `margin-left`, `padding-right` and `left:`
- [ ] `QA-028` **P2** Counts use the i18n library's plural rules (ICU messages, `Intl.PluralRules`, i18next `_one` / `_other` keys), not `count !== 1 ? 's' : ''`, and messages are whole sentences with placeholders, not fragments glued together in code, so translators can reorder the words. Test: grep for `!== 1 ?`, `=== 1 ?` and string concatenation around translated keys; show 0, 1, 2, 5 and 21 items in a language with several plural forms (Arabic, Polish, Russian)
- [ ] `QA-029` **P2** Onboarding, tours and tips can be skipped at every step and show only once: finishing or dismissing is remembered (on the server for signed-in users, so a new device or a cleared cache doesn't replay it), returning users don't see it again, and it can be replayed from help. Test: new account, skip at each step; log out and back in; sign in on a second device
- [ ] `QA-030` **P2** Long forms and editors don't lose what was typed: leaving with unsaved changes asks first (a route guard plus `beforeunload`), or a draft is saved and offered back on return; a native sheet closed by the back gesture or a tap on the backdrop keeps its draft (see `FE-007`, `MOB-009`, `EXPO-046`). Test: fill a long form, then go back, close the tab, change the route and kill the app, returning after each: the input is still there, or you were asked before leaving
