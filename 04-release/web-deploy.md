# Web deploy checklist

## P0
- [ ] `WEB-001` HTTPS with auto-renewing certificate; HTTP redirects to HTTPS
- [ ] `WEB-002` Production env vars set; debug off
- [ ] `WEB-003` DB backups scheduled and a restore tested
- [ ] `WEB-004` Error tracking connected
- [ ] `WEB-005` Privacy policy + terms live

## P1
- [ ] `WEB-006` Uptime monitoring and alerts
- [ ] `WEB-007` Security headers verified (securityheaders.com)
- [ ] `WEB-008` CDN / caching for static assets
- [ ] `WEB-009` SPA fallback / redirects configured
- [ ] `WEB-010` Rollback plan tested once
- [ ] `WEB-011` Custom 404 / 500 pages
- [ ] `WEB-014` Redirect and rewrite rules don't match API routes (a `/news` rule must not catch `/api/news`); `/api/*` is curled after adding one

## P2
- [ ] `WEB-012` Sitemap, robots.txt, OG images
- [ ] `WEB-013` Analytics on the main funnel
