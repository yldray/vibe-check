# Supabase — AI audit prompts

Paste into Claude Code, Cursor or any agent:

```
Audit this Supabase project for production readiness.
Check: tables without RLS, policies that are (true) or only "signed in", open sign-up and anonymous
sign-ins, roles or plans read from user_metadata (policies, functions, the handle_new_user trigger),
privileged columns users can update on their own row, public rows that expose private columns,
security definer functions callable over /rpc, storage policies that check only bucket_id, the
service role key or DATABASE_URL used with ids from the request, getSession() on the server,
module-level server clients and cached auth cookies, public Realtime channels, Edge Functions
without a user check, secrets written into SQL, the auth.users trigger, SMTP, backups, plan,
and drift between the live schema and supabase/migrations.
Output a table: severity (P0/P1/P2), file:line, issue, fix.
Do not change code until I approve.
```
