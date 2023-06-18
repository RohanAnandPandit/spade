import unittest
from dotenv import load_dotenv, find_dotenv
import os
from backend.repository import RemoteRepository

load_dotenv(find_dotenv())
TEST_ENDPOINT = os.environ.get('TEST_ENDPOINT')


class QueryAnalyserTest(unittest.TestCase):
    repository = RemoteRepository(name="test", endpoint=TEST_ENDPOINT)

    def (self):
        self.assertEqual('foo'.upper(), 'FOO')

    def test_isupper(self):
        self.assertTrue('FOO'.isupper())
        self.assertFalse('Foo'.isupper())

    def test_split(self):
        s = 'hello world'
        self.assertEqual(s.split(), ['hello', 'world'])
        # check that s.split fails when the separator is not a string
        with self.assertRaises(TypeError):
            s.split(2)


if __name__ == '__main__':
    unittest.main()
