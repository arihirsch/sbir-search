from flask import Blueprint, jsonify, request
from app.services.db import get_db_connection

bp = Blueprint('awards', __name__, url_prefix='/api')

@bp.route('/awards', methods=['GET'])
def get_all_awards():
    conn = get_db_connection(db_name="awards")
    cursor = conn.cursor()
    
    limit = int(request.args.get('limit', default=50))
    offset = int(request.args.get('offset', default=0))
    
    cursor.execute("SELECT * FROM awards LIMIT ? OFFSET ?", [limit, offset])
    awards = [dict(row) for row in cursor.fetchall()]
    
    cursor.execute("SELECT COUNT(*) FROM awards")
    total_count = cursor.fetchone()[0]
    
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
    limit = request.args.get('limit', default=50, type=int)
    offset = request.args.get('offset', default=0, type=int)
    
    if not search_term:
        return jsonify({'error': 'No search term provided'}), 400
    
    # Search across multiple fields using correct column names from schema
    cursor.execute("""
        SELECT * FROM awards 
        WHERE firm LIKE ? OR
            award_title LIKE ? OR
            agency LIKE ? OR
            abstract LIKE ?
        LIMIT ? OFFSET ?
    """, [f'%{search_term}%'] * 4 + [limit, offset])
    
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