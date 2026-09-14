"""One-time, read-only MongoDB to PostgreSQL importer.

Only run this against a trusted legacy SPADE database: legacy graph values are
Python pickles. MongoDB is never modified.
"""

import argparse
import json
import os
import uuid
from collections import Counter

import compress_pickle
from pymongo import MongoClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.database import get_engine
from backend.graph_storage import serialize_graph
from backend.models import GeoBoundary, RepositoryRecord, SavedQuery, Workspace

LEGACY_DATABASE = "dataVisualiserDB"
LEGACY_NAMESPACE = uuid.UUID("8fa32df1-7410-4b4e-97a4-30dfebf12bb2")


def workspace_uuid(value: str) -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except (TypeError, ValueError, AttributeError):
        return uuid.uuid5(LEGACY_NAMESPACE, str(value))


def migrate(mongo_url: str, *, dry_run: bool) -> Counter:
    counts: Counter = Counter()
    mongo = MongoClient(mongo_url, serverSelectionTimeoutMS=5_000)[LEGACY_DATABASE]
    with Session(get_engine()) as db:
        available_repositories: set[tuple[uuid.UUID, str]] = set()
        workspace_values = set()
        workspace_values.update(
            str(row.get("workspace"))
            for row in mongo.repositories.find({"workspace": {"$exists": True}})
        )
        workspace_values.update(
            str(row.get("workspace"))
            for row in mongo.queries.find({"workspace": {"$exists": True}})
        )
        counts["workspaces_source"] = len(workspace_values)
        for value in workspace_values:
            identifier = workspace_uuid(value)
            if db.get(Workspace, identifier) is None:
                counts["workspaces_imported"] += 1
                if not dry_run:
                    db.add(Workspace(id=identifier, owner_id=None, claimed_at=None))
            else:
                counts["workspaces_skipped"] += 1
        if not dry_run:
            db.flush()

        for source in mongo.repositories.find({"workspace": {"$exists": True}}):
            counts["repositories_source"] += 1
            workspace_id = workspace_uuid(source["workspace"])
            name = str(source.get("name", "")).strip()
            existing = db.scalar(
                select(RepositoryRecord.id).where(
                    RepositoryRecord.workspace_id == workspace_id,
                    RepositoryRecord.name == name,
                )
            )
            if existing:
                counts["repositories_skipped"] += 1
                available_repositories.add((workspace_id, name))
                continue
            try:
                if "graph" in source:
                    graph = compress_pickle.loads(source["graph"], "gzip")
                    values = {
                        "kind": "local",
                        "endpoint": None,
                        "rdf_data": serialize_graph(graph),
                        "rdf_format": "nt+gzip",
                    }
                elif source.get("endpoint"):
                    values = {
                        "kind": "remote",
                        "endpoint": source["endpoint"],
                        "rdf_data": None,
                        "rdf_format": None,
                    }
                else:
                    raise ValueError("repository has no graph or endpoint")
                counts["repositories_imported"] += 1
                available_repositories.add((workspace_id, name))
                if not dry_run:
                    db.add(
                        RepositoryRecord(
                            workspace_id=workspace_id,
                            name=name,
                            description=str(source.get("description", "")),
                            **values,
                        )
                    )
                    db.flush()
            except Exception:
                counts["repositories_errors"] += 1

        if not dry_run:
            db.flush()
        for source in mongo.queries.find({"workspace": {"$exists": True}}):
            counts["queries_source"] += 1
            workspace_id = workspace_uuid(source["workspace"])
            repository_name = str(source.get("repository", ""))
            repository = db.scalar(
                select(RepositoryRecord).where(
                    RepositoryRecord.workspace_id == workspace_id,
                    RepositoryRecord.name == repository_name,
                )
            )
            if repository is None and (
                not dry_run
                or (workspace_id, repository_name) not in available_repositories
            ):
                counts["queries_errors"] += 1
                continue
            duplicate = None
            if repository is not None:
                duplicate = db.scalar(
                    select(SavedQuery.id).where(
                        SavedQuery.repository_id == repository.id,
                        SavedQuery.name == str(source.get("name", "")),
                        SavedQuery.sparql == str(source.get("sparql", "")),
                    )
                )
            if duplicate:
                counts["queries_skipped"] += 1
                continue
            counts["queries_imported"] += 1
            if not dry_run:
                values = {
                    "repository_id": repository.id,
                    "name": str(source.get("name", "")),
                    "sparql": str(source.get("sparql", "")),
                }
                if source.get("date") is not None:
                    values["created_at"] = source["date"]
                db.add(SavedQuery(**values))

        for source in mongo.geoData.find({}):
            counts["geo_source"] += 1
            properties = source.get("properties", {})
            name = str(properties.get("NAME", "")).strip()
            iso_a3 = properties.get("ISO_A3")
            if not name or not source.get("geometry"):
                counts["geo_errors"] += 1
                continue
            duplicate = db.scalar(
                select(GeoBoundary.id).where(
                    GeoBoundary.name == name, GeoBoundary.iso_a3 == iso_a3
                )
            )
            if duplicate:
                counts["geo_skipped"] += 1
                continue
            counts["geo_imported"] += 1
            if not dry_run:
                db.add(
                    GeoBoundary(name=name, iso_a3=iso_a3, geometry=source["geometry"])
                )

        if dry_run:
            db.rollback()
        else:
            db.commit()
    return counts


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    arguments = parser.parse_args()
    mongo_url = os.environ.get("MONGODB_URL")
    if not mongo_url:
        parser.error("MONGODB_URL is required")
    print(
        json.dumps(dict(migrate(mongo_url, dry_run=arguments.dry_run)), sort_keys=True)
    )


if __name__ == "__main__":
    main()
