from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://localhost:5000", "http://127.0.0.1:5000"],
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type"]
        }
    })

    # Register blueprints
    from app.routes import solicitations, analytics
    app.register_blueprint(solicitations.bp)
    app.register_blueprint(analytics.bp)

    return app 