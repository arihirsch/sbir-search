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

DB_PATH = "solicitations.db"  # Adjust this path as needed

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # This enables column access by name
    return conn

@app.route('/api/solicitations', methods=['GET'])
def get_solicitations():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get query parameters
    limit = request.args.get('limit', default=50, type=int)
    offset = request.args.get('offset', default=0, type=int)
    agency = request.args.get('agency', default=None, type=str)
    
    query = "SELECT * FROM solicitations"
    params = []
    
    if agency:
        query += " WHERE agency = ?"
        params.append(agency)
    
    query += " LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    cursor.execute(query, params)
    solicitations = [dict(row) for row in cursor.fetchall()]
    
    # Get total count
    count_query = "SELECT COUNT(*) FROM solicitations"
    if agency:
        count_query += " WHERE agency = ?"
        cursor.execute(count_query, [agency])
    else:
        cursor.execute(count_query)
    total_count = cursor.fetchone()[0]
    
    conn.close()
    
    return jsonify({
        'data': solicitations,
        'total': total_count,
        'limit': limit,
        'offset': offset
    })

@app.route('/api/topics/<int:solicitation_id>', methods=['GET'])
def get_topics(solicitation_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM topics 
        WHERE solicitation_id = ?
    """, [solicitation_id])
    
    topics = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(topics)

@app.route('/api/subtopics/<string:topic_number>/<int:solicitation_id>', methods=['GET'])
def get_subtopics(topic_number, solicitation_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM subtopics 
        WHERE topic_number = ? AND solicitation_id = ?
    """, [topic_number, solicitation_id])
    
    subtopics = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(subtopics)

@app.route('/api/search', methods=['GET'])
def search():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    search_term = request.args.get('q', default='', type=str)
    limit = request.args.get('limit', default=50, type=int)
    offset = request.args.get('offset', default=0, type=int)
    
    if not search_term:
        return jsonify({'error': 'No search term provided'}), 400
    
    # Search across multiple tables and fields
    cursor.execute("""
        SELECT DISTINCT s.*, t.topic_title, t.topic_description
        FROM solicitations s
        LEFT JOIN topics t ON s.solicitation_id = t.solicitation_id
        WHERE 
            s.solicitation_title LIKE ? OR
            s.solicitation_number LIKE ? OR
            t.topic_title LIKE ? OR
            t.topic_description LIKE ?
        LIMIT ? OFFSET ?
    """, [f'%{search_term}%'] * 4 + [limit, offset])
    
    results = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({
        'data': results,
        'limit': limit,
        'offset': offset
    })

@app.route('/api/stats', methods=['GET'])
def get_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get counts by agency
    cursor.execute("""
        SELECT agency, COUNT(*) as count 
        FROM solicitations 
        GROUP BY agency
    """)
    agency_counts = dict(cursor.fetchall())
    
    # Get total counts
    cursor.execute("SELECT COUNT(*) FROM solicitations")
    total_solicitations = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM topics")
    total_topics = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM subtopics")
    total_subtopics = cursor.fetchone()[0]
    
    conn.close()
    
    return jsonify({
        'total_solicitations': total_solicitations,
        'total_topics': total_topics,
        'total_subtopics': total_subtopics,
        'by_agency': agency_counts
    })

if __name__ == '__main__':
    app.run(debug=True) 