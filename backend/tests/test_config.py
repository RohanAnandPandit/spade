from backend.config import Settings


def test_allowed_origins_accept_comma_separated_environment(monkeypatch) -> None:
    monkeypatch.setenv(
        "ALLOWED_ORIGINS", "http://localhost:5173, https://spade.example.com"
    )

    assert Settings(_env_file=None).allowed_origins == [
        "http://localhost:5173",
        "https://spade.example.com",
    ]
