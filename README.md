# SPADE

SPADE (SPARQL Analysis and Data Explorer) is a tool to visualise semantic data using the RDF/OWL schemas.

The frontend for the web app has been built using React/TypeScript and the backend has been built using Python with a Flask server for the application.

The frontend requires the ```BACKEND_API``` environment variable. This will be ```localhost:5000``` when running the Flask server locally. Add this in the .env file in the frontend directory.

Delete any existing ```build/``` folder in ```frontend/``` and run 
```
yarn build
```

The backend uses a MongoDB database. You can install MongoDB from their official website as well as the MongoDBCompass application. 

You can add a .env file in the root folder using this template.
```
BUILD=
MONGODB_USERNAME=
MONGODB_PASSWORD=
MONGODB_URL=
TEST_ENDPOINT=
FLASK_SECRET_KEY=
```
The build can be development or production. The MongoDB username and password need to be configured using your MongoDB account on the website. The ```TEST_ENDPOINT``` can be left empty if you do not have Mondial database running locally.


The app uses the database ```dataVisualiserDB``` uses two collections: ```queries``` and ```repositories```. There is also a ```geoData``` collection for GeoJSON data about countries and cities.

You can download the GraphDB application if you want to try specific datasets. The GraphDB application must be running if you are using its REST API. You can create the Mondial repository by downloading and importing ```mondial.n3``` and ```mondial-meta.n3``` into the repository. The files can be downloaded links on the website  (https://www.dbis.informatik.uni-goettingen.de/Mondial/).

Now you can run ```app.py``` to start the Flask server which will serve the application and API at ```localhost:5000```. Alternatively you can run the backend and frontend separately if you want to try making changes yourself.

You can read the full report (bit.ly/3rV4jm) for the project for further details. There is also a Heroku application set up which is not currently active but can be made available on request.

Feel free to contact me if you need any help or would like to suggest improvements to the project.