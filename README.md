# SPADE

SPADE (SPARQL Analysis and Data Explorer) is a web application for querying,
analysing, and visualising RDF data. It uses a FastAPI API, PostgreSQL-backed
accounts and persistence, and a React 18 single-page application built with
Vite.

## Stack

- Python 3.13, FastAPI, SQLAlchemy 2.0, Alembic, psycopg 3, RDFLib, and pytest
- PostgreSQL for users, sessions, workspaces, repositories, saved queries, and
  geographic fallback data
- Argon2 password hashing and revocable database-backed browser sessions
- React 18, TypeScript, Vite, pnpm, Vitest, MobX, and Ant Design

An account is required for a persistent workspace. Browser sessions use secure,
HTTP-only cookies and CSRF protection. The public API is versioned under
`/api/v1`; interactive OpenAPI documentation is available at `/docs`.

Visitors can use the read-only Mondial trial at `/try` without an account. The
trial is fixed to a public Mondial SPARQL endpoint, accepts only `SELECT` and
`ASK`, and bounds query length, result size, and request rate.

## Development

Prerequisites are Python 3.13, uv, PostgreSQL, Node.js 22.12 or newer, and pnpm
12.4.1.

```bash
uv sync --locked
cp .env.example .env
uv run alembic upgrade head
uv run python -m backend.seed
uv run uvicorn app:app --reload --port 5000
```

The seed command creates an idempotent local test account, its workspace, and a
Mondial remote repository. It refuses to run when `BUILD=production`; optional
`--email` and `--password` arguments can override the development defaults.

In another terminal:

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm dev
```

The frontend runs at `http://localhost:5173` and proxies `/api` to the FastAPI
server at `http://localhost:5000`.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `BUILD` | `development` | Enables production cookies and built-frontend serving when set to `production`. |
| `DATABASE_URL` | local PostgreSQL | SQLAlchemy psycopg connection URL. |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Exact comma-separated credentialed CORS origins. |
| `SESSION_DAYS` | `7` | Fixed browser-session lifetime. |
| `MAX_UPLOAD_BYTES` | `33554432` | Combined RDF data and schema upload limit. |
| `VITE_API_URL` | empty | Optional API origin for split-origin deployments; local and production defaults are same-origin. |

## Quality checks

```bash
uv run ruff format --check backend app.py alembic
uv run ruff check backend app.py alembic
uv run pytest --cov=backend --cov-report=term-missing
```

```bash
cd frontend
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Legacy MongoDB migration

The application has no MongoDB runtime dependency. To import trusted data from
the previous deployment, install the migration dependency group and configure
both `MONGODB_URL` and `DATABASE_URL`:

```bash
uv sync --group migration
uv run --group migration python -m backend.migrate_mongodb --dry-run
uv run --group migration python -m backend.migrate_mongodb
```

The importer never writes to MongoDB and is safe to rerun. Legacy local graphs
are Python pickles, so only migrate a database you control. Anonymous workspace
IDs are retained and claimed when their browser creates an account.

## Production

Build `frontend/dist`, apply migrations, and run the ASGI application:

```bash
cd frontend && pnpm install --frozen-lockfile && pnpm build
cd ..
uv run alembic upgrade head
BUILD=production uv run uvicorn app:app --host 0.0.0.0 --port 8000
```

Use HTTPS in production so authentication cookies are transmitted. Snapshot and
stop writes to the legacy MongoDB deployment before running the one-time import.
