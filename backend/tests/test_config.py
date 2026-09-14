from backend.config import Settings


def test_allowed_origins_accept_comma_separated_environment(monkeypatch) -> None:
    monkeypatch.setenv(
        "ALLOWED_ORIGINS", "http://localhost:5173, https://spade.example.com"
    )

    assert Settings(_env_file=None).allowed_origins == [
        "http://localhost:5173",
        "https://spade.example.com",
    ]


def test_hosted_database_url_uses_installed_psycopg_driver() -> None:
    settings = Settings(
        DATABASE_URL="postgresql://spade:secret@db.internal/spade",
        _env_file=None,
    )

    assert (
        settings.database_url == "postgresql+psycopg://spade:secret@db.internal/spade"
    )
