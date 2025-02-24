from flask import Blueprint, jsonify, request
from app.services.db import get_db_connection

bp = Blueprint('companies', __name__, url_prefix='/api')

@bp.route('/companies', methods=['GET'])
def get_all_companies():
    conn = get_db_connection(db_name="companies")
    cursor = conn.cursor()
    
    limit = int(request.args.get('limit', default=50))
    offset = int(request.args.get('offset', default=0))
    
    cursor.execute("SELECT * FROM companies LIMIT ? OFFSET ?", [limit, offset])
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
    limit = request.args.get('limit', default=50, type=int)
    offset = request.args.get('offset', default=0, type=int)
    
    if not search_term:
        return jsonify({'error': 'No search term provided'}), 400
    
    # Search across multiple fields
    cursor.execute("""
        SELECT * FROM companies 
        WHERE company_name LIKE ? OR
            city LIKE ? OR
            state LIKE ?
        LIMIT ? OFFSET ?
    """, [f'%{search_term}%'] * 3 + [limit, offset])
    
    results = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({
        'data': results,
        'limit': limit,
        'offset': offset
    })