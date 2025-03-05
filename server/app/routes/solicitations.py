from flask import Blueprint, jsonify, request
from app.services.db import get_db_connection
from datetime import datetime
import urllib.parse

bp = Blueprint('solicitations', __name__, url_prefix='/api')

@bp.route('/solicitations', methods=['GET'])
def get_all_solicitations():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get query parameters
    limit = request.args.get('limit', default=None, type=int)
    offset = int(request.args.get('offset', default=0))
    agency = request.args.get('agency', default=None, type=str)
    
    query = "SELECT * FROM solicitations"
    params = []
    
    if agency:
        query += " WHERE agency = ?"
        params.append(agency)
    
    # Only add LIMIT if specified
    if limit is not None:
        query += f" LIMIT {limit} OFFSET {offset}"
    elif offset > 0:
        # If offset is provided without limit, use a large limit
        query += f" LIMIT 1000000 OFFSET {offset}"
    
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
def search_solicitations():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    search_term = request.args.get('q', default='', type=str)
    limit = request.args.get('limit', default=None, type=int)
    offset = int(request.args.get('offset', default=0))
    
    if not search_term:
        return jsonify({'error': 'No search term provided'}), 400
    
    # Search across multiple tables and fields
    query = """
        SELECT DISTINCT s.*, t.topic_title, t.topic_description
        FROM solicitations s
        LEFT JOIN topics t ON s.solicitation_id = t.solicitation_id
        WHERE 
            s.solicitation_title LIKE ? OR
            s.solicitation_number LIKE ? OR
            t.topic_title LIKE ? OR
            t.topic_description LIKE ?
    """
    params = [f'%{search_term}%'] * 4
    
    # Only add LIMIT if specified
    if limit is not None:
        query += " LIMIT ? OFFSET ?"
        params.extend([limit, offset])
    elif offset > 0:
        # If offset is provided without limit, use a large limit
        query += " LIMIT 1000000 OFFSET ?"
        params.append(offset)
    
    cursor.execute(query, params)
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

@bp.route('/topics', methods=['GET'])
def get_all_topics():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get query parameters
    limit = request.args.get('limit', default=None, type=int)
    offset = int(request.args.get('offset', default=0))
    
    # Get topics with their associated solicitation info
    query = """
        SELECT t.*, s.agency, s.solicitation_number, s.solicitation_title
        FROM topics t
        LEFT JOIN solicitations s ON t.solicitation_id = s.solicitation_id
    """
    params = []
    
    # Only add LIMIT if specified
    if limit is not None:
        query += " LIMIT ? OFFSET ?"
        params.extend([limit, offset])
    elif offset > 0:
        # If offset is provided without limit, use a large limit
        query += " LIMIT 1000000 OFFSET ?"
        params.append(offset)
    
    cursor.execute(query, params)
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

@bp.route('/solicitations/<int:solicitation_id>/topics', methods=['GET'])
def get_topics_from_solicitation(solicitation_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM topics 
        WHERE solicitation_id = ?
    """, [solicitation_id])
    
    topics = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(topics)

#use both topic number and solicitation id to get subtopics to ensure we get the correct subtopics
@bp.route('/subtopics/<path:topic_number>/<int:solicitation_id>', methods=['GET'])
def get_subtopics(topic_number, solicitation_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Decode the URL-encoded topic number
    decoded_topic_number = urllib.parse.unquote(topic_number)
    
    cursor.execute("""
        SELECT * FROM subtopics 
        WHERE topic_number = ? AND solicitation_id = ?
    """, [decoded_topic_number, solicitation_id])
    
    subtopics = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(subtopics)

@bp.route('/topics/open', methods=['GET'])
def get_open_topics():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    limit = request.args.get('limit', default=None, type=int)
    offset = int(request.args.get('offset', default=0))
    
    # Format the current date to match the database format (YYYY/MM/DD)
    current_date = datetime.now().strftime('%Y/%m/%d')
    
    query = """
        SELECT topic_number, topic_title, topic_description, 
               topic_open_date, topic_closed_date, branch, solicitation_id
        FROM topics
        WHERE topic_open_date <= ? 
        AND (topic_closed_date >= ? OR topic_closed_date IS NULL)
        ORDER BY topic_open_date DESC
    """
    params = [current_date, current_date]
    
    # Only add LIMIT if specified
    if limit is not None:
        query += " LIMIT ? OFFSET ?"
        params.extend([limit, offset])
    elif offset > 0:
        # If offset is provided without limit, use a large limit
        query += " LIMIT 1000000 OFFSET ?"
        params.append(offset)
    
    cursor.execute(query, params)
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
    
    limit = request.args.get('limit', default=None, type=int)
    offset = int(request.args.get('offset', default=0))
    
    # Format the current date to match the database format (YYYY/MM/DD)
    current_date = datetime.now().strftime('%Y/%m/%d')
    
    query = """
        SELECT topic_number, topic_title, topic_description, 
               topic_open_date, topic_closed_date, branch, solicitation_id
        FROM topics
        WHERE topic_closed_date < ?
        ORDER BY topic_closed_date DESC
    """
    params = [current_date]
    
    # Only add LIMIT if specified
    if limit is not None:
        query += " LIMIT ? OFFSET ?"
        params.extend([limit, offset])
    elif offset > 0:
        # If offset is provided without limit, use a large limit
        query += " LIMIT 1000000 OFFSET ?"
        params.append(offset)
    
    cursor.execute(query, params)
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
    limit = request.args.get('limit', default=None, type=int)
    offset = int(request.args.get('offset', default=0))
    
    if not search_term:
        return jsonify({'error': 'No search term provided'}), 400
    
    # Search across topic fields
    query = """
        SELECT t.*, s.agency, s.solicitation_number, s.solicitation_title
        FROM topics t
        LEFT JOIN solicitations s ON t.solicitation_id = s.solicitation_id
        WHERE 
            t.topic_title LIKE ? OR
            t.topic_description LIKE ? OR
            t.topic_number LIKE ? OR
            t.branch LIKE ?
        ORDER BY t.topic_open_date DESC
    """
    params = [f'%{search_term}%'] * 4
    
    # Only add LIMIT if specified
    if limit is not None:
        query += " LIMIT ? OFFSET ?"
        params.extend([limit, offset])
    elif offset > 0:
        # If offset is provided without limit, use a large limit
        query += " LIMIT 1000000 OFFSET ?"
        params.append(offset)
    
    cursor.execute(query, params)
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

@bp.route('/topics/<path:topic_number>/<int:solicitation_id>', methods=['GET'])
def get_topic(topic_number, solicitation_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Decode the URL-encoded topic number
        decoded_topic_number = urllib.parse.unquote(topic_number)
        
        # Get the topic and associated solicitation info using both keys
        cursor.execute("""
            SELECT t.*, s.agency, s.solicitation_number, s.solicitation_title
            FROM topics t
            LEFT JOIN solicitations s ON t.solicitation_id = s.solicitation_id
            WHERE t.topic_number = ? AND t.solicitation_id = ?
        """, [decoded_topic_number, solicitation_id])
        
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Topic not found'}), 404
            
        topic = dict(row)
        
        # Get associated subtopics
        cursor.execute("""
            SELECT 
                subtopic_id,
                subtopic_number,
                subtopic_title,
                subtopic_description
            FROM subtopics 
            WHERE topic_number = ? AND solicitation_id = ?
            ORDER BY subtopic_number
        """, [decoded_topic_number, solicitation_id])
        
        subtopics = [dict(row) for row in cursor.fetchall()]
        topic['subtopics'] = subtopics
        
        return jsonify(topic)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
