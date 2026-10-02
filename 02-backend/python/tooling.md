# Python (Django / FastAPI / Flask) — tooling

| Purpose | Tool |
|---|---|
| Unit | pytest |
| API | httpx / FastAPI `TestClient`, Django test client |
| Load | Locust or k6 (pool exhaustion, worker timeouts) |
| Security scan | Bandit (`bandit -r . -ll`); Ruff `S` rules and `RUF006` (dropped asyncio tasks) |
| Dependencies | pip-audit; lock files with uv, Poetry or `pip-compile --generate-hashes` |
| Django checks | `check --deploy --fail-level WARNING`, `makemigrations --check --dry-run`, `migrate --check` |
| SQLAlchemy | `alembic check`; `lazy="raise"` in tests |
| Query counts | Django `assertNumQueries` |
| Headers | curl with spoofed `Host`, `Origin` and `X-Forwarded-For` |
