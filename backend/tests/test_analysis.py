import re

import pytest

from backend.analysis import get_where_clause, query_analysis, type_category
from backend.repository import RDFRepository


class FakeRepository(RDFRepository):
    """Small deterministic repository for query-analysis tests."""

    property_types = {
        "http://example.com/name": [
            "http://www.w3.org/2002/07/owl#DatatypeProperty",
            "http://www.w3.org/2002/07/owl#InverseFunctionalProperty",
        ],
        "http://example.com/population": [
            "http://www.w3.org/2002/07/owl#DatatypeProperty",
        ],
    }
    property_ranges = {
        "http://example.com/name": "http://www.w3.org/2001/XMLSchema#string",
        "http://example.com/population": "http://www.w3.org/2001/XMLSchema#integer",
    }

    def __init__(self) -> None:
        super().__init__(name="fake")

    def run_query(self, *, query: str):
        match = re.search(r"<(http://example.com/[^>]+)>", query)
        uri = match.group(1) if match else ""
        if "SELECT DISTINCT ?type" in query:
            return {
                "header": ["type"],
                "data": [[value] for value in self.property_types.get(uri, [])],
            }
        if "rdfs:range" in query:
            value = self.property_ranges.get(uri)
            return {"header": ["range"], "data": [[value]] if value else []}
        raise AssertionError(f"Unexpected fake repository query: {query}")


@pytest.fixture
def repository() -> FakeRepository:
    return FakeRepository()


def test_class_with_data_properties(repository: FakeRepository) -> None:
    query = """
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ex: <http://example.com/>

        SELECT ?name ?population
        WHERE {
          ?country rdf:type ex:Country ;
                   ex:name ?name ;
                   ex:population ?population .
        }
    """

    result = query_analysis(query=query, repository=repository)

    assert result["pattern"] == "Class with data properties"
    assert result["variables"]["key"] == ["name"]
    assert result["variables"]["numeric"] == ["population"]
    assert {"Bar", "Pie", "Word Cloud"}.issubset(result["visualisations"])


def test_construct_query_does_not_require_a_remote_endpoint(
    repository: FakeRepository,
) -> None:
    result = query_analysis(
        query="""
            CONSTRUCT { ?s ?p ?o }
            WHERE { ?s ?p ?o . }
        """,
        repository=repository,
    )

    assert result["pattern"] == "RDF Graph"
    assert result["visualisations"] == ["Graph"]


@pytest.mark.parametrize(
    ("query", "expected"),
    [
        ("SELECT * WHERE { ?s ?p ?o . }", "?s ?p ?o . "),
        ("SELECT * { ?s ?p ?o . }", None),
    ],
)
def test_where_clause_parsing(query: str, expected: str | None) -> None:
    assert get_where_clause(query) == expected


@pytest.mark.parametrize("rdf_type", ["date", "dateTime"])
def test_date_types_are_classified(rdf_type: str) -> None:
    assert type_category(type_uri=rdf_type) == ["date"]
