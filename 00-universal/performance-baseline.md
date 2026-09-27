# Performance baseline

- [ ] `PERF-001` **P1** API p95 response under 500 ms for main endpoints
- [ ] `PERF-002` **P1** DB indexes on foreign keys and filtered / sorted columns
- [ ] `PERF-003` **P1** No N+1 queries on list pages
- [ ] `PERF-004` **P1** Images compressed and sized; lazy loaded below the fold
- [ ] `PERF-005` **P1** Load test at 10x expected traffic on the main flow (e.g. login → list → main action) with k6, JMeter or Artillery: ramp up over a few minutes, hold for 10. Pass: p95 stays within `PERF-001`, errors under 1%, memory doesn't keep climbing
- [ ] `PERF-006` **P2** Caching for read-heavy data
- [ ] `PERF-007` **P2** Bundle size reviewed
- [ ] `PERF-008` **P1** Core Web Vitals are "good" at the 75th percentile: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 (PageSpeed Insights or the `web-vitals` library on real users)
- [ ] `PERF-009` **P1** The slow query log is on, and the slowest queries were checked with `EXPLAIN`: no full table scans on large tables
- [ ] `PERF-010` **P1** Serverless or edge functions reach the database through a connection pooler, so traffic spikes don't hit "too many connections"
- [ ] `PERF-011` **P1** Static assets have hashed file names and long cache headers (`Cache-Control: public, max-age=31536000, immutable`); HTML is not cached for long
- [ ] `PERF-012` **P1** Text responses (HTML, JS, CSS, JSON) are compressed with gzip or Brotli
- [ ] `PERF-013` **P2** A 30-minute soak test shows flat memory and stable response times
- [ ] `PERF-014` **P2** A performance budget runs in CI (bundle size limit or Lighthouse CI) and fails the build when it's exceeded
- [ ] `PERF-015` **P2** Fonts don't block rendering (`font-display: swap`, preloaded) and third-party scripts load with `defer` or `async`
