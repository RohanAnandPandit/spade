import uuid
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import get_db
from backend.demo import demo_rate_limiter
from backend.main import app
from backend.models import Base, RepositoryRecord, User, Workspace


@pytest.fixture
def session_factory():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    yield factory
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def client(session_factory) -> Generator[TestClient]:
    def override_db():
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    demo_rate_limiter.reset()


def register(client: TestClient, email: str = "person@example.com"):
    return client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "a secure password"},
        headers={"Origin": "http://localhost:5173"},
    )


def csrf_headers(client: TestClient) -> dict[str, str]:
    return {"X-CSRF-Token": client.cookies["spade_csrf"]}


def test_health_and_protected_route(client: TestClient) -> None:
    assert client.get("/api/v1/health").json() == {"status": "ok"}
    response = client.get("/api/v1/repositories")
    assert response.status_code == 401
    assert response.json() == {"error": "Not authenticated"}


def test_public_demo_runs_bounded_mondial_queries(
    client: TestClient, monkeypatch
) -> None:
    def run_query(repository, *, query):
        assert repository.endpoint.endswith("/mondial/sparql")
        assert "LIMIT 10" in query
        return {"header": ["country"], "data": [["France"]]}

    monkeypatch.setattr("backend.api.RemoteRepository.run_query", run_query)
    response = client.get(
        "/api/v1/demo/sparql",
        params={"query": "SELECT ?country WHERE { ?s ?p ?country } LIMIT 10"},
    )
    assert response.status_code == 200
    assert response.json()["data"] == [["France"]]


@pytest.mark.parametrize(
    ("query", "message"),
    [
        ("SELECT * WHERE { ?s ?p ?o }", "must include LIMIT"),
        ("SELECT * WHERE { ?s ?p ?o } LIMIT 251", "limited to 250"),
        ("CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }", "SELECT and ASK"),
        (
            "SELECT * WHERE { SERVICE <https://example.com> { ?s ?p ?o } } LIMIT 10",
            "SERVICE clauses",
        ),
    ],
)
def test_public_demo_rejects_unbounded_or_unsafe_queries(
    client: TestClient, query: str, message: str
) -> None:
    response = client.get("/api/v1/demo/sparql", params={"query": query})
    assert response.status_code == 400
    assert message in response.json()["error"]


def test_register_restore_and_logout(client: TestClient) -> None:
    response = register(client, "Person@Example.com")
    assert response.status_code == 201
    assert response.json()["email"] == "person@example.com"
    assert response.cookies["spade_session"]
    assert "HttpOnly" in response.headers["set-cookie"]

    assert client.get("/api/v1/auth/me").status_code == 200
    no_csrf = client.post("/api/v1/auth/logout")
    assert no_csrf.status_code == 403
    assert (
        client.post("/api/v1/auth/logout", headers=csrf_headers(client)).status_code
        == 204
    )
    assert client.get("/api/v1/auth/me").status_code == 401


def test_registration_claims_anonymous_workspace(
    client: TestClient, session_factory
) -> None:
    legacy_id = uuid.uuid4()
    with session_factory() as db:
        db.add(Workspace(id=legacy_id, owner_id=None, claimed_at=None))
        db.commit()

    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "claim@example.com",
            "password": "a secure password",
            "legacyWorkspaceId": str(legacy_id),
        },
    )
    assert response.status_code == 201
    with session_factory() as db:
        user = db.scalar(select(User).where(User.email == "claim@example.com"))
        assert user is not None
        assert db.get(Workspace, legacy_id).owner_id == user.id


def test_login_is_generic_and_throttled(client: TestClient) -> None:
    register(client)
    client.post("/api/v1/auth/logout", headers=csrf_headers(client))
    for _ in range(5):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "person@example.com", "password": "wrong"},
        )
        assert response.status_code == 401
        assert response.json() == {"error": "Incorrect email or password"}
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "person@example.com", "password": "wrong"},
    )
    assert response.status_code == 429
    assert response.headers["retry-after"] == "900"


def test_repository_ownership_and_local_rdf_round_trip(client: TestClient) -> None:
    assert register(client).status_code == 201
    response = client.post(
        "/api/v1/repositories/local",
        data={"name": "example", "description": "A graph"},
        files={
            "dataFile": ("example.ttl", b"<urn:s> <urn:p> <urn:o> .", "text/turtle")
        },
        headers=csrf_headers(client),
    )
    assert response.status_code == 201
    query = "SELECT ?s WHERE { ?s <urn:p> <urn:o> }"
    result = client.get(
        "/api/v1/sparql", params={"repository": "example", "query": query}
    )
    assert result.status_code == 200
    assert result.json()["data"] == [["urn:s"]]
    properties = client.get(
        "/api/v1/dataset/all-properties", params={"repository": "example"}
    )
    assert properties.status_code == 200
    assert properties.json() == ["urn:p"]
    types = client.get(
        "/api/v1/dataset/all-types", params={"repository": "example"}
    )
    assert types.status_code == 200
    assert types.json() == []


def test_repository_connection_can_be_viewed_and_edited(client: TestClient) -> None:
    assert register(client).status_code == 201
    response = client.post(
        "/api/v1/repositories/remote",
        json={
            "name": "original",
            "description": "Original description",
            "endpoint": "https://example.com/old",
        },
        headers=csrf_headers(client),
    )
    assert response.status_code == 201

    response = client.put(
        "/api/v1/repositories/original",
        json={
            "name": "updated",
            "description": "A clearer description",
            "endpoint": "https://example.com/sparql",
        },
        headers=csrf_headers(client),
    )

    assert response.status_code == 200
    assert response.json() == {
        "name": "updated",
        "description": "A clearer description",
        "endpoint": "https://example.com/sparql",
    }
    assert client.get("/api/v1/repositories").json() == [response.json()]


def test_one_user_cannot_access_another_users_repository(session_factory) -> None:
    def override_db():
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as first, TestClient(app) as second:
        register(first, "first@example.com")
        first.post(
            "/api/v1/repositories/remote",
            json={
                "name": "private",
                "description": "",
                "endpoint": "https://example.com/sparql",
            },
            headers=csrf_headers(first),
        )
        register(second, "second@example.com")
        assert second.get("/api/v1/repositories").json() == []
        assert (
            second.get(
                "/api/v1/sparql", params={"repository": "private", "query": "ASK {}"}
            ).status_code
            == 404
        )
    app.dependency_overrides.clear()


def test_database_contains_portable_graph_bytes(
    client: TestClient, session_factory
) -> None:
    register(client)
    client.post(
        "/api/v1/repositories/local",
        data={"name": "portable", "description": ""},
        files={
            "dataFile": (
                "data.nt",
                b"<urn:s> <urn:p> <urn:o> .",
                "application/n-triples",
            )
        },
        headers=csrf_headers(client),
    )
    with session_factory() as db:
        record = db.scalar(
            select(RepositoryRecord).where(RepositoryRecord.name == "portable")
        )
        assert record is not None
        assert record.rdf_format == "nt+gzip"
        assert record.rdf_data.startswith(b"\x1f\x8b")
