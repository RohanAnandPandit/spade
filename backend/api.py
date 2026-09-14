import country_converter as coco
import requests
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    Response,
    UploadFile,
)
from sqlalchemy import delete, func, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.analysis import QUERY_PATH, query_analysis
from backend.config import Settings, get_settings
from backend.database import get_db
from backend.demo import (
    DEMO_MAX_QUERY_LENGTH,
    MONDIAL_ENDPOINT,
    MONDIAL_NAME,
    demo_rate_limiter,
    validate_demo_query,
)
from backend.graph_storage import deserialize_graph, parse_rdf_upload, serialize_graph
from backend.models import (
    GeoBoundary,
    RepositoryRecord,
    SavedQuery,
    User,
    Workspace,
    utcnow,
)
from backend.repository import (
    REMOTE_TIMEOUT,
    USER_AGENT,
    LocalRepository,
    RemoteRepository,
)
from backend.schemas import (
    LoginRequest,
    RegisterRequest,
    RemoteRepositoryRequest,
    RepositoryInfo,
    RepositoryUpdateRequest,
    SavedQueryRequest,
    SavedQueryResponse,
    UserResponse,
)
from backend.security import (
    DUMMY_HASH,
    AuthContext,
    clear_failed_logins,
    clear_session_cookies,
    client_ip,
    current_auth,
    is_rate_limited,
    issue_session,
    password_hash,
    record_failed_login,
    require_csrf,
    validate_origin,
)
from backend.util import run_query_file

router = APIRouter(prefix="/api/v1")
country_converter = coco.CountryConverter()
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
GEOGRAPHICAL_TYPES = {"city", "country", "continent", "administrative", "town"}


def get_repository_record(db: Session, workspace_id, name: str) -> RepositoryRecord:
    record = db.scalar(
        select(RepositoryRecord).where(
            RepositoryRecord.workspace_id == workspace_id, RepositoryRecord.name == name
        )
    )
    if record is None:
        raise HTTPException(
            status_code=404, detail=f"Repository '{name}' was not found"
        )
    return record


def materialize_repository(record: RepositoryRecord):
    if record.kind == "local" and record.rdf_data is not None:
        return LocalRepository(
            name=record.name, graph=deserialize_graph(record.rdf_data)
        )
    if record.kind == "remote" and record.endpoint:
        return RemoteRepository(name=record.name, endpoint=record.endpoint)
    raise HTTPException(status_code=500, detail="Repository data is invalid")


def checked_result(result: dict):
    if error := result.get("error"):
        raise HTTPException(status_code=400, detail=error)
    return result


@router.get("/health")
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok"}


@router.get("/demo/sparql")
def run_demo_query(
    request: Request,
    query: str = Query(min_length=1, max_length=DEMO_MAX_QUERY_LENGTH),
):
    client_id = request.client.host if request.client else "unknown"
    demo_rate_limiter.check(client_id)
    validate_demo_query(query)
    return checked_result(
        RemoteRepository(name=MONDIAL_NAME, endpoint=MONDIAL_ENDPOINT).run_query(
            query=query
        )
    )


@router.post("/auth/register", response_model=UserResponse, status_code=201)
def register(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    validate_origin(request, settings)
    if db.scalar(select(User.id).where(User.email == str(payload.email))):
        raise HTTPException(
            status_code=409, detail="An account with this email already exists"
        )
    user = User(
        email=str(payload.email), password_hash=password_hash.hash(payload.password)
    )
    db.add(user)
    db.flush()
    workspace = None
    if payload.legacy_workspace_id:
        workspace = db.get(Workspace, payload.legacy_workspace_id, with_for_update=True)
        if workspace is not None and workspace.owner_id is None:
            workspace.owner_id = user.id
            workspace.claimed_at = utcnow()
        else:
            workspace = None
    if workspace is None:
        db.add(Workspace(owner_id=user.id, claimed_at=utcnow()))
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="An account with this email already exists"
        ) from error
    db.refresh(user)
    issue_session(response, db, user, settings)
    return user


