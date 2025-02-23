# SBIR Search Application

## Project Description

A Flask-based web application for searching and analyzing Small Business Innovation Research (SBIR) solicitations. This application provides features for searching through SBIR solicitations and viewing analytics related to SBIR data.

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sbir-search
```

2. Create a virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
```

3. Install the required packages:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration values
```

## Project Structure

```
.
├── main.py                 # Application entry point
├── app/                    # Main application package
│   ├── __init__.py        # Flask application initialization
│   ├── routes/            # Route definitions
│   │   ├── analytics.py   # Analytics-related routes
│   │   └── solicitations.py # Solicitation-related routes
│   └── services/          # Business logic and services
│       └── db.py          # Database connection and queries
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## Usage

1. Start the application:
```bash
python main.py
```

2. Open your web browser and navigate to:
```
http://localhost:5000
```

### Available Features:
- Search SBIR solicitations
- View analytics and statistics
- Filter and sort results
- Export data (if applicable)

## Development

### Setting Up Development Environment

1. Install development dependencies:
```bash
pip install -r requirements-dev.txt
```

2. Configure pre-commit hooks:
```bash
pre-commit install
```

### Running Tests
```bash
pytest
```

### Code Style
This project follows PEP 8 style guidelines. Run code formatting with:
```bash
black .
flake8 .
```

### Making Contributions
1. Create a new branch for your feature
2. Make your changes
3. Run tests
4. Submit a pull request

## License

[Insert License Information]

