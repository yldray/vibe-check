# Supabase — chronic issues

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

### SUPA-012 · Roles and plans read from user-editable metadata
**Severity:** P0
**Why it breaks:** AI stores `role`, `is_admin`, `plan` or `org_id` in user metadata and trusts it in a policy (`auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'`), a function or app code (`user.user_metadata.role`). Every user can rewrite it with `supabase.auth.updateUser({ data: { role: 'admin' } })`. AI's signup trigger (`handle_new_user`) also often copies `raw_user_meta_data ->> 'role'` (or plan, credits) into `profiles`, so anyone can sign up as admin with `signUp({ email, password, options: { data: { role: 'admin' } } })`.
**How to test:** `select tablename, policyname from pg_policies where coalesce(qual, '') || coalesce(with_check, '') ~* 'user_metadata|raw_user_meta_data';` and the same regex on `prosrc` of functions in `public`. Grep app and `supabase/functions` code for `user_metadata` near `role|admin|plan|tier|org|tenant|credits` (a display name is fine, an access decision is not). Sign up with `data: { role: 'admin', plan: 'pro' }`, run `updateUser({ data: { role: 'admin' } })`, refresh the session and open an admin-only page or table.
**Pass:** Metadata only feeds display fields; new accounts get the default role; admin data stays closed.
**Fix:** Keep roles, plans and tenant ids in `app_metadata` (only the secret key can write it, via `auth.admin.updateUserById()`) or in a `user_roles` table clients can't write; policies read `auth.jwt() -> 'app_metadata'`. The signup trigger sets the default role and ignores client data.

### SUPA-013 · Users can write privileged columns on their own row
**Severity:** P0
**Why it breaks:** AI puts `role`, `is_admin`, `plan`, `credits`, `subscription_status` or `stripe_customer_id` on `profiles` and adds the usual owner policy (`for update using (auth.uid() = id)`). Policies choose rows, not columns, and the table-level `update` grant covers every column, so a user runs `supabase.from('profiles').update({ role: 'admin', credits: 99999 }).eq('id', user.id)` in the browser console and gets admin or paid features. Supabase is turning off the automatic grants on new tables; AI "fixes" the resulting `42501 permission denied` with `grant all on … to anon, authenticated`, which reopens every column.
**How to test:** `select table_name, column_name from information_schema.columns where table_schema = 'public' and column_name ~* '^(role|is_admin|plan|tier|credits|balance|is_premium|subscription_status|stripe_customer_id)$' and (has_column_privilege('authenticated', format('public.%I', table_name), column_name, 'UPDATE') or has_column_privilege('authenticated', format('public.%I', table_name), column_name, 'INSERT'));` and `grep -rn "grant all" supabase/migrations`. For each hit with an owner insert or update policy, run the update above as a normal user.
**Pass:** The update fails with `42501 permission denied`; those columns change only from server code or a function that checks the rule.
**Fix:** `revoke insert, update on public.profiles from anon, authenticated; grant insert (id, full_name, avatar_url), update (full_name, avatar_url) on public.profiles to authenticated;`, or move role, plan and credits to a table users can only read. See `FIRE-011`.

### SUPA-014 · Public profiles leak private columns
**Severity:** P0
**Why it breaks:** To show names and avatars (a feed, a member list, a booking calendar), AI adds `for select using (true)` to a table that also holds e-mail, phone, address or `stripe_customer_id`, often copied from `auth.users` by the signup trigger. The API returns every column, so `select=*` with the public key lists every user's contact data, and the Security Advisor stays quiet because its sensitive-column lint only checks tables without RLS.
**How to test:** `select p.tablename, p.policyname, c.column_name from pg_policies p join information_schema.columns c on c.table_schema = p.schemaname and c.table_name = p.tablename where p.schemaname = 'public' and p.cmd in ('SELECT', 'ALL') and p.qual = 'true' and c.column_name ~* 'email|phone|address|birth|stripe|customer|iban|token|password';`. Then `curl "https://<ref>.supabase.co/rest/v1/<table>?select=*&limit=5" -H "apikey: <publishable key>"`, and again with a fresh user's token.
**Pass:** Rows readable by everyone (or every signed-in user) return only public fields.
**Fix:** Move private fields to a separate table with an owner-only policy, or limit columns: `revoke select on public.profiles from anon, authenticated; grant select (id, username, avatar_url) on public.profiles to anon, authenticated;`. Don't copy `auth.users.email` into a public table. See `SUPA-002`.

