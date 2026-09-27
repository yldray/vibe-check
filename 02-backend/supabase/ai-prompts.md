# Supabase — AI audit prompts

Paste into Claude Code, Cursor or any agent:

```
Audit this Supabase project for production readiness.
Check: RLS enabled on every table in exposed schemas, policies with using (true),
service_role or sb_secret_ keys in client code, views without security_invoker,
security definer functions, public storage buckets holding private files,
Edge Functions without JWT or signature checks. Output a table: severity (P0/P1/P2), file:line, issue, fix.
Do not change code until I approve.
```
