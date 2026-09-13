import os
import uuid

import pytest
from fastapi.testclient import TestClient

from backend.main import app

pytestmark = pytest.mark.skipif(
    not os.environ.get("TEST_DATABASE_URL"),
    reason="TEST_DATABASE_URL is required for PostgreSQL integration tests",
)


def test_authenticated_repository_flow_against_postgres() -> None:
    email = f"integration-{uuid.uuid4()}@example.com"
    with TestClient(app) as client:
        registered = client.post(
            "/api/v1/auth/register",
            json={"email": email, "password": "a secure integration password"},
            headers={"Origin": "http://localhost:5173"},
        )
        assert registered.status_code == 201
        csrf = client.cookies["spade_csrf"]
        created = client.post(
            "/api/v1/repositories/local",
            data={"name": "integration", "description": "PostgreSQL round trip"},
            files={
                "dataFile": (
                    "integration.ttl",
                    b"<urn:subject> <urn:predicate> <urn:object> .",
                    "text/turtle",
                )
            },
            headers={"X-CSRF-Token": csrf},
        )
        assert created.status_code == 201
        queried = client.get(
            "/api/v1/sparql",
            params={
                "repository": "integration",
                "query": "SELECT ?s WHERE { ?s <urn:predicate> <urn:object> }",
            },
        )
        assert queried.status_code == 200
        assert queried.json()["data"] == [["urn:subject"]]
        assert (
            client.post(
                "/api/v1/auth/logout", headers={"X-CSRF-Token": csrf}
            ).status_code
            == 204
        )
