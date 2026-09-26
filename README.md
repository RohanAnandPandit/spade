# SPADE

SPADE (SPARQL Analysis and Data Explorer) is a web application for querying,
analysing, and visualising RDF data. It uses a FastAPI API, PostgreSQL-backed
accounts and persistence, and a React 18 single-page application built with
Vite.

## Source code

© 2026 Rohan Anand Pandit. All rights reserved. This repository is publicly
available for viewing. Except for rights provided by GitHub's Terms of Service
or applicable law, permission to use, modify, distribute, or deploy this code
requires prior written consent.

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
| `BUILD` | `development` | Enables secure production cookies when set to `production`. |
| `DATABASE_URL` | local PostgreSQL | SQLAlchemy psycopg connection URL. |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Exact comma-separated credentialed CORS origins. |
| `SESSION_DAYS` | `7` | Fixed browser-session lifetime. |
| `MAX_UPLOAD_BYTES` | `33554432` | Combined RDF data and schema upload limit. |
| `VITE_API_URL` | empty | API origin for the independently deployed frontend; leave empty when a development or Render rewrite proxies `/api` on the frontend origin. |

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

## Branches and Render deployment

`main` is the integration branch. Merge feature pull requests into `main`,
promote `main` to `staging`, test the staging deployment, then promote `staging`
to `production`. Keep `production` behind or equal to `staging`, and `staging`
behind or equal to `main`. Use fast-forward promotions so the deployed commit
is exactly the commit already tested. The old `develop` branch is retired once
its changes are incorporated into `main`; target new pull requests at `main`.

Render uses two independent Blueprints in this repository:

| Environment | Blueprint path | Git branch | Frontend | API |
| --- | --- | --- | --- | --- |
| Staging | `infra/render-staging.yaml` | `staging` | Render's `spade-frontend-staging.onrender.com` domain | Render's `spade-api-staging.onrender.com` domain |
| Production | `infra/render-production.yaml` | `production` | `spade.rohanpandit.com` | `api.spade.rohanpandit.com` |

Create or update each Render Blueprint with its listed path and branch. The
production Blueprint keeps the existing `spade-api` and `spade-frontend`
service names in the `SPADE` project's `Production` environment. Point the
existing production Blueprint at `infra/render-production.yaml` before removing
its old root `render.yaml` path. The staging Blueprint creates distinct
services and environment groups in the `Staging` environment. Never attach the
same Render resource to both Blueprints.

Set a **different** Neon PostgreSQL `DATABASE_URL` secret on each API service.
Render prompts for it when creating a Blueprint; for an existing Blueprint,
set or verify it directly on the service because `sync: false` values are not
updated by later Blueprint syncs. Keep database credentials out of Git.
Configure DNS for both production custom domains using the records Render
displays for those services, then wait for Render to verify the domains and
issue certificates before promoting production traffic.

The frontend rewrites `/api/*` to its environment's API before the SPA
fallback. This keeps browser requests and authentication cookies on the same
frontend origin. `VITE_API_URL` is deliberately empty in both builds. The
staging rewrite assumes Render assigns
`https://spade-api-staging.onrender.com`; check the actual service URL after
creation and update the rewrite if Render adds a name suffix.

To promote after tests and a deployment smoke check:

```bash
git fetch origin
git switch staging
git merge --ff-only origin/main
git push origin staging
# Verify the staging frontend, login, a write action, and API health.
git switch production
git merge --ff-only origin/staging
git push origin production
```

The API is a free Python web service and the frontend is a free static site.
The API applies migrations each time its free instance starts. Render uses
separate backend and frontend environment groups for each environment.

The API applies migrations each time its free instance starts, then runs:

```bash
uv run alembic upgrade head
BUILD=production uv run uvicorn app:app --host 0.0.0.0 --port 8000
```

Set `ALLOWED_ORIGINS` to the frontend's exact HTTPS origin. To build the
frontend for a different static host, set its public API origin explicitly:

```bash
cd frontend
pnpm install --frozen-lockfile
VITE_API_URL=https://api.example.com pnpm build
```

FastAPI serves only the API and its generated documentation; it does not serve
the frontend build or provide a client-side routing fallback. Use HTTPS in
production so authentication cookies are transmitted. Snapshot and stop writes
to the legacy MongoDB deployment before running the one-time import.

Render's free web service sleeps when idle. Database persistence and limits are
managed separately by the selected Neon plan.
