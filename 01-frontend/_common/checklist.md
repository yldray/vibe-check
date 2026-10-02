# Frontend — common checks

- [ ] `FE-001` **P0** No secrets in the bundle (search the build output)
- [ ] `FE-002` **P0** Auth tokens not in `localStorage` if XSS is a risk; prefer HttpOnly cookies
- [ ] `FE-003` **P1** Works on Chrome, Safari, Firefox and mobile Safari
- [ ] `FE-004` **P1** Responsive at 360px, 768px and 1440px
- [ ] `FE-005` **P1** Loading, empty and error states on every data view
- [ ] `FE-006` **P1** Forms: double submit blocked, errors shown, server errors handled
- [ ] `FE-007` **P1** Back button and page refresh don't break state
- [ ] `FE-008` **P2** SEO: title, meta description, OG tags, sitemap, robots.txt
- [ ] `FE-009` **P2** Favicon and app icons
- [ ] `FE-010` **P1** No errors in the browser console on production pages (missing files, failing third-party scripts, hydration errors). Test: open the main pages with DevTools open; PageSpeed Insights doesn't list "Browser errors were logged to the console"
- [ ] `FE-011` **P2** Run PageSpeed Insights (Mobile and Desktop) on the main pages before launch and work through every listed item under Performance, Accessibility and Best Practices, not just the score
- [ ] `FE-012` **P2** Production stack traces are readable: source maps are uploaded to the error tracker (hidden, not served publicly); structured data (JSON-LD), if any, passes Google's Rich Results Test