### SUPA-015 · Database functions anyone can call over `/rpc`
**Severity:** P0
**Why it breaks:** Postgres lets PUBLIC execute every new function, and Supabase projects also grant `anon` and `authenticated`, so every function in an exposed schema is a `POST /rest/v1/rpc/<name>` endpoint. AI writes `security definer` helpers there (one to fix "infinite recursion detected in policy", `get_user_orders(p_user_id uuid)` after `auth.uid()` came back null, `delete_user(uid)`, `add_credits(...)`). They run as the owner, skip RLS and trust the id they are given; the Security Advisor lists them only as warnings (see `SUPA-007`).
**How to test:** `select p.oid::regprocedure, p.prosecdef, has_function_privilege('anon', p.oid, 'execute') as anon, has_function_privilege('authenticated', p.oid, 'execute') as authenticated from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prokind = 'f' and p.prorettype <> 'trigger'::regtype;`. Call each callable definer function that takes a user, owner or org id, or changes money or roles: `curl -X POST "https://<ref>.supabase.co/rest/v1/rpc/<name>" -H "apikey: <publishable key>" -H "Content-Type: application/json" -d '{"p_user_id":"<another user id>"}'`.
**Pass:** `anon` and `authenticated` can execute only the functions the app calls; each takes the user from `auth.uid()` and checks ownership; policy helpers live in a schema the API doesn't expose.
**Fix:** `revoke execute on function public.get_user_orders(uuid) from public, anon, authenticated;` and grant back only what's needed; use `(select auth.uid())` instead of a user id parameter and `set search_path = ''`; move policy helpers to a `private` schema. For new functions: `alter default privileges for role postgres revoke execute on functions from public;` (without `in schema`: a per-schema revoke can't remove the PUBLIC default). See `SUPA-004`.

### SUPA-016 · Storage policies that check only the bucket
**Severity:** P0
**Why it breaks:** An upload fails with "new row violates row-level security policy", and AI adds `for insert to authenticated with check (bucket_id = 'documents')` and the same for select. Now every signed-in user can list, download, overwrite (`upsert`) and delete everyone's files in that bucket. On public buckets AI also adds a broad select policy, which lets anyone list every file name.
**How to test:** `select policyname, cmd, roles, coalesce(qual, with_check) from pg_policies where schemaname = 'storage' and tablename = 'objects' and coalesce(qual, '') || coalesce(with_check, '') !~* 'auth\.uid|auth\.jwt|owner_id|foldername';` lists policies that never look at the user; `select id, public, file_size_limit, allowed_mime_types from storage.buckets;` shows the limits. Signed in as user B, call `list`, `download`, `upload(…, { upsert: true })` and `remove` on user A's folder.
**Pass:** All four fail for B; no public bucket has a broad select policy; upload buckets set a size limit and MIME types.
**Fix:** Store files under `<user id>/…` and give each operation its own policy with `bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid()::text)` (`upsert` also needs an update policy); set `file_size_limit` and `allowed_mime_types` on the bucket. Public buckets serve files by URL without any select policy. See `SUPA-005`, `SEC-008`.

### SUPA-017 · "Signed in" is the only check, and anyone can sign in
**Severity:** P0
**Why it breaks:** AI writes `to authenticated using (true)`, `using (auth.uid() is not null)` or the deprecated `auth.role() = 'authenticated'`, and hides admin or team screens in the UI. Sign-up is open by default: anyone with the public key can call `signUp()` and confirm from a throwaway inbox, and when anonymous sign-ins are on, `signInAnonymously()` gives the `authenticated` role too. Internal tools, team data and admin tables are then open to strangers.
**How to test:** `select tablename, policyname, cmd, qual, with_check from pg_policies where schemaname = 'public' and roles && '{authenticated,public}'::name[];` and flag each condition that is only `true`, `auth.uid() IS NOT NULL` or `auth.role() = 'authenticated'` on data not meant for every user. Check Authentication → Sign In / Providers ("Allow new users to sign up", "Allow anonymous sign-ins") and `enable_signup` / `enable_anonymous_sign_ins` in `supabase/config.toml`. Sign up through `POST /auth/v1/signup` with the publishable key and read those tables with the new session.
**Pass:** A fresh account sees only its own rows and public data; invite-only apps have sign-up off; anonymous users can't write where only real users should.
**Fix:** Policies that check ownership or membership (`team_id in (select team_id from public.team_members where user_id = (select auth.uid()))`); sign-up off for invite-only apps (invite with `auth.admin.inviteUserByEmail()` from server code); for anonymous sign-ins, an `as restrictive` policy with `(select (auth.jwt()->>'is_anonymous')::boolean) is false`. See `SUPA-002`, `FIRE-003`.

