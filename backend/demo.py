from collections import defaultdict, deque
from threading import Lock
from time import monotonic

from fastapi import HTTPException
from rdflib.plugins.sparql.parser import parseQuery
from rdflib.plugins.sparql.parserutils import CompValue

MONDIAL_NAME = "Mondial"
MONDIAL_ENDPOINT = "https://servolis.irisa.fr/mondial/sparql"
MONDIAL_DESCRIPTION = (
    "A public geographical knowledge graph of countries, cities, borders, "
    "rivers, mountains, and more."
)

DEMO_MAX_QUERY_LENGTH = 4_000
DEMO_MAX_RESULTS = 250
DEMO_REQUESTS_PER_MINUTE = 30


def _walk_sparql(value):
    if isinstance(value, CompValue):
        yield value
        for child in value.values():
            yield from _walk_sparql(child)
    elif isinstance(value, (list, tuple)):
        for child in value:
            yield from _walk_sparql(child)


def validate_demo_query(query: str) -> None:
    """Keep the public trial read-only and bounded for the shared endpoint."""
    if len(query) > DEMO_MAX_QUERY_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Trial queries must be {DEMO_MAX_QUERY_LENGTH} characters or fewer",
        )
    try:
        parsed = parseQuery(query)
    except Exception as error:
        raise HTTPException(
            status_code=400, detail="The SPARQL query is invalid"
        ) from error

    operation = parsed[1]
    if operation.name not in {"SelectQuery", "AskQuery"}:
        raise HTTPException(
            status_code=400, detail="The trial supports SELECT and ASK queries only"
        )
    if any(node.name == "ServiceGraphPattern" for node in _walk_sparql(operation)):
        raise HTTPException(
            status_code=400, detail="SERVICE clauses are not available in the trial"
        )

    if operation.name == "SelectQuery":
        limit_offset = operation.get("limitoffset")
        if not isinstance(limit_offset, CompValue) or "limit" not in limit_offset:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Trial SELECT queries must include "
                    f"LIMIT {DEMO_MAX_RESULTS} or less"
                ),
            )
        if int(limit_offset["limit"]) > DEMO_MAX_RESULTS:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Trial SELECT queries are limited to {DEMO_MAX_RESULTS} results"
                ),
            )


class DemoRateLimiter:
    def __init__(self) -> None:
        self._requests: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, client_id: str) -> None:
        now = monotonic()
        with self._lock:
            recent = self._requests[client_id]
            while recent and recent[0] <= now - 60:
                recent.popleft()
            if len(recent) >= DEMO_REQUESTS_PER_MINUTE:
                raise HTTPException(
                    status_code=429,
                    detail="Too many trial queries. Please wait a minute and try again",
                    headers={"Retry-After": "60"},
                )
            recent.append(now)

    def reset(self) -> None:
        with self._lock:
            self._requests.clear()


demo_rate_limiter = DemoRateLimiter()
