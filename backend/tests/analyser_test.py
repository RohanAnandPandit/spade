import unittest
from dotenv import load_dotenv, find_dotenv
import os

from backend.analysis import query_analysis
from backend.repository import RemoteRepository

load_dotenv(find_dotenv())
TEST_ENDPOINT = os.environ.get('TEST_ENDPOINT')


class QueryAnalyserTest(unittest.TestCase):
    repository = RemoteRepository(name="mondial", endpoint=TEST_ENDPOINT)

    def test_country_borders(self):
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
        analysis = query_analysis(query=query, repository=self.repository)
        variables = analysis['variables']
        potential_charts = set(analysis['visualisations'])

        self.assertEqual(analysis['pattern'],
                         "Three classes linked by functional properties")

        self.assertTrue('length' in variables['scalar'])
        self.assertTrue('country1' in variables['lexical'])
        self.assertTrue('country2' in variables['lexical'])
        self.assertEqual(potential_charts,
                         {'Sankey', 'Network', 'Chord Diagram', 'Heat Map'})


if __name__ == '__main__':
    unittest.main()
