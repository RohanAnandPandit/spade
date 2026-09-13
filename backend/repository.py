from abc import ABC, abstractmethod

import requests
from rdflib import Graph

from backend.util import convert_sparql_json_result

REMOTE_TIMEOUT = (5, 30)
USER_AGENT = "SPADE/0.1 (+https://github.com/rohanp/spade)"


class RemoteRepositoryError(RuntimeError):
    """Raised when a remote SPARQL endpoint returns an unusable response."""


class RDFRepository(ABC):
    def __init__(self, *, name: str):
        self.name = name

    @abstractmethod
    def run_query(self, *, query: str):
        raise NotImplementedError


class LocalRepository(RDFRepository):
    def __init__(self, *, name: str, graph: Graph):
        super().__init__(name=name)
        self.graph = graph

    def run_query(self, *, query: str):
        try:
            result = self.graph.query(query)
        except Exception as error:  # rdflib exposes parser-specific exception types
            return {"header": [], "data": [], "error": str(error)}

        if result.type == "SELECT":
            header = [str(column) for column in result.vars]
            data = [[str(value) for value in row] for row in result]
        elif result.type == "ASK":
            return {"header": [], "data": [], "boolean": bool(result)}
        else:
            header = ["Subject", "Predicate", "Object"]
            data = [[str(value) for value in row] for row in result]
        return {"header": header, "data": data}


class RemoteRepository(RDFRepository):
    accepted_formats = (
        "application/sparql-results+json",
        "application/x-graphdb-table-results+json",
    )

    def __init__(self, *, name: str, endpoint: str):
        super().__init__(name=name)
        self.endpoint = endpoint

    def run_query(self, *, query: str):
        last_response = None
        for accepted_format in self.accepted_formats:
            last_response = requests.get(
                self.endpoint,
                params={"query": query},
                headers={"Accept": accepted_format, "User-Agent": USER_AGENT},
                timeout=REMOTE_TIMEOUT,
            )
            if last_response.status_code == 406:
                continue
            if last_response.ok:
                try:
                    return convert_sparql_json_result(last_response.json())
                except (KeyError, TypeError, ValueError) as error:
                    raise RemoteRepositoryError(
                        "Remote SPARQL endpoint returned invalid JSON results"
                    ) from error
            raise RemoteRepositoryError(
                f"Remote SPARQL endpoint returned HTTP {last_response.status_code}"
            )

        status = last_response.status_code if last_response is not None else "unknown"
        raise RemoteRepositoryError(
            f"Remote SPARQL endpoint did not provide a supported response ({status})"
        )
