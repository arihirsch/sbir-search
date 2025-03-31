from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://localhost:3000",
                "http://localhost:5000",
                "http://127.0.0.1:5000",
                "http://localhost:5173",
                "https://*.vercel.app",
                "https://sbir-search.vercel.app",
                "https://sbir-search-vert.vercel.app",
                "https://www.sbirspy.com"
            ],
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type"],
        }
    })

    # Register blueprints
    from app.routes import solicitations, analytics, awards, companies, llmsearch, root
    app.register_blueprint(solicitations.bp)
    app.register_blueprint(analytics.bp)
    app.register_blueprint(awards.bp)
    app.register_blueprint(companies.bp)
    app.register_blueprint(llmsearch.bp)
    app.register_blueprint(root.bp)
    
    # Register database close function
    from app.services.db import close_db
    app.teardown_appcontext(close_db)

    return app 