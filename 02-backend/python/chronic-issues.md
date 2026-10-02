# Python (Django / FastAPI / Flask) — chronic issues

### PY-001 · Blocking calls in async routes
**Severity:** P1
**Why it breaks:** AI uses requests/sync DB drivers inside `async def`.
**How to test:** Load test; watch latency.
**Pass:** Stable latency.
**Fix:** httpx async / run sync code in threadpool or use `def`.

### PY-002 · DEBUG=True in production
**Severity:** P0
**Why it breaks:** Django/FastAPI debug left on.
**How to test:** Trigger an error in prod.
**Pass:** No stack trace shown.
**Fix:** Env-based settings.

### PY-003 · Unvalidated input
**Severity:** P0
**Why it breaks:** Raw dicts instead of Pydantic models / forms.
**How to test:** Send wrong types and extra fields.
**Pass:** Wrong types get 422 / are rejected; extra fields are rejected (Pydantic `extra="forbid"`) or dropped, never saved.
**Fix:** Pydantic schemas, Django forms/serializers.

### PY-006 · Reset links built from an unchecked Host header
**Severity:** P0
**Why it breaks:** After the first deploy Django answers "Invalid HTTP_HOST header" (400), and AI fixes it with `ALLOWED_HOSTS = ['*']`. Without `django.contrib.sites`, Django's password reset takes the link's domain from `request.get_host()`, so a reset requested with `Host: attacker.example` mails the victim a valid token on the attacker's domain. FastAPI's `request.url_for()` / `request.base_url` and Flask's `url_for(..., _external=True)` do the same and accept any Host by default.
**How to test:** `grep -rnE "ALLOWED_HOSTS\s*=\s*\[\s*['\"]\*['\"]" --include=*.py .` (`check --deploy` doesn't flag it). Grep e-mail code for `get_host(`, `build_absolute_uri(`, `url_for(` and `base_url`. `curl -s -o /dev/null -w "%{http_code}" -H "Host: attacker.example" https://<your-domain>/`; request a password reset the same way and read the e-mail.
**Pass:** Unknown hosts get 400; every e-mailed link uses your domain.
**Fix:** Django: your real domains in `ALLOWED_HOSTS` (from env). Flask 3.1+: `TRUSTED_HOSTS`. FastAPI: `TrustedHostMiddleware(allowed_hosts=[...])`. Build e-mail links from a configured base URL, never from the request.

### PY-007 · A known secret key signs sessions and tokens
**Severity:** P0
**Why it breaks:** The key is the `startproject` value (`django-insecure-…`), Flask's tutorial `SECRET_KEY='dev'`, a literal in `SessionMiddleware(secret_key="secret")`, or a fallback like `os.environ.get("SECRET_KEY", "dev")` that silently takes over when the variable is missing in production. Flask and Starlette sessions are signed cookies anyone can read, so whoever knows the key can write any `user_id` into their own cookie and log in as that user; Django signs sessions and password-reset tokens with it.
**How to test:** `grep -rnE "django-insecure-|(SECRET_KEY|secret_key)\s*(:\s*str\s*)?=\s*['\"]|(environ\.get|getenv)\(\s*['\"][A-Z_]*(SECRET|KEY)[A-Z_]*['\"]\s*," --include=*.py .` (git history: see `UNI-001`). Start the production build without the variable; Django's `check --deploy` reports `security.W009`.
**Pass:** The key comes from `os.environ["SECRET_KEY"]` with no default, is random, was never committed, and the app refuses to start without it.
**Fix:** `SECRET_KEY = os.environ["SECRET_KEY"]`, generated with `python -c 'import secrets; print(secrets.token_hex())'`; rotate every key that was ever committed (`SECRET_KEY_FALLBACKS` keeps sessions alive during rotation). See `PY-004`, `ENV-005`.

### PY-008 · DRF: every view is public unless it says otherwise
**Severity:** P0
**Why it breaks:** DRF's default `DEFAULT_PERMISSION_CLASSES` is `AllowAny`. AI sets `permission_classes` only on the views it is working on, so the next ViewSet added to the router, or an `@api_view` function, is open to everyone; to get past a 401 or 403 it also adds `permission_classes = [AllowAny]` or `authentication_classes = []`. Django's `LoginRequiredMiddleware` doesn't help: DRF exempts its views from it.
**How to test:** Read `REST_FRAMEWORK` in settings; grep for `AllowAny`, `permission_classes = []` and `authentication_classes = []`; call every API route without credentials.
**Pass:** The default is `IsAuthenticated` or stricter; each `AllowAny` marks a deliberate public endpoint (login, signup, health).
**Fix:** `REST_FRAMEWORK = {"DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"]}`, then open public views one by one. FastAPI has no default either: put `dependencies=[Depends(get_current_user)]` on the protected `APIRouter`. See `UNI-003`.

### PY-009 · DRF: ViewSets that serve every user's rows
**Severity:** P0
**Why it breaks:** AI copies the quickstart shape, `queryset = Model.objects.all()` with `IsAuthenticated`, so any logged-in user can list, read, edit and delete every row by id. Object permissions don't close the gap: DRF never calls `has_object_permission` for lists or on create, function views and a custom `get_object()` must call `check_object_permissions` themselves, and a writable `owner` field lets a user create rows in someone else's account.
**How to test:** Grep ViewSets and generic views for `queryset = .*objects\.all()` with no `get_queryset` that filters on `self.request.user`. As user A, list the endpoint, then `GET` / `PATCH` / `DELETE` `/<resource>/<B's id>/`, and create a row with `"owner": <B's id>`.
**Pass:** A sees only A's rows; B's ids return 404; the owner is always the requester.
**Fix:** `def get_queryset(self): return Model.objects.filter(owner=self.request.user)`, `def perform_create(self, serializer): serializer.save(owner=self.request.user)`, and a read-only `owner` field. See `UNI-004`.

### PY-010 · One model for the table, the request and the response
**Severity:** P0
**Why it breaks:** AI writes `fields = "__all__"` on a DRF `ModelSerializer`, uses a SQLModel `table=True` class as both the body parameter and the return type, or saves `Model(**payload.model_dump())`. Responses then carry `password` / `hashed_password`, tokens and internal flags, and clients can set `is_staff`, `is_superuser`, `id` or another user's `owner`.
**How to test:** Grep for `"__all__"`, `exclude =`, endpoint parameters and return types that are `table=True` models, `**payload` / `**data` passed to model constructors and `setattr(obj, key, value)` loops. Send `"is_staff": true, "is_superuser": true, "role": "admin", "id": 99999` and another user's `owner` to every create and update endpoint; search every response for `password`, `token` and `secret`.
**Pass:** Extra fields change nothing; no response contains a hash or secret.
**Fix:** Separate input and output schemas: explicit `fields = [...]` and `read_only_fields` in DRF, `UserCreate` / `UserPublic` models with `response_model` in FastAPI; copy allowed fields onto the entity explicitly. See `PY-003`, `DOTNET-011`.

### PY-011 · SQL built with f-strings, filters taken from the query string
**Severity:** P0
**Why it breaks:** To get a search, sort or report working, AI writes `cursor.execute(f"... {q}")`, `Model.objects.raw(f"...")`, `.extra(where=[...])`, `session.execute(text(f"..."))` or `order_by(text(sort))`, which bypass the ORM's parameter binding. A "generic filter" `Model.objects.filter(**request.GET.dict())` lets clients filter on any field (`password__startswith=…`) and, on Django before 4.2.26 / 5.1.14 / 5.2.8, inject SQL through `_connector` (CVE-2025-64459). DRF's `OrderingFilter` without `ordering_fields` lets clients sort by any readable field.
**How to test:** `bandit -r . -t B608,B610,B611` and `grep -rnE "(execute|raw)\(\s*f['\"]|text\(\s*f['\"]|\.extra\(|RawSQL\(|filter\(\*\*request|order_by\(\s*(text\()?(request|sort)" --include=*.py .`. Send `'` and an unknown field name to every search, sort and filter parameter.
**Pass:** Values are bound parameters; filter and sort names come from an allow-list; Django is at a patched version.
**Fix:** `cursor.execute("... WHERE id = %s", [pk])`, `text("... WHERE id = :id")` with bound values, explicit mapping from allowed query keys to lookups, and `ordering_fields`. See `SEC-004`.

### PY-012 · CORS "allow all" plus credentials echoes any origin
**Severity:** P0
**Why it breaks:** Browsers refuse `Access-Control-Allow-Origin: *` with cookies, so AI finds `allow_origins=["*"]` + `allow_credentials=True` (Starlette / FastAPI), `CORS_ALLOW_ALL_ORIGINS` + `CORS_ALLOW_CREDENTIALS` (django-cors-headers) or `CORS(app, supports_credentials=True)` with default origins (Flask-CORS). All three then copy the caller's `Origin` into the response with `Access-Control-Allow-Credentials: true`, so any website can call the API as the logged-in user and read the answer.
**How to test:** `curl -s -D - -o /dev/null -H "Origin: https://example.org" -H "Cookie: x=1" https://<api>/<authenticated-endpoint>`. With `CORS_ALLOWED_ORIGIN_REGEXES`, also try `Origin: https://app.<your-domain>.example.org` (django-cors-headers uses `re.match`, so a pattern without `$` matches it).
**Pass:** No `Access-Control-Allow-Origin` header for a foreign origin.
**Fix:** Exact production origins from config (`allow_origins=[...]`, `CORS_ALLOWED_ORIGINS`, `origins=[...]`); end regexes with `$`. See `SEC-005`.

### PY-013 · Dev server or debugger in production
**Severity:** P0
**Why it breaks:** With `DEBUG = False`, Django stops serving CSS and JS, so AI turns `DEBUG` back on or starts `manage.py runserver` (even `--insecure`) from the `Procfile` or `Dockerfile`. Flask apps ship with `app.run(debug=True, host="0.0.0.0")`, `flask run --debug` or `FLASK_DEBUG=1`; the Werkzeug debugger runs any Python code from the browser, and its PIN isn't meant to fully secure it. FastAPI apps ship with `uvicorn --reload` or `fastapi dev`.
**How to test:** `grep -rniE "runserver|flask[\"', ]+run|app\.run\(|--debug|debug\s*=\s*True|FLASK_DEBUG|--reload|fastapi[\"', ]+dev|--insecure" Procfile Dockerfile* docker-compose* *.toml *.sh *.py`, and read the start command and env vars in the hosting dashboard. On production, open a missing URL and a failing page: no traceback, no "Werkzeug Debugger".
**Pass:** Production runs `gunicorn` / `uvicorn` / `fastapi run` without debug or reload, and static files load with `DEBUG = False`.
**Fix:** `gunicorn myproject.wsgi` or `fastapi run`; `python manage.py collectstatic` at build time and `STATIC_ROOT` served by WhiteNoise or the web server. See `PY-002`.

### PY-014 · Request data that runs as code
**Severity:** P0
**Why it breaks:** Each of these lets an attacker run code on the server: loading uploads or cache entries with `pickle.loads` / `pd.read_pickle`, parsing user YAML with `yaml.load(..., Loader=yaml.Loader)` or `yaml.unsafe_load`, evaluating a "formula" with `eval()`, `subprocess.run(f"convert {name} …", shell=True)` or `os.system(...)`, and rendering user-edited templates with `render_template_string()` / `Template(text)` (server-side template injection). A Celery app that accepts the `pickle` serializer is exposed to anyone who can write to the broker.
**How to test:** `bandit -r . -t B301,B307,B506,B602,B605`, plus `grep -rnE "yaml\.unsafe_load|Loader\s*=\s*yaml\.(Unsafe)?Loader\b|render_template_string\(|from_string\(|\bTemplate\(|\bexec\(|serializer.*pickle|accept_content" --include=*.py .` (Bandit misses these). Put `{{7*7}}` into every field that appears in a page or e-mail.
**Pass:** No hit receives request or upload data; pages show `{{7*7}}`, not `49`.
**Fix:** `json`, `yaml.safe_load` or `ast.literal_eval`; `subprocess.run([...])` with a list and no shell; user text passed into a fixed template as a variable (or Jinja's `SandboxedEnvironment`); Celery `accept_content = ["json"]`.

### PY-015 · HTML escaping switched off
**Severity:** P0
**Why it breaks:** To show a bio, comment or Markdown "as HTML", AI adds `|safe` or `{% autoescape off %}` in a template, `mark_safe(text)`, `Markup(f"…")` or `format_html(f"…")` (which escapes nothing). Outside templates it builds HTML with f-strings (`HTMLResponse(f"<p>{q}</p>")`, `return f"<h1>{name}</h1>"` in Flask) or makes its own `jinja2.Environment()` for e-mails, which has autoescape off by default. Stored text then runs as script in visitors' browsers.
**How to test:** `bandit -r . -t B308,B701,B703,B704` and `grep -rnE "\|\s*safe\b|autoescape off|mark_safe\(|Markup\(|format_html\(\s*f['\"]|HTMLResponse\(\s*f['\"]|return\s+f['\"]<|Environment\(" --include=*.py --include=*.html .`. Save `<img src=x onerror=alert(1)>` in every text field and open each page and e-mail that shows it.
**Pass:** The payload shows as text everywhere.
**Fix:** Keep autoescaping on; `format_html("<b>{}</b>", name)`; sanitize rich text with `nh3` before marking it safe; `Environment(autoescape=select_autoescape())`. See `LLM-005`.

### PY-016 · Client file names used as paths
**Severity:** P0
**Why it breaks:** AI saves uploads with `open(os.path.join(UPLOAD_DIR, file.filename), "wb")`. Flask's `FileStorage.filename` and FastAPI's `UploadFile.filename` pass the client's name through unchanged, so `../../app/main.py` lands outside the folder, and an absolute name like `/etc/cron.d/job` makes `os.path.join` (and pathlib's `/`) drop `UPLOAD_DIR` entirely. Downloads built with `send_file(path)` or `FileResponse(os.path.join(BASE, name))` can read any file, and `tarfile.extractall()` on an upload writes outside the target unless a `filter=` is passed.
**How to test:** `bandit -r . -t B202` and `grep -rnE "\.filename|send_file\(|FileResponse\(|extractall\(" --include=*.py .`. Upload with `curl -F "file=@a.txt;filename=../../x.txt"` and `filename=/tmp/x.txt`; request downloads with `../../etc/passwd` and `..%2F..%2Fetc%2Fpasswd`.
**Pass:** Files are stored under server-generated names inside the upload folder; traversal attempts get 400 or 404.
**Fix:** Store files as `uuid4().hex` (keep the original name in the database) or use `werkzeug.utils.secure_filename()`; serve with `send_from_directory()` or check `Path(p).resolve().is_relative_to(BASE)`; `extractall(filter="data")`. See `SEC-008`.

### PY-017 · Django / DRF: passwords saved as plain text
**Severity:** P0
**Why it breaks:** AI creates users with `User.objects.create(username=..., password=...)`, sets `user.password = request.data["password"]`, or relies on `ModelSerializer`'s default `create()` / `update()`, which pass the value straight to the model. The password is stored exactly as typed; `authenticate()` then fails for the new account, and the next "fix" compares passwords by hand.
**How to test:** `grep -rnE "objects\.create\(.*password|\.password\s*=|User\(.*password=" --include=*.py .` and check every serializer with a `password` field for `set_password` / `create_user`. Sign up through the API, log in with the same password, and look at the stored value.
**Pass:** Stored values start with a hasher prefix (`pbkdf2_sha256$`, `argon2$`, `bcrypt`), and signup followed by login works.
**Fix:** `User.objects.create_user(...)`, or `user.set_password(raw)` before `save()`; in DRF override `create()` / `update()` and make `password` `write_only`. See `SEC-002`.

### PY-018 · SQLAlchemy sessions shared or never closed
**Severity:** P0
**Why it breaks:** AI opens `db = SessionLocal()` at module level and shares it across requests and threads, writes `def get_db(): return SessionLocal()` with no `close()`, or keeps a session open while waiting on an LLM or payment API. The pool (5 + 10 overflow by default) runs dry: requests hang for 30 s and fail with "QueuePool limit of size 5 overflow 10 reached", or a shared session mixes different users' transactions.
**How to test:** `grep -rnE "^\s*(db|session)\s*=\s*(SessionLocal|Session)\(|return\s+SessionLocal\(\)" --include=*.py .` and read every `get_db`. Load test 50 concurrent users for 5 minutes, including an endpoint that calls an external API; watch the logs and `SELECT count(*) FROM pg_stat_activity;`.
**Pass:** One session per request, closed by a `yield` dependency or `with`; no pool timeouts under load.
**Fix:** `def get_db(): with SessionLocal() as db: yield db`; commit before slow external calls; keep `(pool_size + max_overflow) × workers` below the database's `max_connections`; `async_sessionmaker(engine, expire_on_commit=False)` for `AsyncSession`. See `JAVA-002`.

### PY-019 · Code written for an older major version, installed unpinned
**Severity:** P1
**Why it breaks:** AI writes the APIs it saw most in training: Pydantic v1 on v2 (`from pydantic import BaseSettings` and `Field(regex=...)` crash at import, `orm_mode` / `from_orm()` fail), SQLAlchemy 1.x on 2.x (`engine.execute()`, `session.execute("SELECT …")`), the old FastAPI tutorial's passlib `CryptContext(schemes=["bcrypt"])` (with bcrypt 5.0, every `hash()` and `verify()` raises "password cannot be longer than 72 bytes", even for short passwords), and `datetime.utcnow()`. With unpinned requirements, the next clean build pulls the new major and startup or login breaks.
**How to test:** `grep -rnE "from pydantic import .*BaseSettings|\bregex\s*=|orm_mode|[a-z_]\.dict\(\)|parse_obj\(|@validator|engine\.execute\(|(session|db|conn)\.execute\(\s*['\"]|CryptContext\(|passlib|utcnow\(" --include=*.py .` (ignore `request.GET.dict()`). Install into a clean environment from the lock file only, run the tests with deprecation warnings as errors, and run `pip-audit`.
**Pass:** Every dependency is pinned in a lock file; a clean install starts, signs up and logs in; no deprecation warnings; `pip-audit` is clean.
**Fix:** Pydantic v2 APIs (`model_dump`, `model_validate`, `ConfigDict(from_attributes=True)`, `field_validator`, `pydantic-settings`), `conn.execute(text(...))`, `pwdlib[argon2]` (with its bcrypt hasher for existing hashes), `datetime.now(UTC)`; pin with `uv.lock`, `poetry.lock` or `pip-compile --generate-hashes`. See `UNI-009`, `SEC-010`.

### PY-020 · Proxy headers ignored, or trusted from anyone
**Severity:** P1
**Why it breaks:** Behind nginx or a platform load balancer, the app sees the proxy's IP and plain `http`. Django 4.0+ rejects every form with "CSRF verification failed … Origin checking failed", and AI answers with `@csrf_exempt` or removes `CsrfViewMiddleware`; `SECURE_SSL_REDIRECT` loops; rate limits key on the proxy IP, so one user locks out everyone. The opposite "fix" trusts any `X-Forwarded-For`: DRF throttling with `NUM_PROXIES` unset, code that reads `HTTP_X_FORWARDED_FOR.split(",")[0]`, or Uvicorn / Gunicorn with `--forwarded-allow-ips="*"` while the app port is also public.
**How to test:** Log in to `/admin/` and submit a form on production over HTTPS. Grep for `csrf_exempt`, `CsrfViewMiddleware`, `SECURE_PROXY_SSL_HEADER`, `CSRF_TRUSTED_ORIGINS`, `NUM_PROXIES`, `forwarded.allow.ips`, `ProxyFix(` and `X_FORWARDED_FOR`. Send 20 wrong passwords to each login with a new fake `X-Forwarded-For` each time.
**Pass:** Forms work with CSRF on; the limit triggers despite fake headers; logs show the real client IP.
**Fix:** Django: `SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")` (only if the proxy overwrites that header) and `CSRF_TRUSTED_ORIGINS = ["https://your.domain"]` (with the scheme). DRF: `NUM_PROXIES` and a shared throttle cache. Uvicorn / Gunicorn: `--forwarded-allow-ips` set to the proxy's address. Flask: `ProxyFix(app.wsgi_app, x_for=1, x_proto=1)`. See `SEC-007`.

### PY-021 · Background work that silently disappears
**Severity:** P1
**Why it breaks:** To answer fast, AI fires `asyncio.create_task(send_email(...))` and drops the result; the event loop keeps only a weak reference, so the task can be garbage-collected mid-way and its exception is never seen. FastAPI `BackgroundTasks` and threads die with the process on every deploy. A Celery `task.delay(obj.pk)` inside `transaction.atomic` (or with `ATOMIC_REQUESTS`) can run before the commit, so the worker gets `DoesNotExist` for a row that exists a moment later.
**How to test:** `ruff check --select RUF006 .`; grep `create_task(`, `ensure_future(`, `add_task(`, `threading.Thread(`, `.delay(` and `.apply_async(`, and check each `.delay` that reads a row written in the same request. Trigger an e-mail and restart the app straight away.
**Pass:** Every task is awaited or kept in a set; must-run work goes through a queue; Celery tasks are sent after commit.
**Fix:** Keep task references (`tasks.add(t); t.add_done_callback(tasks.discard)`) or use `asyncio.TaskGroup`; move must-run work to a queue; `transaction.on_commit(lambda: task.delay(pk))` (or `delay_on_commit`). See `OPS-007`.