### SUPA-018 · Server code that bypasses RLS trusts the caller
**Severity:** P0
**Why it breaks:** When a query fails with "new row violates row-level security policy", AI moves it to an Edge Function or API route that uses the secret (`service_role`) key, or to Prisma or Drizzle on `DATABASE_URL`, which connects as `postgres`. RLS no longer applies, and the code takes `user_id`, `org_id` or the record id from the request body. AI also treats `verify_jwt` as a login check, but it accepts the public anon / publishable key, so anyone with that key can read or change any user's data.
**How to test:** `grep -rnE "SERVICE_ROLE|SECRET_KEY|sb_secret_|supabaseAdmin|DATABASE_URL|PrismaClient|drizzle\(" supabase/functions app pages src server lib` lists the paths that bypass RLS; in each, trace every id used in a query to the verified token or the request. Call each Edge Function with only the public key and a body naming another user, then as user B with user A's ids.
**Pass:** No user session gives 401; another user's ids give 403 or 404; user ids come only from the caller's verified token.
**Fix:** Get the user from the verified token (`supabase.auth.getClaims(token)` / `getUser(token)`, or `withSupabase({ auth: 'user' }, …)` from `@supabase/server`) and query with an RLS-scoped client; use the secret-key client only after an ownership check; filter every Prisma / Drizzle query by the verified user id. Cron and webhook functions use a shared secret or the provider's signature. See `SUPA-006`, `UNI-004`.

### SUPA-019 · `getSession()` trusted on the server
**Severity:** P0
**Why it breaks:** AI checks the user with `supabase.auth.getSession()` in Next.js middleware / proxy, Server Components, route handlers or SvelteKit hooks. On the server, `getSession()` reads the session from the cookie without verifying it, and anyone can edit their own cookie, so code that gates pages, picks an admin view or queries with the secret key based on `session.user` is fooled by a forged cookie.
**How to test:** `grep -rn "auth.getSession(" middleware.* proxy.* app pages src server lib` and keep the hits that run on the server; check what `session.user` decides there (the server log may warn that the user object from `getSession()` "could be insecure"). Live: decode the `sb-<ref>-auth-token` cookie, change `user.id` or `app_metadata`, encode it back and reload a protected page.
**Pass:** Server code authorizes with `getClaims()` or `getUser()`; the forged cookie gets a redirect or 401.
**Fix:** `supabase.auth.getClaims()` on the server (it verifies the JWT), `getUser()` where a sign-out on another device must take effect at once; `getSession()` only in browser code. Replace the deprecated `@supabase/auth-helpers-*` packages with `@supabase/ssr`. See `AUTH-001`.

### SUPA-020 · One user's session served to another
**Severity:** P0
**Why it breaks:** AI creates one client at module level (`export const supabase = createClient(…)`) and uses it in server code, where it keeps the session in memory: after one `signInWithPassword()` in a route handler, later requests from other users run as that user, and warm serverless instances reuse it. A token refresh also sends `Set-Cookie`; if ISR or a CDN caches that response, the next visitor gets the cookie and is signed in as someone else.
**How to test:** `grep -rnE "^(export )?const \w+ = create(Server)?Client\(" lib src app utils` and look for `auth.signIn*`, `setSession` or `exchangeCodeForSession` on those clients. Check that `@supabase/ssr` is 0.10.0 or later and that `setAll(cookiesToSet, headers)` applies `headers` to the response; grep authenticated routes for `revalidate`, `force-static` or ISR. On production, a response with `set-cookie: sb-…` carries `cache-control: private, no-store` and is never a CDN hit.
**Pass:** Server clients are created per request; responses that set auth cookies are never cached; two browsers never see each other's account.
**Fix:** Create the server client inside each request with that request's cookies; apply `setAll`'s `headers` (or set `Cache-Control: private, no-store`); no ISR or static rendering on authenticated pages. See `REACT-020`, `WEB-016`.

### SUPA-021 · Realtime channels anyone can join
**Severity:** P0
**Why it breaks:** AI builds chat, notifications, typing indicators or live updates with `supabase.channel('room:' + id)` and Broadcast or Presence. Channels are public unless created with `config: { private: true }`, so anyone with the public key who knows or guesses a topic can listen in and post messages that look like they come from anyone. When AI does make channels private, it copies a `realtime.messages` policy with `to authenticated using (true)`, so every signed-in user can join every topic, including `realtime.broadcast_changes()` topics that carry whole table rows past the table's RLS.
**How to test:** `grep -rn "\.channel(" src app lib` and check every channel that carries user data for `private: true`. `select policyname, cmd, roles, qual, with_check from pg_policies where schemaname = 'realtime' and tablename = 'messages';` must not show `true`. Check Realtime → Settings → "Allow public access". With only the public key, subscribe to another user's topic and send to it; as user B, join user A's private topic.
**Pass:** Channels with user data are private; `realtime.messages` policies tie `(select realtime.topic())` to the caller's membership; public access is off when no public channel is needed.
**Fix:** `supabase.channel(topic, { config: { private: true } })` plus select and insert policies on `realtime.messages` that check membership for the topic; then turn off "Allow public access". Postgres Changes already apply the table's RLS per subscriber. See `AUTH-011`.
