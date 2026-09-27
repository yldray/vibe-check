# Supabase — pre-launch test cases

> 🌱 Seeded list. Contributions welcome.

- [ ] `SUPA-007` **P0** Dashboard → Advisors → Security Advisor shows no errors (RLS disabled, security definer views, exposed auth data)
- [ ] `SUPA-008` **P1** RLS tests exist for every user-data table: signed out, own rows and another user's rows (pgTAP via `supabase test db`)
- [ ] `SUPA-009` **P1** Auth → URL configuration: Site URL and Redirect URLs point to production only; e-mail confirmation is on
- [ ] `SUPA-010` **P1** Backups exist: the Free plan has no automatic backups, so either use a paid plan (Dashboard → Database → Backups) or schedule your own `pg_dump`
- [ ] `SUPA-011` **P1** Production doesn't run on the Free plan: free projects are paused after 1 week of inactivity
