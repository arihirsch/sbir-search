from flask import Blueprint, jsonify, request
from app.services.db import get_db_connection

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
