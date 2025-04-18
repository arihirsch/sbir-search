from flask import Blueprint, jsonify, request
from app.services.db import get_db_connection, get_db_cursor
from datetime import datetime
import urllib.parse

bp = Blueprint('solicitations', __name__, url_prefix='/api')

@bp.route('/solicitations', methods=['GET'])
def get_all_solicitations():
    cursor = get_db_cursor("db1")  # Use db1 schema for solicitations
    
    # Get query parameters
    limit = request.args.get('limit', default=None, type=int)
    offset = int(request.args.get('offset', default=0))
    agency = request.args.get('agency', default=None, type=str)
    
    query = "SELECT * FROM solicitations"
    params = []
    
    if agency:
        query += " WHERE agency = %s"
        params.append(agency)
    
    # Only add LIMIT if specified
    if limit is not None:
        query += " LIMIT %s OFFSET %s"
        params.extend([limit, offset])
    elif offset > 0:
        # If offset is provided without limit, use a large limit
        query += " LIMIT 1000000 OFFSET %s"
        params.append(offset)
    
    cursor.execute(query, params)
    solicitations = [dict(row) for row in cursor.fetchall()]
    
    # Get total count
    count_query = "SELECT COUNT(*) FROM solicitations"
    if agency:
        count_query += " WHERE agency = %s"
        cursor.execute(count_query, [agency])
    else:
        cursor.execute(count_query)
    total_count = cursor.fetchone()[0]
    
    return jsonify({
        'data': solicitations,
        'total': total_count,
        'limit': limit,
        'offset': offset
    })

