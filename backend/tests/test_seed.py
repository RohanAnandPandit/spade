from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from backend.demo import MONDIAL_ENDPOINT, MONDIAL_NAME
from backend.models import Base, RepositoryRecord, User, Workspace
from backend.security import password_hash
from backend.seed import seed_initial_user


def test_seed_initial_user_is_idempotent_and_uses_argon2():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)

    with Session(engine, expire_on_commit=False) as db:
        user, created = seed_initial_user(db, "  TESTER@EXAMPLE.COM ", "SpadeTest123!")
        same_user, created_again = seed_initial_user(
            db, "tester@example.com", "SpadeTest123!"
        )

        assert created is True
        assert created_again is False
        assert same_user.id == user.id
        assert user.email == "tester@example.com"
        assert password_hash.verify("SpadeTest123!", user.password_hash)
        assert db.scalar(select(func.count(User.id))) == 1
        assert db.scalar(select(func.count(Workspace.id))) == 1
        assert db.scalar(select(func.count(RepositoryRecord.id))) == 1
        mondial = db.scalar(select(RepositoryRecord))
        assert mondial.name == MONDIAL_NAME
        assert mondial.endpoint == MONDIAL_ENDPOINT

    engine.dispose()


def test_seed_initial_user_backfills_mondial_for_existing_test_user():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)

    with Session(engine, expire_on_commit=False) as db:
        user = User(
            email="tester@example.com",
            password_hash=password_hash.hash("SpadeTest123!"),
        )
        db.add(user)
        db.commit()

        seeded_user, created = seed_initial_user(db)

        assert created is False
        assert seeded_user.id == user.id
        workspace = db.scalar(select(Workspace).where(Workspace.owner_id == user.id))
        assert workspace is not None
        mondial = db.scalar(
            select(RepositoryRecord).where(
                RepositoryRecord.workspace_id == workspace.id,
                RepositoryRecord.name == MONDIAL_NAME,
            )
        )
        assert mondial is not None
        assert mondial.endpoint == MONDIAL_ENDPOINT

    engine.dispose()
