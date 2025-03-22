from flask import Blueprint, jsonify, request
from app.services.db import get_db_connection, get_db_cursor

bp = Blueprint('companies', __name__, url_prefix='/api')

@bp.route('/companies', methods=['GET'])
def get_all_companies():
    cursor = get_db_cursor("db3")  # Use db3 schema for companies
    
    limit = request.args.get('limit', default=50, type=int)
    offset = int(request.args.get('offset', default=0))
    
    # Use window function to get total count in the same query
    query = """
        SELECT *, COUNT(*) OVER() as total_count
        FROM companies
    """
    params = []
    
    # Only add LIMIT if specified
    if limit is not None:
        query += " LIMIT %s OFFSET %s"
        params.extend([limit, offset])
    elif offset > 0:
        # If offset is provided without limit, use a large limit
        query += " LIMIT 1000000 OFFSET %s"
        params.append(offset)
    
    cursor.execute(query, params)
    results = cursor.fetchall()
    
    # Extract the total count from the first row (if results exist)
    total_count = results[0]['total_count'] if results else 0
    
    # Convert rows to dictionaries and remove the total_count field
    companies = []
    for row in results:
        company_dict = dict(row)
        # Remove the total_count field from each row
        if 'total_count' in company_dict:
            del company_dict['total_count']
        companies.append(company_dict)
    
    return jsonify({
        'data': companies,
        'total': total_count,
        'limit': limit,
        'offset': offset
    }) 

@bp.route('/companies/search', methods=['GET'])
def search():
    cursor = get_db_cursor("db3")  # Use db3 schema for companies
    
    search_term = request.args.get('q', default='', type=str)
    limit = request.args.get('limit', default=None, type=int)
    offset = int(request.args.get('offset', default=0))
    
    if not search_term:
        return jsonify({'error': 'No search term provided'}), 400
    
    # Search across multiple fields with window function for count
    query = """
        SELECT *, COUNT(*) OVER() as total_count
        FROM companies 
        WHERE company_name LIKE %s OR
            city LIKE %s OR
            state LIKE %s
    """
    params = [f'%{search_term}%'] * 3
    
    # Only add LIMIT if specified
    if limit is not None:
        query += " LIMIT %s OFFSET %s"
        params.extend([limit, offset])
    elif offset > 0:
        # If offset is provided without limit, use a large limit
        query += " LIMIT 1000000 OFFSET %s"
        params.append(offset)
    
    cursor.execute(query, params)
    results = cursor.fetchall()
    
    # Extract the total count from the first row (if results exist)
    total_count = results[0]['total_count'] if results else 0
    
    # Convert rows to dictionaries and remove the total_count field
    companies = []
    for row in results:
        company_dict = dict(row)
        # Remove the total_count field from each row
        if 'total_count' in company_dict:
            del company_dict['total_count']
        companies.append(company_dict)
    
    return jsonify({
        'data': companies,
        'total': total_count,
        'limit': limit,
        'offset': offset
    })

@bp.route('/companies/<int:firm_nid>', methods=['GET'])
def get_company(firm_nid):
    cursor = get_db_cursor("db3")  # Use db3 schema for companies
    cursor.execute("SELECT * FROM companies WHERE firm_nid = %s", [firm_nid])
    company = cursor.fetchone()
    
    if company is None:
        return jsonify({'error': 'Company not found'}), 404
        
    return jsonify({'data': dict(company)})