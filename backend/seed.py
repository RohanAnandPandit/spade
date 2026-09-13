import argparse

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.config import get_settings
from backend.database import get_session_factory
from backend.demo import MONDIAL_DESCRIPTION, MONDIAL_ENDPOINT, MONDIAL_NAME
from backend.models import RepositoryRecord, User, Workspace, utcnow
from backend.schemas import RegisterRequest
from backend.security import password_hash

DEFAULT_EMAIL = "tester@example.com"
DEFAULT_PASSWORD = "SpadeTest123!"


def seed_initial_user(
    db: Session,
    email: str = DEFAULT_EMAIL,
    password: str = DEFAULT_PASSWORD,
) -> tuple[User, bool]:
    """Create the development test user and workspace if they do not exist."""
    payload = RegisterRequest(email=email, password=password)
    normalized_email = str(payload.email)
    user = db.scalar(select(User).where(User.email == normalized_email))
    if user is not None:
        workspace = db.scalar(select(Workspace).where(Workspace.owner_id == user.id))
        if workspace is None:
            workspace = Workspace(owner_id=user.id, claimed_at=utcnow())
            db.add(workspace)
            db.flush()
        seed_mondial_repository(db, workspace)
        db.commit()
        return user, False

    user = User(
        email=normalized_email,
        password_hash=password_hash.hash(payload.password),
    )
    db.add(user)
    db.flush()
    workspace = Workspace(owner_id=user.id, claimed_at=utcnow())
    db.add(workspace)
    db.flush()
    seed_mondial_repository(db, workspace)
    db.commit()
    db.refresh(user)
    return user, True


def seed_mondial_repository(db: Session, workspace: Workspace) -> bool:
    existing = db.scalar(
        select(RepositoryRecord.id).where(
            RepositoryRecord.workspace_id == workspace.id,
            RepositoryRecord.name == MONDIAL_NAME,
        )
    )
    if existing is not None:
        return False
    db.add(
        RepositoryRecord(
            workspace_id=workspace.id,
            name=MONDIAL_NAME,
            description=MONDIAL_DESCRIPTION,
            kind="remote",
            endpoint=MONDIAL_ENDPOINT,
            rdf_data=None,
            rdf_format=None,
        )
    )
    return True


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed local SPADE development data")
    parser.add_argument("--email", default=DEFAULT_EMAIL)
    parser.add_argument("--password", default=DEFAULT_PASSWORD)
    return parser.parse_args()


def main() -> None:
    settings = get_settings()
    if settings.build == "production":
        raise SystemExit("Refusing to seed a test account in production mode")

    args = parse_args()
    with get_session_factory()() as db:
        user, created = seed_initial_user(db, args.email, args.password)

    if created:
        print(f"Created test user {user.email}")
        print(f"Password: {args.password}")
    else:
        print(f"Test user {user.email} and Mondial repository are ready")


if __name__ == "__main__":
    main()
