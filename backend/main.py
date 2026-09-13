from contextlib import asynccontextmanager
from pathlib import Path

import requests
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from backend.api import router
from backend.config import get_settings
from backend.database import get_db
from backend.repository import RemoteRepositoryError

settings = get_settings()
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"


@asynccontextmanager
async def lifespan(application: FastAPI):
    dependency = application.dependency_overrides.get(get_db, get_db)
    sessions = dependency()
    session = next(sessions)
    try:
        session.execute(text("SELECT 1"))
    except SQLAlchemyError as error:
        raise RuntimeError("SPADE could not connect to PostgreSQL") from error
    finally:
        sessions.close()
    yield


app = FastAPI(title="SPADE API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-CSRF-Token"],
)
app.include_router(router)


@app.exception_handler(HTTPException)
async def http_error(request: Request, error: HTTPException):
    del request
    return JSONResponse(
        status_code=error.status_code,
        content={"error": str(error.detail)},
        headers=error.headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, error: RequestValidationError):
    del request
    fields = {
        ".".join(
            str(part) for part in item["loc"] if part not in {"body", "query"}
        ): item["msg"]
        for item in error.errors()
    }
    return JSONResponse(
        status_code=422,
        content={"error": "Request validation failed", "fields": fields},
    )


@app.exception_handler(ValueError)
async def value_error(request: Request, error: ValueError):
    del request
    return JSONResponse(status_code=400, content={"error": str(error)})


@app.exception_handler(requests.Timeout)
async def timeout_error(request: Request, error: requests.Timeout):
    del request, error
    return JSONResponse(
        status_code=504, content={"error": "The upstream service timed out"}
    )


@app.exception_handler(RemoteRepositoryError)
@app.exception_handler(requests.RequestException)
async def upstream_error(request: Request, error: Exception):
    del request
    return JSONResponse(
        status_code=502, content={"error": str(error) or "An upstream service failed"}
    )


@app.exception_handler(SQLAlchemyError)
async def database_error(request: Request, error: SQLAlchemyError):
    del request, error
    return JSONResponse(
        status_code=503, content={"error": "Database service is unavailable"}
    )


@app.get("/{path:path}", include_in_schema=False)
def serve_frontend(path: str):
    if settings.build != "production":
        return {"service": "SPADE API", "frontend": "Run pnpm dev on port 5173"}
    frontend_root = FRONTEND_DIST.resolve()
    target = (frontend_root / path).resolve()
    if path and target.is_relative_to(frontend_root) and target.is_file():
        return FileResponse(target)
    return FileResponse(frontend_root / "index.html")
