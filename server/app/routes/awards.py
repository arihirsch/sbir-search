from flask import Blueprint, jsonify, request
from app.services.db import get_db_connection, get_db_cursor

bp = Blueprint('awards', __name__, url_prefix='/api')

@bp.route('/awards', methods=['GET'])
def get_all_awards():
    cursor = get_db_cursor("db2")  # Use db2 schema for awards
    
    # Get query parameters
    limit = request.args.get('limit', default=50, type=int)
    offset = int(request.args.get('offset', default=0))
    agency = request.args.get('agency', default=None, type=str)
    program = request.args.get('program', default=None, type=str)
    phase = request.args.get('phase', default=None, type=str)
    year = request.args.get('year', default=None, type=str)
    min_amount = request.args.get('minAmount', default=None, type=int)
    max_amount = request.args.get('maxAmount', default=None, type=int)
    search_query = request.args.get('q', default=None, type=str)
    
    # Base query with window function for count
    query = """
        SELECT *, COUNT(*) OVER() as total_count
        FROM awards
        WHERE 1=1
    """
    params = []
    
    # Apply agency filter
    if agency:
        query += " AND agency = %s"
        params.append(agency)
    
    # Apply program filter
    if program:
        if program.upper() == 'SBIR':
            query += " AND program = %s"
            params.append('SBIR')
        elif program.upper() == 'STTR':
            query += " AND program = %s"
            params.append('STTR')
    
    # Apply phase filter
    if phase:
        if phase == 'Phase I':
            query += " AND phase = %s"
            params.append('Phase I')
        elif phase == 'Phase II':
            query += " AND phase = %s"
            params.append('Phase II')
    
    # Apply year filter
    if year:
        query += " AND award_year = %s"
        params.append(int(year))
    
    # Apply amount range filter
    if min_amount is not None:
        query += " AND award_amount >= %s"
        params.append(min_amount)
    
    if max_amount is not None:
        query += " AND award_amount <= %s"
        params.append(max_amount)
    
    # If there's a search query, use vector similarity
    if search_query:
        # Generate embedding for the query
        from app.routes.llmsearch import get_query_embedding
        query_embedding = get_query_embedding(search_query)
        embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
        
        # Add vector similarity to the query with threshold
        query += """
            AND (embedding <=> %s::vector) < 0.85
            ORDER BY embedding <=> %s::vector
        """
        params.extend([embedding_str, embedding_str])
    else:
        # Default ordering by award year
        query += " ORDER BY award_year DESC"
    
    # Add pagination
    query += " LIMIT %s OFFSET %s"
    params.extend([limit, offset])
    
    cursor.execute("SET search_path TO extensions, public, db1, db2, db3;")    
    cursor.execute("SET ivfflat.probes = 10;")
    
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
    
    # Generate summary if there's a search query
    summary = None
    if search_query and awards:
        from app.routes.llmsearch import generate_summary
        # Create filter context
        filters = {
            'agency': agency,
            'program': program,
            'phase': phase,
            'year': year,
            'min_amount': min_amount,
            'max_amount': max_amount
        }
        summary = generate_summary(search_query, awards[:10], "awards", filters)
    
    return jsonify({
        'data': awards,
        'database': 'db2',
        'total': total_count,
        'limit': limit,
        'offset': offset,
        'summary': summary
    })

@bp.route('/awards/search', methods=['GET'])
def search():
    cursor = get_db_cursor("db2")  # Use db2 schema for awards
    
    search_term = request.args.get('q', default='', type=str)
    limit = request.args.get('limit', default=None, type=int)
    offset = int(request.args.get('offset', default=0))
    
    if not search_term:
        return jsonify({'error': 'No search term provided'}), 400
    
    # Search across multiple fields using correct column names from schema
    query = """
        SELECT * FROM awards 
        WHERE firm LIKE %s OR
            award_title LIKE %s OR
            agency LIKE %s OR
            abstract LIKE %s
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

@bp.route('/awards/<int:award_link>', methods=['GET'])
def get_award(award_link):
    cursor = get_db_cursor("db2")  # Use db2 schema for awards
    
    # Get the award with company info
    cursor.execute("""
        SELECT * FROM awards
        WHERE award_link = %s
    """, [award_link])
    
    row = cursor.fetchone()
    award = dict(row) if row else None
    
    if not award:
        return jsonify({'error': 'Award not found'}), 404
    
    return jsonify(award)  