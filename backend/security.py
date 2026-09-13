import hashlib
import hmac
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from fastapi import Cookie, Depends, Header, HTTPException, Request, Response, status
from pwdlib import PasswordHash
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session, joinedload

from backend.config import Settings
from backend.database import get_db
from backend.models import AuthSession, LoginAttempt, User, Workspace

SESSION_COOKIE = "spade_session"
CSRF_COOKIE = "spade_csrf"
password_hash = PasswordHash.recommended()
DUMMY_HASH = password_hash.hash("not-a-real-spade-password")


def digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def utcnow() -> datetime:
    return datetime.now(UTC)


def client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def validate_origin(request: Request, settings: Settings) -> None:
    origin = request.headers.get("origin")
    if origin is not None and origin not in settings.allowed_origins:
        raise HTTPException(status_code=403, detail="Request origin is not allowed")


def is_rate_limited(db: Session, email: str, ip: str) -> bool:
    cutoff = utcnow() - timedelta(minutes=15)
    count = db.scalar(
        select(func.count(LoginAttempt.id)).where(
            LoginAttempt.email == email,
            LoginAttempt.ip == ip,
            LoginAttempt.created_at >= cutoff,
        )
    )
    return bool(count and count >= 5)


def record_failed_login(db: Session, email: str, ip: str) -> None:
    db.add(LoginAttempt(email=email, ip=ip))
    db.commit()


def clear_failed_logins(db: Session, email: str, ip: str) -> None:
    db.execute(
        delete(LoginAttempt).where(LoginAttempt.email == email, LoginAttempt.ip == ip)
    )
    db.commit()


def issue_session(
    response: Response, db: Session, user: User, settings: Settings
) -> None:
    token = secrets.token_urlsafe(32)
    csrf = secrets.token_urlsafe(32)
    max_age = settings.session_days * 24 * 60 * 60
    db.add(
        AuthSession(
            token_digest=digest(token),
            csrf_digest=digest(csrf),
            user_id=user.id,
            expires_at=utcnow() + timedelta(days=settings.session_days),
        )
    )
    db.commit()
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=max_age,
        httponly=True,
        secure=settings.secure_cookies,
        samesite="lax",
        path="/",
    )
    response.set_cookie(
        CSRF_COOKIE,
        csrf,
        max_age=max_age,
        httponly=False,
        secure=settings.secure_cookies,
        samesite="lax",
        path="/",
    )


def clear_session_cookies(response: Response, settings: Settings) -> None:
    for name in (SESSION_COOKIE, CSRF_COOKIE):
        response.delete_cookie(
            name,
            path="/",
            secure=settings.secure_cookies,
            httponly=name == SESSION_COOKIE,
        )


@dataclass
class AuthContext:
    user: User
    workspace: Workspace
    session: AuthSession


def current_auth(
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
    db: Session = Depends(get_db),
) -> AuthContext:
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )
    auth_session = db.scalar(
        select(AuthSession)
        .options(joinedload(AuthSession.user).joinedload(User.workspace))
        .where(AuthSession.token_digest == digest(session_token))
    )
    expires_at = auth_session.expires_at if auth_session is not None else None
    if expires_at is not None and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    if auth_session is None or expires_at <= utcnow():
        if auth_session is not None:
            db.delete(auth_session)
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )
    if auth_session.user.disabled or auth_session.user.workspace is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )
    return AuthContext(auth_session.user, auth_session.user.workspace, auth_session)


def require_csrf(
    auth: AuthContext = Depends(current_auth),
    csrf_cookie: str | None = Cookie(default=None, alias=CSRF_COOKIE),
    csrf_header: str | None = Header(default=None, alias="X-CSRF-Token"),
) -> AuthContext:
    if (
        not csrf_cookie
        or not csrf_header
        or not hmac.compare_digest(csrf_cookie, csrf_header)
        or not hmac.compare_digest(digest(csrf_cookie), auth.session.csrf_digest)
    ):
        raise HTTPException(status_code=403, detail="Invalid CSRF token")
    return auth
