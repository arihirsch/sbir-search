from flask import Blueprint, jsonify, request
from app.services.db import get_db_connection

bp = Blueprint('companies', __name__, url_prefix='/api')

@bp.route('/companies', methods=['GET'])
def get_all_companies():
    conn = get_db_connection(db_name="companies")
    cursor = conn.cursor()
    
    limit = request.args.get('limit', default=50, type=int)
    offset = int(request.args.get('offset', default=0))
    
    query = "SELECT * FROM companies"
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
    companies = [dict(row) for row in cursor.fetchall()]
    
    cursor.execute("SELECT COUNT(*) FROM companies")
    total_count = cursor.fetchone()[0]
    
    return jsonify({
        'data': companies,
        'total': total_count,
        'limit': limit,
        'offset': offset
    }) 

@bp.route('/companies/search', methods=['GET'])
def search():
    conn = get_db_connection(db_name="companies")
    cursor = conn.cursor()
    
    search_term = request.args.get('q', default='', type=str)
    limit = request.args.get('limit', default=None, type=int)
    offset = int(request.args.get('offset', default=0))
    
    if not search_term:
        return jsonify({'error': 'No search term provided'}), 400
    
    # Search across multiple fields
    query = """
        SELECT * FROM companies 
        WHERE company_name LIKE ? OR
            city LIKE ? OR
            state LIKE ?
    """
    params = [f'%{search_term}%'] * 3
    
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

@bp.route('/companies/<int:firm_nid>', methods=['GET'])
def get_company(firm_nid):
    conn = get_db_connection(db_name="companies")
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM companies WHERE firm_nid = ?", [firm_nid])
    company = cursor.fetchone()
    
    if company is None:
        return jsonify({'error': 'Company not found'}), 404
        
    conn.close()
    return jsonify({'data': dict(company)})