# Python (Django / FastAPI / Flask) — AI audit prompts

Paste into Claude Code, Cursor or any agent:

```
Audit this Python (Django / FastAPI / Flask) project for production readiness.
Check: DEBUG, runserver / flask --debug / uvicorn --reload in production, ALLOWED_HOSTS ['*'] and
links built from the Host header, secret keys with defaults, DRF default AllowAny, ViewSets with
objects.all(), fields = "__all__" and one model for table/request/response, raw SQL with f-strings
and filter(**request.GET), CORS "*" with credentials, pickle / yaml.load / eval / shell=True /
render_template_string, |safe and mark_safe, upload file names in paths, passwords saved without
set_password, JWTs decoded without verification, SQLAlchemy sessions not closed, Pydantic v1 /
SQLAlchemy 1.x / passlib on new majors, unpinned dependencies, proxy headers and csrf_exempt,
dropped asyncio tasks and Celery before commit, requests without timeout, str(e) in responses,
missing migrations, worker count and timeout, public /docs.
Output a table: severity (P0/P1/P2), file:line, issue, fix.
Do not change code until I approve.
```
