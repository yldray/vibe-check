# Java Spring — chronic issues

> 🌱 Seeded list. Contributions welcome.

### JAVA-001 · LazyInitializationException
**Severity:** P1
**Why it breaks:** Lazy relations accessed after the transaction.
**How to test:** Call endpoints that return related data.
**Pass:** No exception, no N+1.
**Fix:** Fetch joins, DTO projections.

### JAVA-002 · Connection pool exhaustion
**Severity:** P0
**Why it breaks:** Long transactions or unclosed resources.
**How to test:** Load test; watch HikariCP metrics.
**Pass:** Pool never saturated.
**Fix:** Short transactions, timeouts, try-with-resources.

### JAVA-003 · Actuator endpoints exposed
**Severity:** P0
**Why it breaks:** All actuator endpoints public.
**How to test:** Call /actuator/env and /actuator/heapdump.
**Pass:** Not reachable publicly.
**Fix:** Expose only health; secure the rest.