@router.post("/auth/login", response_model=UserResponse)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    validate_origin(request, settings)
    email, ip = str(payload.email), client_ip(request)
    if is_rate_limited(db, email, ip):
        raise HTTPException(
            status_code=429,
            detail="Too many login attempts",
            headers={"Retry-After": "900"},
        )
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        password_hash.verify(payload.password, DUMMY_HASH)
        record_failed_login(db, email, ip)
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    valid, updated_hash = password_hash.verify_and_update(
        payload.password, user.password_hash
    )
    if not valid or user.disabled:
        record_failed_login(db, email, ip)
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if updated_hash:
        user.password_hash = updated_hash
        db.commit()
    clear_failed_logins(db, email, ip)
    issue_session(response, db, user, settings)
    return user


@router.get("/auth/me", response_model=UserResponse)
def me(auth: AuthContext = Depends(current_auth)):
    return auth.user


@router.post("/auth/logout", status_code=204)
def logout(
    response: Response,
    auth: AuthContext = Depends(require_csrf),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    db.delete(auth.session)
    db.commit()
    clear_session_cookies(response, settings)


@router.get("/repositories", response_model=list[RepositoryInfo])
def repositories(
    auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)
):
    return list(
        db.scalars(
            select(RepositoryRecord)
            .where(RepositoryRecord.workspace_id == auth.workspace.id)
            .order_by(RepositoryRecord.name)
        )
    )


@router.delete("/repositories/{repository_name}")
def delete_repository(
    repository_name: str,
    auth: AuthContext = Depends(require_csrf),
    db: Session = Depends(get_db),
):
    record = get_repository_record(db, auth.workspace.id, repository_name)
    db.delete(record)
    db.commit()
    return {"name": repository_name}


@router.put("/repositories/{repository_name}", response_model=RepositoryInfo)
def update_repository(
    repository_name: str,
    payload: RepositoryUpdateRequest,
    auth: AuthContext = Depends(require_csrf),
    db: Session = Depends(get_db),
):
    record = get_repository_record(db, auth.workspace.id, repository_name)
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Repository name cannot be blank")
    if record.kind == "remote":
        if payload.endpoint is None or not payload.endpoint.strip():
            raise HTTPException(
                status_code=422, detail="A remote repository requires an endpoint"
            )
        record.endpoint = payload.endpoint.strip()
    elif payload.endpoint is not None:
        raise HTTPException(
            status_code=422, detail="Uploaded repositories do not have an endpoint"
        )
    record.name = name
    record.description = payload.description
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="A repository with this name already exists"
        ) from error
    db.refresh(record)
    return record


@router.post("/repositories/remote", status_code=201)
def add_remote_repository(
    payload: RemoteRepositoryRequest,
    auth: AuthContext = Depends(require_csrf),
    db: Session = Depends(get_db),
):
    record = RepositoryRecord(
        workspace_id=auth.workspace.id,
        name=payload.name.strip(),
        description=payload.description,
        kind="remote",
        endpoint=payload.endpoint,
        rdf_data=None,
        rdf_format=None,
    )
    db.add(record)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="A repository with this name already exists"
        ) from error
    return {"name": record.name}


@router.post("/repositories/local", status_code=201)
def add_local_repository(
    name: str = Form(min_length=1, max_length=200),
    description: str = Form(default="", max_length=5000),
    data_file: UploadFile = File(alias="dataFile"),
    schema_file: UploadFile | None = File(default=None, alias="schemaFile"),
    auth: AuthContext = Depends(require_csrf),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    data = data_file.file.read(settings.max_upload_bytes + 1)
    schema = (
        schema_file.file.read(settings.max_upload_bytes + 1) if schema_file else b""
    )
    if len(data) + len(schema) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=413, detail="RDF upload exceeds the 32 MiB limit"
        )
    graph = parse_rdf_upload(data, data_file.filename)
    if schema_file and schema:
        graph += parse_rdf_upload(schema, schema_file.filename)
    encoded = serialize_graph(graph)
    if len(encoded) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=413, detail="Stored RDF graph exceeds the 32 MiB limit"
        )
    record = RepositoryRecord(
        workspace_id=auth.workspace.id,
        name=name.strip(),
        description=description,
        kind="local",
        endpoint=None,
        rdf_data=encoded,
        rdf_format="nt+gzip",
    )
    db.add(record)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="A repository with this name already exists"
        ) from error
    return {"name": record.name}


