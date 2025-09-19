# SPADE (SPARQL Analysis and Data Explorer)

SPADE is a powerful tool for visualizing semantic data using RDF/OWL schemas. It provides an intuitive interface to explore and analyze semantic web data through a modern web application.

## Features

- Interactive visualization of RDF/OWL schemas
- SPARQL query interface
- Real-time data exploration
- Support for multiple data sources including GraphDB
- Geographic data visualization

## Tech Stack

### Frontend
- React with TypeScript
- Modern UI components
- Interactive data visualization

### Backend
- Python with Flask
- MongoDB for data storage
- SPARQL endpoint integration
- RESTful API

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- Python 3.8+
- MongoDB
- Yarn package manager
- GraphDB (optional, for specific datasets)

### Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd schema-and-data-visualiser
   ```

2. **Set up the backend**
   ```bash
   # Create and activate a virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   
   # Install Python dependencies
   pip install -r requirements.txt
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   yarn install
   ```

### Configuration

1. **Backend Configuration**
   Create a `.env` file in the root directory with the following variables:
   ```env
   BUILD=development  # or 'production'
   MONGODB_USERNAME=your_username
   MONGODB_PASSWORD=your_password
   MONGODB_URL=your_mongodb_connection_string
   TEST_ENDPOINT=  # Optional: leave empty if not using Mondial database locally
   FLASK_SECRET_KEY=your_secret_key
   ```

2. **Frontend Configuration**
   Create a `.env` file in the `frontend` directory:
   ```env
   REACT_APP_BACKEND_API=http://localhost:5000
   ```

### Database Setup

The application uses MongoDB with the following collections:
- `queries`: Stores saved SPARQL queries
- `repositories`: Manages data repositories
- `geoData`: Contains GeoJSON data for countries and cities

For GraphDB integration (optional):
1. Download and install GraphDB
2. Create a new repository
3. Import `mondial.n3` and `mondial-meta.n3` files (available at [Mondial Database](https://www.dbis.informatik.uni-goettingen.de/Mondial/))

## Running the Application

### Development Mode

1. **Start the backend**
   ```bash
   # In the root directory
   python app.py
   ```

2. **Start the frontend**
   ```bash
   # In the frontend directory
   yarn start
   ```
   The application will be available at `http://localhost:3000`

### Production Build

1. Build the frontend:
   ```bash
   cd frontend
   rm -rf build  # Remove existing build if any
   yarn build
   ```

2. The Flask server will serve the frontend build when running `app.py`

## Project Structure

```
schema-and-data-visualiser/
├── backend/               # Backend Python code
│   ├── queries/          # SPARQL query templates
│   ├── tests/            # Backend tests
│   ├── __init__.py
│   ├── analysis.py       # Data analysis logic
│   ├── db.py            # Database operations
│   └── ...
├── frontend/             # Frontend React application
│   ├── public/           # Static files
│   └── src/              # Source code
├── .env                  # Environment variables
├── app.py               # Main Flask application
└── requirements.txt     # Python dependencies
```

## Deployment

The application can be deployed to Heroku or similar platforms. A Heroku configuration is already set up in the repository.


## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Contact

For any questions or suggestions, please contact the project maintainer.

