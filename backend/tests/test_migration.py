import uuid

import pytest
from rdflib import Graph, URIRef
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

compress_pickle = pytest.importorskip("compress_pickle")
pytest.importorskip("pymongo")

from backend import migrate_mongodb  # noqa: E402
from backend.models import Base, RepositoryRecord, SavedQuery, Workspace  # noqa: E402


class Collection:
    def __init__(self, rows):
        self.rows = rows

    def find(self, query):
        del query
        return list(self.rows)


class LegacyDatabase:
    def __init__(self, workspace_id: str):
        graph = Graph()
        graph.add((URIRef("urn:s"), URIRef("urn:p"), URIRef("urn:o")))
        self.repositories = Collection(
            [
                {
                    "workspace": workspace_id,
                    "name": "legacy",
                    "description": "Imported",
                    "graph": compress_pickle.dumps(graph, "gzip"),
                }
            ]
        )
        self.queries = Collection(
            [
                {
                    "workspace": workspace_id,
                    "repository": "legacy",
                    "name": "Everything",
                    "sparql": "SELECT * WHERE { ?s ?p ?o }",
                }
            ]
        )
        self.geoData = Collection([])


class LegacyClient:
    def __init__(self, database):
        self.database = database

    def __getitem__(self, name):
        assert name == migrate_mongodb.LEGACY_DATABASE
        return self.database


def test_migration_is_dry_run_capable_and_idempotent(monkeypatch) -> None:
    workspace_id = str(uuid.uuid4())
    legacy = LegacyDatabase(workspace_id)
    engine = create_engine("sqlite://", poolclass=StaticPool)
    Base.metadata.create_all(engine)
    monkeypatch.setattr(
        migrate_mongodb, "MongoClient", lambda *args, **kwargs: LegacyClient(legacy)
    )
    monkeypatch.setattr(migrate_mongodb, "get_engine", lambda: engine)

    dry_run = migrate_mongodb.migrate("mongodb://unused", dry_run=True)
    assert dry_run["repositories_imported"] == 1
    assert dry_run["queries_imported"] == 1
    with Session(engine) as db:
        assert db.scalar(select(func.count(Workspace.id))) == 0

    first = migrate_mongodb.migrate("mongodb://unused", dry_run=False)
    assert first["repositories_imported"] == 1
    assert first["queries_imported"] == 1
    second = migrate_mongodb.migrate("mongodb://unused", dry_run=False)
    assert second["repositories_skipped"] == 1
    assert second["queries_skipped"] == 1
    with Session(engine) as db:
        assert db.scalar(select(func.count(RepositoryRecord.id))) == 1
        assert db.scalar(select(func.count(SavedQuery.id))) == 1
