from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from backend.models import Base, User, Workspace
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

    engine.dispose()
