import importlib

import pytest
import requests

from backend.repository import RemoteRepository
from backend.util import import_data


def test_app_imports_without_build_or_mongodb(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("BUILD", raising=False)
    monkeypatch.delenv("MONGODB_URL", raising=False)

    app_module = importlib.import_module("app")

    assert app_module.BUILD == "development"


def test_missing_repository_returns_404(monkeypatch: pytest.MonkeyPatch) -> None:
    app_module = importlib.import_module("app")
    monkeypatch.setattr(app_module, "get_repository", lambda **_: None)

    response = app_module.app.test_client().get(
        "/sparql",
        query_string={
            "repository": "missing",
            "username": "tester",
            "query": "SELECT * WHERE { ?s ?p ?o }",
        },
    )

    assert response.status_code == 404
    assert response.get_json() == {"error": "Repository 'missing' was not found"}


def test_missing_query_parameter_returns_400() -> None:
    app_module = importlib.import_module("app")

    response = app_module.app.test_client().post("/login")

    assert response.status_code == 400
    assert response.get_json() == {"error": "Missing query parameter: username"}


def test_failed_rdf_import_does_not_return_an_empty_graph(tmp_path) -> None:
    invalid = tmp_path / "missing.rdf"

    with pytest.raises(ValueError, match="Could not parse data as RDF"):
        import_data(data_url=str(invalid), schema_url=str(invalid))


def test_remote_repository_timeout_is_not_swallowed(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def timeout(*args, **kwargs):
        raise requests.Timeout("too slow")

    monkeypatch.setattr(requests, "get", timeout)
    repository = RemoteRepository(name="remote", endpoint="https://example.com/sparql")

    with pytest.raises(requests.Timeout):
        repository.run_query(query="SELECT * WHERE { ?s ?p ?o }")
