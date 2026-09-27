# React — pre-launch test cases

- [ ] `REACT-009` **P0** Production build runs (`npm run build && npm run preview`)
- [ ] `REACT-010` **P0** Protected routes redirect when logged out AND the API also rejects
- [ ] `REACT-011` **P0** No secrets in build output
- [ ] `REACT-012` **P1** Every data view has loading, empty and error states
- [ ] `REACT-013` **P1** Refresh on every route works (SPA fallback configured on host)
- [ ] `REACT-014` **P1** Forms: double submit blocked, server errors shown
- [ ] `REACT-015` **P1** E2E test for signup → login → main action
- [ ] `REACT-016` **P1** Lighthouse performance above 80 on mobile
- [ ] `REACT-017` **P2** Error boundary shows a fallback instead of a white screen
- [ ] `REACT-022` **P0** Next.js is at or above a version with the CVE-2025-29927 fix (12.3.5, 13.5.9, 14.2.25 or 15.2.3 and later)
- [ ] `REACT-023` **P1** Modules that use secrets or the database start with `import 'server-only'`
