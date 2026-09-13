import os
from pathlib import Path

import requests
from flask import Flask, abort, jsonify, request, send_from_directory
from flask_cors import CORS
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError
from werkzeug.exceptions import HTTPException
from werkzeug.utils import secure_filename

from backend.analysis import QUERY_PATH, query_analysis
from backend.db import (
    DatabaseNotConfiguredError,
    add_repository,
    delete_all_queries,
    delete_repository,
    geo_json_data,
    get_queries,
    get_repository,
    get_repository_info,
    region_short_name,
    save_query,
)
from backend.repository import REMOTE_TIMEOUT, USER_AGENT, RemoteRepositoryError
from backend.util import import_data, run_query_file

BUILD = os.environ.get("BUILD", "development")
UPLOAD_FOLDER = Path(os.environ.get("UPLOAD_FOLDER", "imports"))
FRONTEND_DIST = Path(__file__).resolve().parent / "frontend" / "dist"
ALLOWED_EXTENSIONS = {"rdf", "xml", "nt", "n3", "ttl", "nt11", "txt"}
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
GEOGRAPHICAL_TYPES = {"city", "country", "continent", "administrative", "town"}

if BUILD == "production":
    # The catch-all route below serves both assets and browser routes. Registering
    # Flask's static handler at `/` would intercept nested SPA routes with a 404.
    app = Flask(__name__, static_folder=None)
else:
    app = Flask(__name__)
    CORS(app, origins=["http://localhost:5173"])

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 32 * 1024 * 1024


@app.errorhandler(HTTPException)
def handle_http_error(error: HTTPException):
    return jsonify(error=error.description), error.code


@app.errorhandler(DatabaseNotConfiguredError)
def handle_database_not_configured(error: DatabaseNotConfiguredError):
    return jsonify(error=str(error)), 503


@app.errorhandler(ServerSelectionTimeoutError)
@app.errorhandler(requests.Timeout)
def handle_timeout(error: Exception):
    return jsonify(error="The upstream service timed out"), 504


@app.errorhandler(RemoteRepositoryError)
@app.errorhandler(requests.RequestException)
@app.errorhandler(PyMongoError)
def handle_upstream_failure(error: Exception):
    return jsonify(error=str(error) or "An upstream service failed"), 502


@app.errorhandler(ValueError)
def handle_invalid_value(error: ValueError):
    return jsonify(error=str(error)), 400


def required_arg(name: str) -> str:
    value = request.args.get(name, type=str)
    if value is None or not value.strip():
        abort(400, description=f"Missing query parameter: {name}")
    return value


def required_json(*names: str) -> dict:
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        abort(400, description="A JSON request body is required")
    missing = [name for name in names if not str(payload.get(name, "")).strip()]
    if missing:
        abort(400, description=f"Missing JSON field(s): {', '.join(missing)}")
    return payload


def requested_repository():
    repository_id = required_arg("repository")
    workspace_id = required_arg("workspace")
    repository = get_repository(repository_id=repository_id, workspace_id=workspace_id)
    if repository is None:
        abort(404, description=f"Repository '{repository_id}' was not found")
    return repository


def checked_result(result: dict):
    if error := result.get("error"):
        abort(400, description=error)
    return result


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.post("/upload")
def upload_file():
    uploaded_file = request.files.get("file")
    if uploaded_file is None:
        abort(400, description="No file was provided")
    if not uploaded_file.filename:
        abort(400, description="The uploaded file has no filename")
    if not allowed_file(uploaded_file.filename):
        abort(400, description="Unsupported RDF file extension")

    filename = secure_filename(uploaded_file.filename)
    app.config["UPLOAD_FOLDER"].mkdir(parents=True, exist_ok=True)
    uploaded_file.save(app.config["UPLOAD_FOLDER"] / filename)
    return jsonify(filename=filename), 201


@app.route("/repositories", methods=["GET", "DELETE"])
def repositories():
    workspace_id = required_arg("workspace")
    if request.method == "GET":
        return jsonify(get_repository_info(workspace_id=workspace_id))

    repository_id = required_arg("repository")
    result = delete_repository(repository_id=repository_id, workspace_id=workspace_id)
    if result.deleted_count == 0:
        abort(404, description=f"Repository '{repository_id}' was not found")
    return repository_id


@app.post("/repositories/local")
def add_local_repo():
    payload = required_json("name", "description", "dataUrl", "schemaUrl", "workspace")
    graph = import_data(data_url=payload["dataUrl"], schema_url=payload["schemaUrl"])
    add_repository(
        repository_id=payload["name"],
        workspace_id=payload["workspace"],
        graph=graph,
        description=payload["description"],
    )
    return payload["name"], 201


@app.post("/repositories/remote")
def add_remote_repo():
    payload = required_json("name", "endpoint", "workspace", "description")
    add_repository(
        repository_id=payload["name"],
        workspace_id=payload["workspace"],
        endpoint=payload["endpoint"],
        description=payload["description"],
    )
    return payload["name"], 201


@app.get("/sparql")
def run_query():
    repository = requested_repository()
    result = checked_result(repository.run_query(query=required_arg("query")))
    return jsonify(result)


