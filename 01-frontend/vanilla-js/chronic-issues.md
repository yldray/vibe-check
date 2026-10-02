# Vanilla JS — chronic issues

### JS-001 · innerHTML with user input
**Severity:** P0
**Why it breaks:** AI builds HTML with string concatenation.
**How to test:** Insert an XSS payload.
**Pass:** Not executed.
**Fix:** textContent or sanitize.

### JS-002 · Event listeners added repeatedly
**Severity:** P1
**Why it breaks:** Listeners attached on every render.
**How to test:** Click once, count handler calls.
**Pass:** One call.
**Fix:** Attach once or use delegation.

### JS-003 · Floating point money math
**Severity:** P1
**Why it breaks:** Prices calculated with floats.
**How to test:** 0.1 + 0.2 style totals.
**Pass:** Exact totals.
**Fix:** Integer cents or a decimal library.

### JS-006 · `message` events trusted from any origin
**Severity:** P0
**Why it breaks:** AI adds `window.addEventListener('message', e => …)` for a payment iframe, an embedded widget or a login popup and never checks `e.origin`, or checks it with `indexOf`, `includes` or `endsWith`, so `https://example.com.evil.net` passes. Any site that frames or opens your page can then send a fake "paid" message or HTML that lands in the DOM. On the sending side AI uses `postMessage(data, '*')`, so a login popup hands its token to whatever page opened it.
**How to test:** `grep -rnE "addEventListener\(['\"]message|onmessage|postMessage\(" --include=*.js --include=*.html .`. In each listener the first statement must compare `event.origin` exactly against a fixed list; in each `postMessage` that carries data, the second argument must be an exact origin, not `'*'`.
**Pass:** Listeners drop other origins and check the shape of `event.data`; nothing sensitive is posted to `'*'`; message data never reaches `innerHTML` or `eval`.
**Fix:** `if (!ALLOWED_ORIGINS.has(event.origin)) return;` with full origins in a `Set`, then validate the data; post with an exact origin (`popup.postMessage(data, 'https://app.example.com')`). See `PAY-020`.

### JS-007 · HTML and code sinks other than `innerHTML`
**Severity:** P0
**Why it breaks:** A search for `innerHTML` (`JS-001`) misses the other ways AI turns a string into markup or code: `insertAdjacentHTML`, `outerHTML`, `document.write`, `iframe.srcdoc`, jQuery `.html()`, `.append()`, `.after()` and `$(html)`, `eval`, `new Function`, and `setTimeout` / `setInterval` with a string. A product name, URL parameter or API field holding `<img src=x onerror=…>` then runs as script.
**How to test:** `grep -rnE "insertAdjacentHTML|outerHTML|document\.write|srcdoc|eval\(|new Function|set(Timeout|Interval)\(['\"\`]" --include=*.js --include=*.html .`; with jQuery also grep `.html(`, `.append(`, `.prepend(`, `.after(`, `.before(` and `$(` called with a variable, and trace each argument back to user, URL or API data. Serve the pages once with the header `Content-Security-Policy-Report-Only: require-trusted-types-for 'script'` and walk the main flows: the console lists every string that reaches an HTML or script sink.
**Pass:** No user, URL or API string reaches a sink without sanitizing; every Trusted Types report is a reviewed call.
**Fix:** `textContent`, `createElement` and `setAttribute` (never `on*` attributes), jQuery `.text()`, functions instead of strings in timers, `JSON.parse` instead of `eval`, and `DOMPurify.sanitize()` where HTML is really needed. Enforce `require-trusted-types-for 'script'` once the report is clean. See `JS-001`.

### JS-008 · User links and redirects run `javascript:`
**Severity:** P0
**Why it breaks:** AI renders a profile "website" as `<a href="${user.website}">`, or sets `a.href`, `iframe.src`, `form.action` or `location.href` from `?next=`, `?redirect=` or `location.hash` without checking the scheme. HTML escaping doesn't help: `javascript:alert(document.cookie)` is a valid URL and runs on click. A check like `startsWith('javascript:')` misses `JavaScript:` and a leading space or tab, and `//evil.example` turns a redirect into an open redirect.
**How to test:** Save `javascript:alert(document.domain)` in every URL field users can edit and click the rendered link. Open each redirecting page with `?next=javascript:alert(1)`, `?next=%20javascript:alert(1)` and `?next=//example.org`. `grep -rnE 'href="\$\{|location(\.href)? *=|location\.(assign|replace)\(|\.(href|src|action) *=|window\.open\(' --include=*.js .` and trace each value.
**Pass:** No alert; links keep only `https:` and `http:` (plus `mailto:` where intended); redirects stay on your origin.
**Fix:** `const u = new URL(value, location.origin)` and allow only `u.protocol === 'https:' || u.protocol === 'http:'`; for redirects also require `u.origin === location.origin`. Check again on the server when the link is saved. See `AUTH-005`.

### JS-009 · CORS errors "fixed" in the browser
**Severity:** P0
**Why it breaks:** When a call fails with a CORS error, AI adds `mode: 'no-cors'` or sends the call through a public CORS proxy (`cors-anywhere`, `allorigins`, `corsproxy.io`). A `no-cors` response is opaque (status `0`, no body), so the code can't tell success from failure and shows "Sent!" anyway; the browser also drops `Authorization` and `Content-Type: application/json` without an error. A public proxy sees every request and response, tokens and personal data included, and the cors-anywhere demo needs a manual opt-in per browser, so it works only for the developer.
**How to test:** `grep -rnE "no-cors|cors-anywhere|allorigins|corsproxy|thingproxy" --include=*.js --include=*.html .`; submit each form that calls `fetch` and compare the request in DevTools → Network with what the server stored.
**Pass:** No `no-cors` on a call whose result matters; no third-party proxy; the server receives the JSON body and the auth header.
**Fix:** Fix CORS on the server you own (an exact `Access-Control-Allow-Origin`, see `SEC-005`), or call the third-party API from your backend.