@router.get("/sparql")
def run_query(
    repository: str,
    query: str,
    auth: AuthContext = Depends(current_auth),
    db: Session = Depends(get_db),
):
    record = get_repository_record(db, auth.workspace.id, repository)
    return checked_result(materialize_repository(record).run_query(query=query))


@router.get("/saved-queries", response_model=list[SavedQueryResponse])
def get_saved_queries(
    repository: str,
    auth: AuthContext = Depends(current_auth),
    db: Session = Depends(get_db),
):
    record = get_repository_record(db, auth.workspace.id, repository)
    rows = db.scalars(
        select(SavedQuery)
        .where(SavedQuery.repository_id == record.id)
        .order_by(SavedQuery.created_at.desc())
    )
    return [
        SavedQueryResponse(
            id=row.id,
            name=row.name,
            sparql=row.sparql,
            repository=record.name,
            date=row.created_at,
        )
        for row in rows
    ]


@router.post("/saved-queries", status_code=201)
def save_query(
    payload: SavedQueryRequest,
    auth: AuthContext = Depends(require_csrf),
    db: Session = Depends(get_db),
):
    record = get_repository_record(db, auth.workspace.id, payload.repository)
    saved = SavedQuery(
        repository_id=record.id, name=payload.name, sparql=payload.sparql
    )
    db.add(saved)
    db.commit()
    return {"id": saved.id, "name": saved.name}


@router.delete("/saved-queries", status_code=204)
def delete_saved_queries(
    repository: str,
    auth: AuthContext = Depends(require_csrf),
    db: Session = Depends(get_db),
):
    record = get_repository_record(db, auth.workspace.id, repository)
    db.execute(delete(SavedQuery).where(SavedQuery.repository_id == record.id))
    db.commit()


def dataset_result(
    filename: str, repository: str, auth: AuthContext, db: Session, **values
):
    record = get_repository_record(db, auth.workspace.id, repository)
    rdf_repository = materialize_repository(record)
    path = QUERY_PATH / filename
    if values:
        return checked_result(
            rdf_repository.run_query(query=path.read_text().format(**values))
        )
    return checked_result(run_query_file(repository=rdf_repository, path=str(path)))


@router.get("/dataset/classes")
def classes(
    repository: str,
    auth: AuthContext = Depends(current_auth),
    db: Session = Depends(get_db),
):
    return [
        row[0]
        for row in dataset_result("all_classes.sparql", repository, auth, db)["data"]
    ]


@router.get("/dataset/class-hierarchy")
def class_hierarchy(
    repository: str,
    auth: AuthContext = Depends(current_auth),
    db: Session = Depends(get_db),
):
    result = dataset_result("class_hierarchy.sparql", repository, auth, db)
    return {"header": ["subject", "predicate", "object"], "data": result["data"]}


@router.get("/dataset/triplet-count")
def triplet_count(
    repository: str,
    auth: AuthContext = Depends(current_auth),
    db: Session = Depends(get_db),
):
    result = dataset_result("count_triplets.sparql", repository, auth, db)
    if not result["data"]:
        raise HTTPException(status_code=404, detail="No triplet count was returned")
    return str(result["data"][0][0])


def first_column(
    filename: str, repository: str, auth: AuthContext, db: Session, **values
):
    return [
        row[0]
        for row in dataset_result(filename, repository, auth, db, **values)["data"]
    ]


@router.get("/dataset/all-types")
def all_types(
    repository: str,
    auth: AuthContext = Depends(current_auth),
    db: Session = Depends(get_db),
):
    return first_column("all_types.sparql", repository, auth, db)


@router.get("/dataset/type")
def get_type(
    repository: str,
    uri: str,
    auth: AuthContext = Depends(current_auth),
    db: Session = Depends(get_db),
):
    return first_column("get_type.sparql", repository, auth, db, uri=uri)


