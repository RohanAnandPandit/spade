# SPADE

SPADE (SPARQL Analysis and Data Explorer) is a web application for querying,
analysing, and visualising RDF data. The current foundation uses a Flask API
and a React 18 single-page application built with Vite.

## Current stack

- Python 3.13, Flask, RDFLib, uv, pytest, and Ruff
- React 18, TypeScript, Vite, pnpm, Vitest, and Testing Library
- MongoDB-backed saved repositories and query history (transitional)
- Local RDF files and remote SPARQL endpoints

SPADE has no login or authentication layer. It generates an anonymous workspace
ID in browser storage and uses it to keep repositories and query history
separate. Clearing browser storage creates a new workspace and makes the old
workspace inaccessible from that browser. Do not expose this transitional
version directly to the public internet; server-managed workspace sessions
belong in the versioned PostgreSQL API.

MongoDB is not needed to install the project, import the backend, run tests, or
build the frontend. Repository and saved-query endpoints currently need a
MongoDB connection; this storage layer will be replaced by PostgreSQL in a
separate modernization branch. No S3 or provider-specific deployment service is
required.

## Prerequisites

- Python 3.13
- [uv](https://docs.astral.sh/uv/)
- Node.js 22.12 or newer
- pnpm 12.4.1 (the version is pinned in `frontend/package.json`)
- MongoDB only when exercising persistence endpoints

## Development setup

Install the locked backend dependencies from the repository root:

```bash
uv sync --locked
```

Install the locked frontend dependencies:

```bash
cd frontend
pnpm install --frozen-lockfile
```

Copy the example environment files if you need to customise the defaults:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

Start the API from the repository root:

```bash
uv run flask --app app run --debug --port 5000
```

In another terminal, start Vite:

```bash
cd frontend
pnpm dev
```

The frontend runs at `http://localhost:5173` and calls the API at
`http://localhost:5000` by default.

In VS Code, run the `SPADE: Start App` task to start both development servers in
parallel. The `SPADE: Backend` and `SPADE: Frontend` tasks are also available
when only one service is needed.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `BUILD` | `development` | Set to `production` to serve `frontend/dist` from Flask. |
| `MONGODB_URL` | unset | Transitional MongoDB connection string for repository and query persistence. |
| `UPLOAD_FOLDER` | `imports` | Local directory used by the upload endpoint. |
| `VITE_API_URL` | `http://localhost:5000` | Frontend API origin; set in `frontend/.env`. |

If `MONGODB_URL` is unset, persistence endpoints return a controlled `503`
response instead of preventing the application from starting.

## Quality checks

Run the backend checks from the repository root:

```bash
uv run ruff format --check backend app.py
uv run ruff check backend app.py
uv run pytest --cov=backend --cov-report=term-missing
```

Run the frontend checks from `frontend/`:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

GitHub Actions runs these checks and audits production dependencies on pull
requests and pushes to `main`.

## Production build

Build the frontend:

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm build
```

Then run Flask with any WSGI-compatible host:

```bash
BUILD=production uv run gunicorn app:app
```

Flask serves the generated `frontend/dist` directory, including client-side
routes. Deployment configuration is intentionally provider-neutral.

## Repository layout

```text
.
├── app.py                  # Flask application and API routes
├── backend/                # Analysis, repositories, persistence, and tests
├── frontend/               # React, TypeScript, Vite, and frontend tests
├── pyproject.toml          # Direct Python dependencies and tool settings
├── uv.lock                 # Locked Python dependency graph
└── .github/workflows/ci.yml
```

## Modernization roadmap

This foundation deliberately keeps the existing Flask API, MongoDB persistence,
MobX stores, and chart catalogue to keep the first migration reviewable. Planned
follow-up branches are:

1. `codex/postgres-fastapi`: PostgreSQL, SQLAlchemy, Alembic, FastAPI, and a
   versioned API that works with local PostgreSQL, Neon, or Supabase.
2. `codex/frontend-architecture`: React 19, generated API contracts, TanStack
   Query, Zustand, and an accessibility-focused interface refresh.
3. `codex/visualization-consolidation`: typed chart transformations and a
   smaller set of maintained visualisation libraries.
4. `codex/security-and-deployment`: SSRF protection, quotas, rate limits,
   cleanup policies, provider-neutral containers, and end-to-end tests.
