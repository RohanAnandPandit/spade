import os
from datetime import UTC, datetime
from functools import lru_cache

import compress_pickle
import country_converter as coco
import pymongo
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.server_api import ServerApi

from backend.repository import LocalRepository, RDFRepository, RemoteRepository

COMPRESSION = "gzip"
DATABASE_NAME = "dataVisualiserDB"


class DatabaseNotConfiguredError(RuntimeError):
    """Raised when a persistence endpoint is used without MongoDB configured."""


@lru_cache(maxsize=1)
def get_database() -> Database:
    uri = os.environ.get("MONGODB_URL")
    if not uri:
        raise DatabaseNotConfiguredError(
            "MONGODB_URL is required for repository and query persistence"
        )
    client = MongoClient(
        uri,
        server_api=ServerApi("1"),
        connect=False,
        serverSelectionTimeoutMS=5_000,
    )
    return client[DATABASE_NAME]


def add_user(*, username: str):
    return get_database()["users"].insert_one({"username": username})


def get_queries(*, repository_id: str, username: str):
    return list(
        get_database()["queries"]
        .find({"repository": repository_id, "user": username}, {"_id": 0})
        .sort([("date", pymongo.DESCENDING)])
    )


def get_repository(*, repository_id: str, username: str) -> RDFRepository | None:
    repo = get_database()["repositories"].find_one(
        {"name": repository_id, "user": username}
    )
    if not repo:
        return None
    if "graph" in repo:
        return LocalRepository(
            name=repository_id, graph=compress_pickle.loads(repo["graph"], COMPRESSION)
        )
    if "endpoint" in repo:
        return RemoteRepository(name=repository_id, endpoint=repo["endpoint"])
    return None


def delete_repository(*, repository_id: str, username: str):
    return get_database()["repositories"].delete_one(
        {"name": repository_id, "user": username}
    )


def get_repository_info(*, username: str):
    details = get_database()["repositories"].find(
        {"user": username}, {"_id": 0, "name": 1, "description": 1, "endpoint": 1}
    )
    return list(details)


def add_repository(
    *, repository_id: str, username: str, description: str, graph=None, endpoint=None
):
    repo = {"name": repository_id, "user": username, "description": description}
    if graph is not None:
        repo["graph"] = compress_pickle.dumps(graph, COMPRESSION)
    elif endpoint:
        repo["endpoint"] = endpoint
    else:
        raise ValueError("A graph or remote endpoint is required")
    return get_database()["repositories"].insert_one(repo)


def update_repository(*, username: str, repository_id: str, graph=None, endpoint=None):
    values = None
    if graph is not None:
        values = {"graph": compress_pickle.dumps(graph, COMPRESSION)}
    elif endpoint:
        values = {"endpoint": endpoint}
    if values is None:
        raise ValueError("A graph or remote endpoint is required")
    return get_database()["repositories"].update_one(
        {"name": repository_id, "user": username}, {"$set": values}
    )


def save_query(*, name: str, sparql: str, repository_id: str, username: str):
    return get_database()["queries"].insert_one(
        {
            "name": name,
            "sparql": sparql,
            "repository": repository_id,
            "user": username,
            "date": datetime.now(UTC),
        }
    )


def delete_all_queries(*, repository_id: str, username: str) -> None:
    get_database()["queries"].delete_many(
        {"repository": repository_id, "user": username}
    )


country_converter = coco.CountryConverter()


def region_short_name(region: str):
    return country_converter.convert(region, to="name_short")


def geo_json_data(name: str):
    collection = get_database()["geoData"]
    standard_name = country_converter.convert(name, to="ISO3")
    if standard_name != "not found":
        return collection.find_one({"properties.ISO_A3": standard_name}, {"_id": 0})

    location = collection.find_one({"properties.NAME": name}, {"_id": 0})
    return location or collection.find_one(
        {"properties.NAME": name.upper()}, {"_id": 0}
    )
