import gzip
from pathlib import Path

from rdflib import Graph

FORMATS = {
    ".rdf": "xml",
    ".xml": "xml",
    ".nt": "nt",
    ".nt11": "nt11",
    ".n3": "n3",
    ".ttl": "turtle",
    ".txt": "turtle",
}


def parse_rdf_upload(data: bytes, filename: str | None) -> Graph:
    suffix = Path(filename or "").suffix.lower()
    candidates = [FORMATS[suffix]] if suffix in FORMATS else []
    candidates.extend(value for value in FORMATS.values() if value not in candidates)
    errors = []
    for rdf_format in candidates:
        graph = Graph()
        try:
            graph.parse(data=data, format=rdf_format)
            if not graph:
                raise ValueError("The imported RDF graph is empty")
            return graph
        except Exception as error:  # RDFLib exposes parser-specific exceptions
            errors.append(f"{rdf_format}: {error}")
    raise ValueError(f"Could not parse data as RDF: {'; '.join(errors)}")


def serialize_graph(graph: Graph) -> bytes:
    serialized = graph.serialize(format="nt", encoding="utf-8")
    return gzip.compress(serialized, mtime=0)


def deserialize_graph(data: bytes) -> Graph:
    graph = Graph()
    graph.parse(data=gzip.decompress(data), format="nt")
    return graph
