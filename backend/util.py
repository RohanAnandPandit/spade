import csv
import io
import json
import re
import shlex

from rdflib import Graph


def is_url(text):
    regex = re.compile(
        r"^(?:http|ftp)s?://"  # http:// or https://
        r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|["
        r"A-Z0-9-]{2,}\.?)|"  # domain...
        r"localhost|"  # localhost...
        r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"  # ...or ip
        r"(?::\d+)?"  # optional port
        r"(?:/?|[/?]\S+)$",
        re.IGNORECASE,
    )

    return re.match(regex, text)


def csv_to_json(string):
    reader = csv.DictReader(io.StringIO(string))
    return json.dumps(list(reader))


def parse_csv_text(string: str, skip_header=True) -> [[str]]:
    string = string.replace("\r", "")
    rows = csv.reader(string.splitlines())
    header = next(rows)
    if skip_header:
        return list(rows)

    return {"header": header, "data": list(rows)}


def is_csv(string):
    return "," in string


def is_ntriples_format(result: str) -> bool:
    if result == "":
        return False

    lines = result.split("\n")

    return lines[0][-1] == "." and len(lines[0].split(" ")) == 4


def remove_brackets(text):
    if len(text) >= 2:
        if (text[0], text[-1]) == ("<", ">"):
            return text[1:-1]
    return text


def parse_ntriples_graph(result: str) -> [[str]]:
    triplets: [[str, str, str]] = list(
        map(
            lambda line: list(map(remove_brackets, shlex.split(line))),
            result.strip().split(".\n"),
        )
    )

    return triplets


def is_blank_node(uri: str):
    return uri.startswith("_:")


def is_json(myjson):
    try:
        json.loads(myjson)
    except ValueError:
        return False
    return True


def remove_comments(code):
    code = str(code)
    return re.sub(r"(?m)^ *#.*\n?", "", code)


def separator_split(text) -> [str]:
    return re.split(""";(?=(?:[^'"]|'[^']*'|"[^"]*")*$)""", text)


def _parse_rdf(graph: Graph, location: str, label: str) -> None:
    if not location:
        raise ValueError(f"{label} location is required")

    errors = []
    for rdf_format in ("xml", "nt", "n3", "ttl", "turtle"):
        try:
            graph.parse(location=location, format=rdf_format)
            return
        except Exception as error:  # rdflib parsers use several exception types
            errors.append(f"{rdf_format}: {error}")

    raise ValueError(f"Could not parse {label} as RDF: {'; '.join(errors)}")


def import_data(*, data_url: str, schema_url: str):
    graph = Graph()
    _parse_rdf(graph, data_url, "data")
    _parse_rdf(graph, schema_url, "schema")
    if not graph:
        raise ValueError("The imported RDF graph is empty")
    return graph


def convert_sparql_json_result(result):
    if "boolean" in result:
        return {"boolean": result["boolean"], "header": [], "data": []}

    header = result["head"]["vars"]
    data = []

    for row in result["results"]["bindings"]:
        data.append([row[var]["value"] if var in row else "" for var in header])

    return {"header": header, "data": data}


def run_query_file(*, repository, path: str):
    with open(path) as query:
        result = repository.run_query(query=query.read())
        return result