@bp.route('/solicitations/search', methods=['GET'])
def search_solicitations():
    cursor = get_db_cursor("db1")  # Use db1 schema for solicitations
    
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
            s.solicitation_title LIKE %s OR
            s.solicitation_number LIKE %s OR
            t.topic_title LIKE %s OR
            t.topic_description LIKE %s
    """
    params = [f'%{search_term}%'] * 4
    
    # Only add LIMIT if specified
    if limit is not None:
        query += " LIMIT %s OFFSET %s"
        params.extend([limit, offset])
    elif offset > 0:
        # If offset is provided without limit, use a large limit
        query += " LIMIT 1000000 OFFSET %s"
        params.append(offset)
    
    cursor.execute(query, params)
    results = [dict(row) for row in cursor.fetchall()]
    
    return jsonify({
        'data': results,
        'limit': limit,
        'offset': offset
    })

@bp.route('/solicitations/<int:solicitation_id>', methods=['GET'])
def get_solicitation(solicitation_id):
    cursor = get_db_cursor("db1")  # Use db1 schema for solicitations
    
    # Get the solicitation
    cursor.execute("""
        SELECT * FROM solicitations 
        WHERE solicitation_id = %s
    """, [solicitation_id])
    
    row = cursor.fetchone()
    solicitation = dict(row) if row else None
    
    if not solicitation:
        return jsonify({'error': 'Solicitation not found'}), 404
    
    # Get associated topics
    cursor.execute("""
        SELECT * FROM topics 
        WHERE solicitation_id = %s
    """, [solicitation_id])
    topics = [dict(row) for row in cursor.fetchall()]
    
    # Add topics to the response
    solicitation['topics'] = topics
    
    return jsonify(solicitation)

@bp.route('/topics', methods=['GET'])
def get_all_topics():
    cursor = get_db_cursor("db1")  # Use db1 schema for topics
    
    # Get query parameters
    limit = request.args.get('limit', default=50, type=int)
    offset = int(request.args.get('offset', default=0))
    status = request.args.get('status', default=None, type=str)
    phase = request.args.get('phase', default=None, type=str)
    program = request.args.get('program', default=None, type=str)
    agency = request.args.get('agency', default=None, type=str)
    year = request.args.get('year', default=None, type=str)
    search_query = request.args.get('q', default=None, type=str)
    
    # Format the current date to match the database format (YYYY-MM-DD)
    current_date = datetime.now().strftime('%Y-%m-%d')
    
    # Base query with joins and window function for count
    query = """
        SELECT t.*, s.agency, s.solicitation_number, s.solicitation_title, s.branch as solicitation_branch,
               COUNT(*) OVER() as total_count
        FROM topics t
        LEFT JOIN solicitations s ON t.solicitation_id = s.solicitation_id
        WHERE 1=1
    """
    params = []
    
    # Apply status filter
    if status == 'open':
        query += """ AND (t.topic_open_date <= %s 
                    AND (t.topic_closed_date >= %s OR t.topic_closed_date IS NULL))"""
        params.extend([current_date, current_date])
    elif status == 'closed':
        query += " AND t.topic_closed_date < %s"
        params.append(current_date)
    elif status == 'prerelease':
        query += " AND t.topic_open_date > %s"
        params.append(current_date)
    
    # Apply phase filter
    if phase == 'phase1':
        query += " AND (s.phase = %s OR s.phase = %s)"
        params.extend(['Phase I', 'BOTH'])
    elif phase == 'phase2':
        query += " AND (s.phase = %s OR s.phase = %s)"
        params.extend(['Phase II', 'BOTH'])
    elif phase == 'both':
        query += " AND s.phase = %s"
        params.append('BOTH')
    
    # Apply program filter
    if program == 'sbir':
        query += " AND (s.program = %s OR s.program = %s)"
        params.extend(['SBIR', 'BOTH'])
    elif program == 'sttr':
        query += " AND (s.program = %s OR s.program = %s)"
        params.extend(['STTR', 'BOTH'])
    elif program == 'both':
        query += " AND s.program = %s"
        params.append('BOTH')
    
    # Apply agency filter
    if agency:
        query += " AND s.agency = %s"
        params.append(agency)

    # Apply year filter
    if year:
        query += " AND EXTRACT(YEAR FROM t.topic_open_date) = %s"
        params.append(year)
    
    # If there's a search query, use vector similarity
    if search_query:
        print("search_query", search_query)
        # Generate embedding for the query
        from app.routes.llmsearch import get_query_embedding
        query_embedding = get_query_embedding(search_query)
        embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
        
        # Add vector similarity to the query with threshold
        query += """
            AND (t.embedding <=> %s::vector) < 0.85
            ORDER BY t.embedding <=> %s::vector
        """
        params.extend([embedding_str, embedding_str])
    else:
        # Default ordering by topic open date
        query += " ORDER BY t.topic_open_date DESC"
    
    # Add pagination
    query += " LIMIT %s OFFSET %s"
    params.extend([limit, offset])
    
    cursor.execute("SET search_path TO extensions, public, db1, db2, db3;")    
    cursor.execute("SET ivfflat.probes = 5;")
    
    cursor.execute(query, params)
    results = cursor.fetchall()
    
    # Extract the total count from the first row (if results exist)
    total_count = results[0]['total_count'] if results else 0
    
    # Convert rows to dictionaries and remove the total_count field
    topics = []
    for row in results:
        topic_dict = dict(row)
        # Remove the total_count field from each row
        if 'total_count' in topic_dict:
            del topic_dict['total_count']
        topics.append(topic_dict)
    
    # Generate summary if there's a search query
    summary = None
    if search_query and topics:
        from app.routes.llmsearch import generate_summary
        # Create filter context
        filters = {
            'status': status,
            'phase': phase,
            'program': program,
            'agency': agency
        }
        summary = generate_summary(search_query, topics[:10], "topics", filters)
        print("topics", topics[0]['topic_title'])
    
    return jsonify({
        'data': topics,
        'database': 'db1',
        'total': total_count,
        'limit': limit,
        'offset': offset,
        'summary': summary
    })

@bp.route('/solicitations/<int:solicitation_id>/topics', methods=['GET'])
def get_topics_from_solicitation(solicitation_id):
    cursor = get_db_cursor("db1")  # Use db1 schema for topics
    
    cursor.execute("""
        SELECT * FROM topics 
        WHERE solicitation_id = %s
    """, [solicitation_id])
    
    topics = [dict(row) for row in cursor.fetchall()]
    
    return jsonify(topics)

#use both topic number and solicitation id to get subtopics to ensure we get the correct subtopics
@bp.route('/subtopics/<path:topic_number>/<int:solicitation_id>', methods=['GET'])
def get_subtopics(topic_number, solicitation_id):
    cursor = get_db_cursor("db1")  # Use db1 schema for subtopics
    
    # Decode the URL-encoded topic number
    decoded_topic_number = urllib.parse.unquote(topic_number)
    
    cursor.execute("""
        SELECT * FROM subtopics 
        WHERE topic_number = %s AND solicitation_id = %s
    """, [decoded_topic_number, solicitation_id])
    
    subtopics = [dict(row) for row in cursor.fetchall()]
    
    return jsonify(subtopics)

@bp.route('/topics/search', methods=['GET'])
def search_topics():
    cursor = get_db_cursor("db1")  # Use db1 schema for topics
    
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
            t.topic_title LIKE %s OR
            t.topic_description LIKE %s OR
            t.topic_number LIKE %s OR
            t.branch LIKE %s
        ORDER BY t.topic_open_date DESC
    """
    params = [f'%{search_term}%'] * 4
    
    # Only add LIMIT if specified
    if limit is not None:
        query += " LIMIT %s OFFSET %s"
        params.extend([limit, offset])
    elif offset > 0:
        # If offset is provided without limit, use a large limit
        query += " LIMIT 1000000 OFFSET %s"
        params.append(offset)
    
    cursor.execute(query, params)
    results = [dict(row) for row in cursor.fetchall()]
    
    # Get total count for pagination
    cursor.execute("""
        SELECT COUNT(*) 
        FROM topics t
        WHERE 
            t.topic_title LIKE %s OR
            t.topic_description LIKE %s OR
            t.topic_number LIKE %s OR
            t.branch LIKE %s
    """, [f'%{search_term}%'] * 4)
    
    total_count = cursor.fetchone()[0]
    
    return jsonify({
        'data': results,
        'total': total_count,
        'limit': limit,
        'offset': offset
    })

@bp.route('/topics/<path:topic_number>/<int:solicitation_id>', methods=['GET'])
def get_topic(topic_number, solicitation_id):
    cursor = get_db_cursor("db1")  # Use db1 schema for topics
    
    try:
        # Decode the URL-encoded topic number
        decoded_topic_number = urllib.parse.unquote(topic_number)
        
        # Get the topic and associated solicitation info using both keys
        cursor.execute("""
            SELECT t.*, s.agency, s.solicitation_number, s.solicitation_title
            FROM topics t
            LEFT JOIN solicitations s ON t.solicitation_id = s.solicitation_id
            WHERE t.topic_number = %s AND t.solicitation_id = %s
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
            WHERE topic_number = %s AND solicitation_id = %s
            ORDER BY subtopic_number
        """, [decoded_topic_number, solicitation_id])
        
        subtopics = [dict(row) for row in cursor.fetchall()]
        topic['subtopics'] = subtopics
        
        return jsonify(topic)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
