# Supabase — chronic issues

> 🌱 Seeded list. Contributions welcome.

### SUPA-001 · RLS off on a public table
**Severity:** P0
**Why it breaks:** AI creates tables and never enables Row Level Security. The anon key ships in every client, so anyone can read and write every row through the REST API.
**How to test:** Run `select tablename from pg_tables where schemaname = 'public' and not rowsecurity;`. Then call `https://<project>.supabase.co/rest/v1/<table>` with only the anon key.
**Pass:** RLS is on for every table in an exposed schema; the anon request returns only what your policies allow.
**Fix:** `alter table <table> enable row level security;` plus policies that use `auth.uid()`.

### SUPA-002 · A policy that allows everything
**Severity:** P0
**Why it breaks:** AI "fixes" a permission error with `using (true)` or `with check (true)`, which is the same as having no RLS.
**How to test:** Search migrations and policies for `(true)`. Signed in as user A, read, update and delete user B's rows.
**Pass:** No `true` policies on user data; cross-user access is denied.
**Fix:** `using (auth.uid() = user_id)`, and a `with check` on insert and update.

### SUPA-003 · Service role key in the client
**Severity:** P0
**Why it breaks:** AI uses the service role key (or a `sb_secret_…` key) to get past RLS errors. It bypasses RLS completely and ends up in the bundle.
**How to test:** Search the repo and the build output for `service_role` and `sb_secret_`.
**Pass:** Those keys exist only in server-side environment variables.
**Fix:** Use the anon or publishable key in clients. Rotate the secret key if it ever shipped.

### SUPA-004 · Views and functions that skip RLS
**Severity:** P1
**Why it breaks:** Views run with their owner's rights by default, and `security definer` functions bypass RLS. AI creates both to "simplify" queries.
**How to test:** List views without `security_invoker` and `security definer` functions in exposed schemas; call them as a different user.
**Pass:** They only return what the caller may see.
**Fix:** `create view ... with (security_invoker = true)` (Postgres 15+). Move `security definer` functions to a schema the API doesn't expose, or check `auth.uid()` inside them.

### SUPA-005 · Private files in a public bucket
**Severity:** P1
**Why it breaks:** AI makes a storage bucket public so images load, and user documents land in it too.
**How to test:** Open the URL of a private file in a logged-out browser.
**Pass:** Access is denied; private files are served through signed URLs.
**Fix:** A private bucket with storage policies, and `createSignedUrl` with a short expiry.

### SUPA-006 · Edge Function without auth
**Severity:** P1
**Why it breaks:** The function is deployed with `--no-verify-jwt`, or it never checks who the user is.
**How to test:** Call it without an `Authorization` header, then as another user.
**Pass:** 401 or 403, unless it's meant to be public (a webhook that checks the provider's signature).
**Fix:** Verify the JWT and the user's ownership; webhooks verify the provider signature instead.
