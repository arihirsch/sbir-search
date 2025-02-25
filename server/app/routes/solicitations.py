from flask import Blueprint, jsonify, request
from app.services.db import get_db_connection
from datetime import datetime

bp = Blueprint('solicitations', __name__, url_prefix='/api')

@bp.route('/solicitations', methods=['GET'])
def get_all_solicitations():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get query parameters
    limit = int(request.args.get('limit', default=50))
    offset = int(request.args.get('offset', default=0))
    agency = request.args.get('agency', default=None, type=str)
    
    query = "SELECT * FROM solicitations"
    params = []
    
    if agency:
        query += " WHERE agency = ?"
        params.append(agency)
    
    query += f" LIMIT {limit} OFFSET {offset}"
    
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

@bp.route('/solicitations/search', methods=['GET'])
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

@bp.route('/solicitations/<int:solicitation_id>', methods=['GET'])
def get_solicitation(solicitation_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get the solicitation
    cursor.execute("""
        SELECT * FROM solicitations 
        WHERE solicitation_id = ?
    """, [solicitation_id])
    
    row = cursor.fetchone()
    solicitation = dict(row) if row else None
    
    if not solicitation:
        conn.close()
        return jsonify({'error': 'Solicitation not found'}), 404
    
    # Get associated topics
    cursor.execute("""
        SELECT * FROM topics 
        WHERE solicitation_id = ?
    """, [solicitation_id])
    topics = [dict(row) for row in cursor.fetchall()]
    
    # Add topics to the response
    solicitation['topics'] = topics
    
    conn.close()
    
    return jsonify(solicitation)

@bp.route('/all-topics', methods=['GET'])
def get_all_topics():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get query parameters
    limit = int(request.args.get('limit', default=50))
    offset = int(request.args.get('offset', default=0))
    
    # Get topics with their associated solicitation info
    # not sure if we want to add extra info here
    cursor.execute("""
        SELECT t.*, s.agency, s.solicitation_number, s.solicitation_title
        FROM topics t
        LEFT JOIN solicitations s ON t.solicitation_id = s.solicitation_id
        LIMIT ? OFFSET ?
    """, [limit, offset])
    
    topics = [dict(row) for row in cursor.fetchall()]
    
    # Get total count
    cursor.execute("SELECT COUNT(*) FROM topics")
    total_count = cursor.fetchone()[0]
    
    conn.close()
    
    return jsonify({
        'data': topics,
        'total': total_count,
        'limit': limit,
        'offset': offset
    })


@bp.route('/topics/<int:solicitation_id>', methods=['GET'])
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

@bp.route('/subtopics/<string:topic_number>/<int:solicitation_id>', methods=['GET'])
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

@bp.route('/topics/open', methods=['GET'])
def get_open_topics():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    limit = int(request.args.get('limit', default=50))
    offset = int(request.args.get('offset', default=0))
    current_date = datetime.now().strftime('%Y-%m-%d')
    
    cursor.execute("""
        SELECT topic_number, topic_title, topic_description, 
               topic_open_date, topic_closed_date, branch, solicitation_id
        FROM topics
        WHERE topic_open_date <= ? 
        AND (topic_closed_date >= ? OR topic_closed_date IS NULL)
        ORDER BY topic_open_date DESC
        LIMIT ? OFFSET ?
    """, [current_date, current_date, limit, offset])
    
    results = [dict(row) for row in cursor.fetchall()]
    
    return jsonify({
        'data': results,
        'limit': limit,
        'offset': offset
    })

@bp.route('/topics/closed', methods=['GET'])
def get_closed_topics():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    limit = int(request.args.get('limit', default=50))
    offset = int(request.args.get('offset', default=0))
    current_date = datetime.now().strftime('%Y-%m-%d')
    
    cursor.execute("""
        SELECT topic_number, topic_title, topic_description, 
               topic_open_date, topic_closed_date, branch, solicitation_id
        FROM topics
        WHERE topic_closed_date < ?
        ORDER BY topic_closed_date DESC
        LIMIT ? OFFSET ?
    """, [current_date, limit, offset])
    
    results = [dict(row) for row in cursor.fetchall()]
    
    return jsonify({
        'data': results,
        'limit': limit,
        'offset': offset
    })

@bp.route('/topics/search', methods=['GET'])
def search_topics():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    search_term = request.args.get('q', default='', type=str)
    limit = request.args.get('limit', default=50, type=int)
    offset = request.args.get('offset', default=0, type=int)
    
    if not search_term:
        return jsonify({'error': 'No search term provided'}), 400
    
    # Search across topic fields
    cursor.execute("""
        SELECT t.*, s.agency, s.solicitation_number, s.solicitation_title
        FROM topics t
        LEFT JOIN solicitations s ON t.solicitation_id = s.solicitation_id
        WHERE 
            t.topic_title LIKE ? OR
            t.topic_description LIKE ? OR
            t.topic_number LIKE ? OR
            t.branch LIKE ?
        ORDER BY t.topic_open_date DESC
        LIMIT ? OFFSET ?
    """, [f'%{search_term}%'] * 4 + [limit, offset])
    
    results = [dict(row) for row in cursor.fetchall()]
    
    # Get total count for pagination
    cursor.execute("""
        SELECT COUNT(*) 
        FROM topics t
        WHERE 
            t.topic_title LIKE ? OR
            t.topic_description LIKE ? OR
            t.topic_number LIKE ? OR
            t.branch LIKE ?
    """, [f'%{search_term}%'] * 4)
    
    total_count = cursor.fetchone()[0]
    
    conn.close()
    
    return jsonify({
        'data': results,
        'total': total_count,
        'limit': limit,
        'offset': offset
    })
