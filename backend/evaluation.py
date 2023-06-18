import os
import time
from dotenv import load_dotenv, find_dotenv
from statistics import mean
from backend.analysis import query_analysis
from backend.repository import RemoteRepository


def execution_time(func, *, iterations=1):
    times = []

    for _ in range(iterations):
        t1 = time.time()
        func()
        t2 = time.time()
        times.append(t2 - t1)

    return mean(times), times


query = '''
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX : <http://www.semwebtech.org/mondial/10/meta#>

SELECT ?country1 ?country2 ?length
WHERE {
  ?b rdf:type :Border ;
     :isBorderOf ?c1 ;
     :isBorderOf ?c2 ;
     :length ?length .

  ?c1 rdf:type :Country ;
      :name ?country1 ;
      :encompassedByInfo ?en .

  ?c2 rdf:type :Country ;
      :name ?country2 ;
      :encompassedByInfo ?en2 .
}'''

load_dotenv(find_dotenv())
TEST_ENDPOINT = os.environ.get('TEST_ENDPOINT')
repository = RemoteRepository(name="mondial", endpoint=TEST_ENDPOINT)
func = lambda: query_analysis(query=query, repository=repository)
print(execution_time(func, iterations=10))
