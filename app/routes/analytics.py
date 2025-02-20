from flask import Blueprint, jsonify, request
from app.services.db import get_db_connection

bp = Blueprint('analytics', __name__, url_prefix='/api')

@bp.route('/search', methods=['GET'])
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

@bp.route('/stats', methods=['GET'])
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