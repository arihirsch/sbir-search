from flask import Blueprint, jsonify, request
from app.services.db import get_db_connection

bp = Blueprint('awards', __name__, url_prefix='/api')

@bp.route('/awards', methods=['GET'])
def get_all_awards():
    conn = get_db_connection(db_name="awards")
    cursor = conn.cursor()
    
    # Get query parameters
    limit = request.args.get('limit', default=None, type=int)
    offset = int(request.args.get('offset', default=0))
    agency = request.args.get('agency', default=None, type=str)
    program = request.args.get('program', default=None, type=str)
    phase = request.args.get('phase', default=None, type=str)
    
    # Base query with window function for count
    query = """
        SELECT *, COUNT(*) OVER() as total_count
        FROM awards
        WHERE 1=1
    """
    params = []
    
    # Apply agency filter
    if agency:
        query += " AND agency = ?"
        params.append(agency)
    
    # Apply program filter
    if program:
        if program.upper() == 'SBIR':
            query += " AND (program = ? OR program = ?)"
            params.extend(['SBIR', 'BOTH'])
        elif program.upper() == 'STTR':
            query += " AND (program = ? OR program = ?)"
            params.extend(['STTR', 'BOTH'])
        elif program.upper() == 'BOTH':
            query += " AND program = ?"
            params.append('BOTH')
    
    # Apply phase filter
    if phase:
        if phase == 'Phase I':
            query += " AND (phase = ? OR phase = ?)"
            params.extend(['Phase I', 'BOTH'])
        elif phase == 'Phase II':
            query += " AND (phase = ? OR phase = ?)"
            params.extend(['Phase II', 'BOTH'])
        elif phase.upper() == 'BOTH':
            query += " AND phase = ?"
            params.append('BOTH')
    
    # Add ordering
    query += " ORDER BY award_year DESC"
    
    # Only add LIMIT if specified
    if limit is not None:
        query += " LIMIT ? OFFSET ?"
        params.extend([limit, offset])
    elif offset > 0:
        # If offset is provided without limit, use a large limit
        query += " LIMIT 1000000 OFFSET ?"
        params.append(offset)
    
    cursor.execute(query, params)
    results = cursor.fetchall()
    
    # Extract the total count from the first row (if results exist)
    total_count = results[0]['total_count'] if results else 0
    
    # Convert rows to dictionaries and remove the total_count field
    awards = []
    for row in results:
        award_dict = dict(row)
        # Remove the total_count field from each row
        if 'total_count' in award_dict:
            del award_dict['total_count']
        awards.append(award_dict)
    
    conn.close()
    
    return jsonify({
        'data': awards,
        'total': total_count,
        'limit': limit,
        'offset': offset
    })

@bp.route('/awards/search', methods=['GET'])
def search():
    conn = get_db_connection(db_name="awards")
    cursor = conn.cursor()
    
    search_term = request.args.get('q', default='', type=str)
    limit = request.args.get('limit', default=None, type=int)
    offset = int(request.args.get('offset', default=0))
    
    if not search_term:
        return jsonify({'error': 'No search term provided'}), 400
    
    # Search across multiple fields using correct column names from schema
    query = """
        SELECT * FROM awards 
        WHERE firm LIKE ? OR
            award_title LIKE ? OR
            agency LIKE ? OR
            abstract LIKE ?
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

@bp.route('/awards/<int:award_link>', methods=['GET'])
def get_award(award_link):
    conn = get_db_connection(db_name="awards")
    cursor = conn.cursor()
    
    # Get the award with company info
    cursor.execute("""
        SELECT * FROM awards
        WHERE award_link = ?
    """, [award_link])
    
    row = cursor.fetchone()
    award = dict(row) if row else None
    
    if not award:
        conn.close()
        return jsonify({'error': 'Award not found'}), 404
    
    conn.close()
    
    return jsonify(award)  