@router.get("/dataset/type-properties")
def type_properties(
    repository: str,
    type: str,
    auth: AuthContext = Depends(current_auth),
    db: Session = Depends(get_db),
):
    return first_column("type_properties.sparql", repository, auth, db, type=type)


@router.get("/dataset/meta-information")
def meta_information(
    repository: str,
    uri: str,
    auth: AuthContext = Depends(current_auth),
    db: Session = Depends(get_db),
):
    result = dataset_result("meta_information.sparql", repository, auth, db, uri=uri)
    if not result["data"]:
        raise HTTPException(
            status_code=404, detail="No metadata was found for this URI"
        )
    return dict(zip(result["header"], result["data"][0], strict=False))


def link_count(
    filename: str, repository: str, uri: str, auth: AuthContext, db: Session
):
    result = dataset_result(filename, repository, auth, db, uri=uri)
    return {value: int(count) for value, count in result["data"]}


@router.get("/dataset/outgoing-links")
def outgoing_links(
    repository: str,
    uri: str,
    auth: AuthContext = Depends(current_auth),
    db: Session = Depends(get_db),
):
    return link_count("outgoing_links.sparql", repository, uri, auth, db)


@router.get("/dataset/incoming-links")
def incoming_links(
    repository: str,
    uri: str,
    auth: AuthContext = Depends(current_auth),
    db: Session = Depends(get_db),
):
    return link_count("incoming_links.sparql", repository, uri, auth, db)


@router.get("/dataset/all-properties")
def all_properties(
    repository: str,
    auth: AuthContext = Depends(current_auth),
    db: Session = Depends(get_db),
):
    return first_column("all_properties.sparql", repository, auth, db)


@router.get("/dataset/type-instances")
def type_instances(
    repository: str,
    type: str,
    auth: AuthContext = Depends(current_auth),
    db: Session = Depends(get_db),
):
    return first_column("type_instances.sparql", repository, auth, db, type=type)


@router.get("/dataset/property-values")
def property_values(
    repository: str,
    uri: str,
    prop_type: str = Query(alias="propType"),
    auth: AuthContext = Depends(current_auth),
    db: Session = Depends(get_db),
):
    return dataset_result(
        "property_values.sparql", repository, auth, db, uri=uri, prop_type=prop_type
    )["data"]


@router.get("/analysis")
def analysis(
    repository: str,
    query: str,
    auth: AuthContext = Depends(current_auth),
    db: Session = Depends(get_db),
):
    record = get_repository_record(db, auth.workspace.id, repository)
    return query_analysis(query=query, repository=materialize_repository(record))


def get_region_query(region: str) -> str:
    names = []
    for name in region.split(","):
        short_name = country_converter.convert(name, to="name_short")
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


@router.get("/geo")
def geo(
    region: str,
    auth: AuthContext = Depends(current_auth),
    db: Session = Depends(get_db),
):
    del auth
    remaining = get_region_query(region)
    while remaining:
        polygons = nominatim_search(remaining)
        if polygons:
            geometry = polygons[0].get("geojson", {})
            return {
                "geoData": {
                    "region": region,
                    "type": geometry.get("type"),
                    "name": remaining,
                    "coordinates": geometry.get("coordinates"),
                }
            }
        remaining = ",".join(remaining.split(",")[:-1])
    iso_a3 = country_converter.convert(region, to="ISO3")
    boundary = (
        db.scalar(select(GeoBoundary).where(GeoBoundary.iso_a3 == iso_a3))
        if iso_a3 != "not found"
        else None
    )
    if boundary is None:
        boundary = db.scalar(
            select(GeoBoundary).where(func.lower(GeoBoundary.name) == region.lower())
        )
    geometry = boundary.geometry if boundary else {}
    return {
        "geoData": {
            "region": region,
            "type": geometry.get("type"),
            "name": region,
            "coordinates": geometry.get("coordinates"),
        }
    }


@router.get("/geo/valid")
def geographical_name(text: str, auth: AuthContext = Depends(current_auth)):
    del auth
    return {"valid": bool(nominatim_search(get_region_query(text)))}
