import os
import urllib

import requests
from flask import Flask, request, jsonify, flash, send_from_directory, session
from werkzeug.utils import secure_filename
from flask_cors import CORS
from dotenv import load_dotenv, find_dotenv
from backend.analysis import query_analysis, QUERY_PATH
from backend.db import save_query, get_queries, delete_all_queries, \
    get_repository, get_repository_info, add_repository, delete_repository, \
    geo_json_data, region_short_name
from backend.util import run_query_file, import_data

load_dotenv(find_dotenv())

UPLOAD_FOLDER = 'imports'

BUILD = os.environ['BUILD']

if BUILD == 'development':
    app = Flask(__name__)
    CORS(app, origins=["http://localhost:3000"])
else:
    app = Flask(__name__, static_url_path='', static_folder='frontend/build')

app.secret_key = 'imperial-college-london'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'rdf', 'xml', 'nt', 'n3', 'ttl', 'nt11', 'txt'}

BAD_REQUEST = 400


@app.route("/", defaults={'path': ''})
def serve(path):
    return send_from_directory(app.static_folder, 'index.html')


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/upload', methods=['POST'])
def upload_file():
    if request.method == 'POST':
        # check if the post request has the file part
        if 'file' not in request.files:
            flash('No file part')
            return {}
        file = request.files['file']
        # If the user does not select a file, the browser submits an
        # empty file without a filename.
        if file.filename == '':
            flash('No selected file')
            return {}
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            print(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            if not os.path.isdir(UPLOAD_FOLDER):
                os.makedirs(UPLOAD_FOLDER)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            return {}


@app.route('/login', methods=['POST'])
def login():
    if request.method == 'POST':
        username = request.args['username']
        return username


@app.route('/logout', methods=['POST'])
def logout():
    if request.method == 'POST':
        return ''


@app.route('/repositories', methods=['GET', 'DELETE'])
def repositories():
    if request.method == 'GET':
        username = request.args['username']
        return jsonify(get_repository_info(username=username))

    elif request.method == 'DELETE':
        username = request.args['username']
        repository_id = request.args['repository']
        delete_repository(repository_id=repository_id, username=username)
        return repository_id


@app.route('/repositories/local', methods=['POST'])
def add_local_repo():
    if request.method == 'POST':
        name = request.json['name']
        description = request.json['description']
        data_url = request.json['dataUrl']
        schema_url = request.json['schemaUrl']
        username = request.json['username']
        graph = import_data(data_url=data_url,
                            schema_url=schema_url)
        add_repository(repository_id=name, username=username, graph=graph,
                       description=description)

        return name


@app.route('/repositories/remote', methods=['POST'])
def add_remote_repo():
    if request.method == 'POST':
        name = request.json['name']
        endpoint = request.json['endpoint']
        username = request.json['username']
        description = request.json['description']

        add_repository(repository_id=name, username=username, endpoint=endpoint,
                       description=description)

        return name


@app.route('/sparql', methods=['GET'])
def run_query():
    if request.method == 'GET':
        repository_id = request.args['repository']
        query = request.args['query']
        username = request.args['username']

        repository = get_repository(repository_id=repository_id,
                                    username=username)

        return repository.run_query(query=query)


@app.route('/saved-queries', methods=['GET', 'POST', 'DELETE'])
def history():
    if request.method == 'GET':
        repository_id = request.args['repository']
        username = request.args['username']
        return jsonify(
            get_queries(repository_id=repository_id, username=username))

    elif request.method == 'POST':
        username = request.json['username']
        repository = request.json['repository']
        sparql = request.json['sparql']
        name = request.json['name']
        if name:
            save_query(repository_id=repository,
                       sparql=sparql,
                       name=name,
                       username=username)
        return name
    elif request.method == 'DELETE':
        username = request.args['username']
        repository_id = request.args['repository']
        return delete_all_queries(repository_id=repository_id,
                                  username=username)


@app.route('/dataset/classes', methods=['GET'])
def classes():
    if request.method == 'GET':
        username = request.args['username']
        repository_id = request.args['repository']
        repository = get_repository(repository_id=repository_id,
                                    username=username)
        result = run_query_file(repository=repository,
                                path=f'{QUERY_PATH}/all_classes.sparql')

        return [row[0] for row in result['data']]


@app.route('/dataset/class-hierarchy', methods=['GET'])
def class_hierarchy():
    if request.method == 'GET':
        username = request.args['username']
        repository_id = request.args['repository']
        repository = get_repository(repository_id=repository_id,
                                    username=username)
        result = run_query_file(repository=repository,
                                path=f'{QUERY_PATH}/class_hierarchy.sparql')

        header = ['subject', 'predicate', 'object']
        data = result['data']
        return jsonify({'header': header, 'data': data})


@app.route('/dataset/triplet-count', methods=['GET'])
def triplets():
    if request.method == 'GET':
        username = request.args['username']
        repository_id = request.args['repository']
        repository = get_repository(repository_id=repository_id,
                                    username=username)
        result = run_query_file(repository=repository,
                                path=f'{QUERY_PATH}/count_triplets.sparql')

        return result['data'][0][0]


@app.route('/dataset/all-types', methods=['GET'])
def all_types():
    if request.method == 'GET':
        username = request.args['username']
        repository_id = request.args['repository']
        repository = get_repository(repository_id=repository_id,
                                    username=username)
        result = run_query_file(repository=repository,
                                path=f'{QUERY_PATH}/all_types.sparql')

        return [row[0] for row in result['data']]


@app.route('/dataset/type', methods=['GET'])
def get_type():
    if request.method == 'GET':
        uri = request.args['uri']
        username = request.args['username']
        repository_id = request.args['repository']
        repository = get_repository(repository_id=repository_id,
                                    username=username)

        with open(f'{QUERY_PATH}/get_type.sparql', 'r') as query:
            result = repository.run_query(query=query.read().format(uri=uri))

        return [row[0] for row in result['data']]


@app.route('/dataset/type-properties', methods=['GET'])
def type_properties():
    if request.method == 'GET':
        rdf_type = request.args['type']
        username = request.args['username']
        repository_id = request.args['repository']
        repository = get_repository(repository_id=repository_id,
                                    username=username)
        with open(f'{QUERY_PATH}/type_properties.sparql', 'r') as query:
            result = repository.run_query(
                query=query.read().format(type=rdf_type))

        return [row[0] for row in result['data']]


@app.route('/dataset/meta-information', methods=['GET'])
def meta_information():
    if request.method == 'GET':
        uri = request.args['uri']
        username = request.args['username']
        repository_id = request.args['repository']
        repository = get_repository(repository_id=repository_id,
                                    username=username)
        with open(f'{QUERY_PATH}/meta_information.sparql', 'r') as query:
            result = repository.run_query(query=query.read().format(uri=uri))

        fields = result['header']
        values = result['data'][0]

        return jsonify(dict(zip(fields, values)))


@app.route('/dataset/outgoing-links', methods=['GET'])
def outgoing_links():
    if request.method == 'GET':
        uri = request.args['uri']
        username = request.args['username']
        repository_id = request.args['repository']
        repository = get_repository(repository_id=repository_id,
                                    username=username)
        with open(f'{QUERY_PATH}/outgoing_links.sparql', 'r') as query:
            result = repository.run_query(query=query.read().format(uri=uri))

        links = {}
        for [uri, count] in result['data']:
            links[uri] = int(count)

        return jsonify(links)


@app.route('/dataset/incoming-links', methods=['GET'])
def incoming_links():
    if request.method == 'GET':
        uri = request.args['uri']
        username = request.args['username']
        repository_id = request.args['repository']
        repository = get_repository(repository_id=repository_id,
                                    username=username)
        with open(f'{QUERY_PATH}/incoming_links.sparql', 'r') as query:
            result = repository.run_query(query=query.read().format(uri=uri))

        links = {}
        for [uri, count] in result['data']:
            links[uri] = int(count)

        return jsonify(links)


@app.route('/dataset/all-properties', methods=['GET'])
def all_properties():
    if request.method == 'GET':
        username = request.args['username']
        repository_id = request.args['repository']
        repository = get_repository(repository_id=repository_id,
                                    username=username)
        result = run_query_file(repository=repository,
                                path=f'{QUERY_PATH}/all_properties.sparql')

        return [row[0] for row in result['data']]


@app.route('/dataset/type-instances', methods=['GET'])
def type_instances():
    if request.method == 'GET':
        username = request.args['username']
        repository_id = request.args['repository']
        repository = get_repository(repository_id=repository_id,
                                    username=username)
        type_ = request.args['type']
        with open(f'{QUERY_PATH}/type_instances.sparql', 'r') as query:
            result = repository.run_query(query=query.read().format(type=type_))

        return [row[0] for row in result['data']]


@app.route('/dataset/property-values', methods=['GET'])
def property_values():
    if request.method == 'GET':
        username = request.args['username']
        repository_id = request.args['repository']
        repository = get_repository(repository_id=repository_id,
                                    username=username)
        uri = request.args['uri']
        prop_type = request.args['propType']
        with open(f'{QUERY_PATH}/property_values.sparql', 'r') as query:
            result = repository.run_query(
                query=query.read().format(uri=uri, prop_type=prop_type))

        return result['data']


@app.route('/analysis', methods=['GET'])
def analysis():
    if request.method == 'GET':
        username = request.args['username']
        query = request.args['query']
        repository_id = request.args['repository']
        repository = get_repository(repository_id=repository_id,
                                    username=username)
        return jsonify(
            query_analysis(query=query, repository=repository))


def get_region_query(region):
    query = []
    for name in region.split(','):
        short_name = region_short_name(name)
        if short_name != 'not found':
            query.append(short_name)
        else:
            query.append(name)

    return ', '.join(query)


def remove_last_comma(text):
    return ','.join(text.split(',')[:-1])


@app.route('/geo', methods=['GET'])
def geo():
    OK = 200
    if request.method == 'GET':
        MAP_API = 'https://nominatim.openstreetmap.org/search.php?q={query}' \
                  '&polygon_geojson=1&format=json'
        coordinates = None
        type_ = None
        if 'region' in request.args:
            region = request.args['region']
            query = get_region_query(region)
            while query:
                url = MAP_API.format(query=urllib.parse.quote(query, safe=""))
                response = requests.get(url)

                if response.status_code == OK:
                    polygons = [data
                                for data in response.json() if
                                data['type'] in (
                                    'city', 'country', 'continent',
                                    'administrative', 'town')]
                    if polygons:
                        coordinates = polygons[0]["geojson"]['coordinates']
                        type_ = polygons[0]["geojson"]['type']
                        return {'geoData': {'region': region, 'type': type_,
                                            'name': query,
                                            'coordinates': coordinates}}

                query = remove_last_comma(query)

            data = geo_json_data(region)
            if data:
                coordinates = data['geometry']['coordinates']
                type_ = data['geometry']['type']

            return {'geoData': {'region': region, 'type': type_, 'name': query,
                                'coordinates': coordinates}}


@app.route('/geo/valid', methods=['GET'])
def geographical_name():
    OK = 200
    if request.method == 'GET':
        MAP_API = 'https://nominatim.openstreetmap.org/search.php?q={query}' \
                  '&polygon_geojson=1&format=json'

        if 'text' in request.args:
            region = request.args['text']
            query = get_region_query(region)

            url = MAP_API.format(query=urllib.parse.quote(query, safe=""))
            response = requests.get(url)

            if response.status_code == OK:
                polygons = [data
                            for data in response.json() if
                            data['type'] in (
                                'city', 'country', 'continent',
                                'administrative', 'town')]
                if polygons:
                    return {'valid': True}

        return {'valid': False}


if __name__ == "__main__":
    if os.environ.get('BUILD') == 'development':
        app.run(debug=True, port=5000)
    elif os.environ.get('BUILD') == 'production':
        app.run(host='0.0.0.0')
