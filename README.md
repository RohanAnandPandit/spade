# SPADE

SPADE (SPARQL Analysis and Data Explorer) is a tool to visualise the semantic data using the RDF/OWL schemas.

The frontend for the web app has been built using React/TypeScript and the backend has been built using Python with a Flask server for the application.

The frontend requires the BACKEND_API environment variable. This will be ```localhost:5000``` when running the Flask server locally. Add this in the .env file in the frontend directory.

Delete any existing ```build/``` folder in ```frontend/``` run 
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
```

The app uses the database ```dataVisualiser``` uses two collections: ```queries``` and ```repositories```. There is also a ```geoData``` collection for GeoJSON data about countries and cities.

You can download an RDF database such as GraphDB if you want to try specific datasets. The GraphDB application must be running if you are using its REST API.

Now you can run ```app.py``` to start the Flask server which will serve the application and API at ```localhost:5000```. Alternatively you can run the backend and frontend separately if you want to try making changes yourself.

You can read the full report (https://drive.google.com/file/d/15Ye-3h-WNre-DRcqaEtCioe7PnCrBMZp/view?usp=sharing) for the project for further details . There is also a Heroku application set up that may be deactivated.