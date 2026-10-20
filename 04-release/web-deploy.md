# Web deploy checklist

## P0
- [ ] `WEB-001` HTTPS with auto-renewing certificate; HTTP redirects to HTTPS. Prove the renewal once instead of assuming it: force one renewal (`certbot renew --force-renewal`, `wacs --renew --force`), rerun the setup or deploy script, then check what is served: `echo | openssl s_client -connect <host>:443 -servername <host> 2>/dev/null | openssl x509 -noout -issuer -enddate` shows the real CA and the new date on every hostname. A script that binds certificates itself must not fight the renewal tool or fall back to a self-signed certificate (see `WIN-003`)
- [ ] `WEB-002` Production env vars set; debug off
- [ ] `WEB-003` DB backups scheduled and a restore tested
- [ ] `WEB-004` Error tracking connected
- [ ] `WEB-005` Privacy policy + terms live
- [ ] `WEB-015` The web root holds only public files, never the project folder (watch for `express.static(__dirname)`, an nginx or Apache root at the repo, an FTP or rsync upload of everything). None of these is served: `/.git/HEAD`, `/.env`, `/package.json`, `/server.js`, `/.vscode/sftp.json`, `/node_modules/.package-lock.json`, `/backup.zip`, `/db.sql`, and folders like `/uploads/` show no file list. Read the body: an SPA fallback answers 200 with `index.html`. Test: `curl -s https://<site>/.git/HEAD` must not print `ref:`; repeat for each path
- [ ] `WEB-016` Responses that depend on the logged-in user (account pages, carts, `/api/me`) are never stored by a CDN or proxy: they send `Cache-Control: private` or `no-store`, and no "cache everything" or edge-TTL rule covers them. Test: `curl -sI -H "Cookie: <session>" https://<site>/api/me` shows `private` or `no-store`; fetched as two users through the CDN, the cache status (`CF-Cache-Status`, `Age`) is never a hit (see `REACT-020`)

## P1
- [ ] `WEB-006` Uptime monitoring and alerts
- [ ] `WEB-007` Security headers verified (securityheaders.com)
- [ ] `WEB-008` CDN / caching for static assets
- [ ] `WEB-009` SPA fallback / redirects configured
- [ ] `WEB-010` Rollback plan tested once
- [ ] `WEB-011` Custom 404 / 500 pages, and a missing page still answers 404: a server that runs the error page as a normal request, or an SPA fallback, answers 200, so crawlers index broken links and smoke tests pass (an SPA's not-found view at least sets `noindex`). Test: `curl -s -o /dev/null -w '%{http_code}' https://<site>/no-such-page` prints 404, and the post-deploy check fails on 200 instead of warning. IIS: see `WIN-001`
- [ ] `WEB-014` Redirect and rewrite rules don't match API routes (a `/news` rule must not catch `/api/news`); `/api/*` is curled after adding one
- [ ] `WEB-017` Other sites can't frame your pages: every HTML response sends `Content-Security-Policy: frame-ancestors 'self'` (or `'none'`) as an HTTP header, plus `X-Frame-Options: SAMEORIGIN` for old browsers. Browsers ignore both in a `<meta>` tag, so a static site needs a host that can set headers. Test: `curl -sI https://<site>/login | grep -iE "frame-ancestors|x-frame-options"` (see `SEC-006`)
- [ ] `WEB-018` The bare domain and `www` both open over HTTPS with a valid certificate that names both, and one answers with a 301 to the other. Test: `curl -sI https://example.com` and `curl -sI https://www.example.com`: no certificate error, one 301 to the canonical host (see `WEB-001`). Redirect only GET and HEAD page requests and leave out `/api` and payment or webhook callbacks: callbacks registered on the other host usually don't follow redirects, and a 301 can turn a POST into a GET. Until the redirect is live, log in on both hosts: a cookie scoped to one host is invisible on the other, so a user who arrived on `www` logs in and still looks logged out

## P2
- [ ] `WEB-012` Sitemap, robots.txt and OG images served from the production domain → `FE-019` `FE-021`
- [ ] `WEB-013` Analytics on the main funnel
