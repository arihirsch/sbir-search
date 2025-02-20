from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://localhost:5000", "http://127.0.0.1:5000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

DB_PATH = "solicitations.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # This enables column access by name
    return conn

@app.route('/api/solicitations', methods=['GET']) #tested
def get_all_solicitations():
    

@app.route('/api/solicitations/<int:solicitation_id>', methods=['GET']) #tested
def get_solicitation(solicitation_id):
    

@app.route('/api/all-topics', methods=['GET']) #tested
def get_all_topics():
    
@app.route('/api/topics/<int:solicitation_id>', methods=['GET']) #tested
def get_topics(solicitation_id):
    

@app.route('/api/subtopics/<string:topic_number>/<int:solicitation_id>', methods=['GET']) #tested
def get_subtopics(topic_number, solicitation_id):
    
@app.route('/api/search', methods=['GET']) #tested
def search():
    

@app.route('/api/stats', methods=['GET']) #tested
def get_stats():
    

if __name__ == '__main__':
    app.run(debug=True) 