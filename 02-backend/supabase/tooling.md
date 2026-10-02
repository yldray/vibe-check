# Supabase — tooling

| Purpose | Tool |
|---|---|
| Local stack | Supabase CLI (`supabase start`) |
| RLS and SQL tests | pgTAP via `supabase test db` |
| Schema changes | `supabase db diff`, `supabase migration list`, `supabase db pull`; migrations in the repo |
| Security review | Dashboard → Advisors (Security and Performance); `supabase db advisors --type security --level warn` in CI |
| Grants and policies | SQL Editor or `psql`: `pg_policies`, `has_column_privilege`, `has_function_privilege`, `pg_trigger` |
| Attacker's view | `curl` with only the publishable key against `/rest/v1/<table>`, `/rest/v1/rpc/<fn>`, `/auth/v1/signup`, `/functions/v1/<name>` |
| Cross-user tests | A supabase-js script or the browser console signed in as two test users (tables, Storage, Realtime) |
| Secrets in SQL | Supabase Vault (`vault.create_secret`, `vault.decrypted_secrets`) |
| SSR auth | `@supabase/ssr` 0.10.0 or later; `getClaims()` on the server |
| Types | `supabase gen types` |