@app.route("/saved-queries", methods=["GET", "POST", "DELETE"])
def history():
    if request.method == "POST":
        payload = required_json("workspace", "repository", "sparql", "name")
        save_query(
            repository_id=payload["repository"],
            sparql=payload["sparql"],
            name=payload["name"],
            workspace_id=payload["workspace"],
        )
        return payload["name"], 201

    repository_id = required_arg("repository")
    workspace_id = required_arg("workspace")
    if request.method == "GET":
        return jsonify(
            get_queries(repository_id=repository_id, workspace_id=workspace_id)
        )

    delete_all_queries(repository_id=repository_id, workspace_id=workspace_id)
    return "", 204


def run_dataset_query(filename: str, **values):
    repository = requested_repository()
    path = QUERY_PATH / filename
    if values:
        query = path.read_text().format(**values)
        return checked_result(repository.run_query(query=query))
    return checked_result(run_query_file(repository=repository, path=str(path)))


@app.get("/dataset/classes")
def classes():
    return [row[0] for row in run_dataset_query("all_classes.sparql")["data"]]


@app.get("/dataset/class-hierarchy")
def class_hierarchy():
    result = run_dataset_query("class_hierarchy.sparql")
    return jsonify(
        {"header": ["subject", "predicate", "object"], "data": result["data"]}
    )


@app.get("/dataset/triplet-count")
def triplets():
    result = run_dataset_query("count_triplets.sparql")
    if not result["data"]:
        abort(404, description="No triplet count was returned")
    return str(result["data"][0][0])


@app.get("/dataset/all-types")
def all_types():
    return [row[0] for row in run_dataset_query("all_types.sparql")["data"]]


@app.get("/dataset/type")
def get_type():
    result = run_dataset_query("get_type.sparql", uri=required_arg("uri"))
    return [row[0] for row in result["data"]]


@app.get("/dataset/type-properties")
def type_properties():
    result = run_dataset_query("type_properties.sparql", type=required_arg("type"))
    return [row[0] for row in result["data"]]


@app.get("/dataset/meta-information")
def meta_information():
    result = run_dataset_query("meta_information.sparql", uri=required_arg("uri"))
    if not result["data"]:
        abort(404, description="No metadata was found for this URI")
    return jsonify(dict(zip(result["header"], result["data"][0], strict=False)))


def link_counts(filename: str):
    result = run_dataset_query(filename, uri=required_arg("uri"))
    return jsonify({uri: int(count) for uri, count in result["data"]})


@app.get("/dataset/outgoing-links")
def outgoing_links():
    return link_counts("outgoing_links.sparql")


@app.get("/dataset/incoming-links")
def incoming_links():
    return link_counts("incoming_links.sparql")


@app.get("/dataset/all-properties")
def all_properties():
    return [row[0] for row in run_dataset_query("all_properties.sparql")["data"]]


@app.get("/dataset/type-instances")
def type_instances():
    result = run_dataset_query("type_instances.sparql", type=required_arg("type"))
    return [row[0] for row in result["data"]]


@app.get("/dataset/property-values")
def property_values():
    result = run_dataset_query(
        "property_values.sparql",
        uri=required_arg("uri"),
        prop_type=required_arg("propType"),
    )
    return result["data"]


@app.get("/analysis")
def analysis():
    repository = requested_repository()
    return jsonify(query_analysis(query=required_arg("query"), repository=repository))


def get_region_query(region: str) -> str:
    names = []
    for name in region.split(","):
        short_name = region_short_name(name)
        names.append(name if short_name == "not found" else short_name)
    return ", ".join(names)


def nominatim_search(query: str):
    response = requests.get(
        NOMINATIM_URL,
        params={"q": query, "polygon_geojson": 1, "format": "json"},
        headers={"User-Agent": USER_AGENT},
        timeout=REMOTE_TIMEOUT,
    )
    response.raise_for_status()
    return [
        entry for entry in response.json() if entry.get("type") in GEOGRAPHICAL_TYPES
    ]


@app.get("/geo")
def geo():
    region = required_arg("region")
    query = get_region_query(region)
    while query:
        polygons = nominatim_search(query)
        if polygons:
            geojson = polygons[0].get("geojson", {})
            return jsonify(
                geoData={
                    "region": region,
                    "type": geojson.get("type"),
                    "name": query,
                    "coordinates": geojson.get("coordinates"),
                }
            )
        query = ",".join(query.split(",")[:-1])

    data = geo_json_data(region)
    geometry = data.get("geometry", {}) if data else {}
    return jsonify(
        geoData={
            "region": region,
            "type": geometry.get("type"),
            "name": region,
            "coordinates": geometry.get("coordinates"),
        }
    )


@app.get("/geo/valid")
def geographical_name():
    return jsonify(valid=bool(nominatim_search(get_region_query(required_arg("text")))))


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path: str):
    if BUILD != "production":
        return jsonify(service="SPADE API", frontend="Run pnpm dev on port 5173")
    static_path = FRONTEND_DIST / path
    if path and static_path.is_file():
        return send_from_directory(FRONTEND_DIST, path)
    return send_from_directory(FRONTEND_DIST, "index.html")


if __name__ == "__main__":
    app.run(debug=BUILD == "development", host="0.0.0.0", port=5000)