### JS-010 · `fetch()` errors read as success
**Severity:** P1
**Why it breaks:** `fetch()` rejects only on network failures, so a 401, 404 or 500 resolves like a success. AI writes the call as if it were axios: `try { render(await (await fetch(url)).json()) } catch { showError() }`. `{"error":"Unauthorized"}` renders as an empty list, a proxy's HTML error page throws `Unexpected token '<'`, a `204` throws `Unexpected end of JSON input`, and a failed save shows "Saved!".
**How to test:** `grep -rn "fetch(" --include=*.js .` and check that every call goes through one helper that checks `response.ok` before reading the body. Make the API answer 401, 404, 500, 204 and an HTML 502 (stop the backend) and use every screen and form.
**Pass:** Each case shows a clear error, or sends the user to login on 401; nothing claims success; empty bodies are handled.
**Fix:** One `api()` helper: `if (!res.ok) throw new HttpError(res.status, await res.text())`; parse JSON only when the `content-type` is JSON and the status isn't 204; handle 401 in one place. See `UNI-024`, `QA-002`.

### JS-011 · Dates one day off
**Severity:** P1
**Why it breaks:** `new Date('2025-03-10')` reads a date-only string as UTC midnight, so users west of UTC see March 9; `<input type="date">.valueAsDate` is UTC midnight too. For "today", AI writes `new Date().toISOString().slice(0, 10)`, which is the UTC date: from 00:00 to 03:00 in Istanbul (UTC+3) it gives yesterday. Birthdays, due dates and booking days move by one day.
**How to test:** `grep -rnE "new Date\(|toISOString\(\)\.(slice|substring|split)|valueAsDate" --include=*.js .`. Run the main date flows with the browser in `America/Los_Angeles` and in `Europe/Istanbul` (OS time zone, or Playwright `timezoneId`) close to midnight: pick a date, save, reload, and check the "today" defaults.
**Pass:** The day the user picked is the day saved and shown, in both zones, at any hour.
**Fix:** Keep date-only values as `YYYY-MM-DD` strings; build and read them from local parts (`new Date(y, m - 1, d)`, `getFullYear()`, `getMonth()`, `getDate()`), never through `toISOString()`; send instants with an explicit offset. See `UNI-026`.

### JS-012 · Saved browser state breaks the start page
**Severity:** P1
**Why it breaks:** AI reads `JSON.parse(localStorage.getItem('cart')) || []` at startup and calls `setItem` on every change, with no `try`. It works in the developer's fresh browser and fails for returning users: `setItem(key, undefined)` stored the string `"undefined"`, data saved by the previous release has another shape, `localStorage` throws `SecurityError` when site data is blocked, and `setItem` throws `QuotaExceededError` when storage is full. The page stays blank until the user clears site data.
**How to test:** `grep -rnE "(local|session)Storage" --include=*.js .`. In DevTools → Application → Local storage, set each key to `{`, `undefined`, `null`, `[]` and an old-format object, then reload; block site data and reload; fill storage with large values and use the app.
**Pass:** The app always loads; bad or old values fall back to defaults and are rewritten; a failed write shows a message and doesn't break the action.
**Fix:** One `load(key, fallback)` / `save(key, value)` helper with `try/catch`, a `version` field and a shape check; migrate or drop old versions.

### JS-013 · `innerHTML +=` wipes handlers and typed input
**Severity:** P1
**Why it breaks:** To add a row, a chat message or a toast, AI writes `list.innerHTML += '<li>…</li>'`. That re-parses the whole container, so every existing child is replaced: listeners added with `addEventListener` are gone, typed text and focus are lost, and each append gets slower as the list grows.
**How to test:** `grep -rnE "innerHTML *\+=" --include=*.js --include=*.html .`. Type into a field inside the container, trigger the append, then check the field and click a button on an older row.
**Pass:** Typed text stays and older rows still respond.
**Fix:** `createElement` and `append()`, or `insertAdjacentHTML('beforeend', …)` for markup you control; one delegated listener on the container. See `JS-001`, `JS-002`.

### JS-014 · A button or Enter reloads the page
**Severity:** P1
**Why it breaks:** A `<button>` inside a `<form>` submits it unless it has `type="button"`, and Enter in a text field submits the form. AI wires `click` handlers on such buttons ("Add item", "Show password", "Apply coupon"), or calls `e.preventDefault()` after an `await`, which is too late. The page reloads, typed input is lost, the handler's request is cut off, and because a form's default is GET to the current URL, named fields land in the address bar and server logs, `?password=…` included.
**How to test:** `grep -rn "<button" --include=*.html --include=*.js . | grep -v "type="` and `grep -rn "<form" --include=*.html --include=*.js . | grep -v "method="`. With DevTools → Network → "Preserve log" on, press Enter in each field and click each button of every form: the URL must not change.
**Pass:** No reload, no field values in the URL; only real submit buttons submit.
**Fix:** Handle the form's `submit` event and call `event.preventDefault()` before any `await`; `type="button"` on every other button; `method="post"` on forms with passwords or personal data. See `FE-006`, `QA-005`.
