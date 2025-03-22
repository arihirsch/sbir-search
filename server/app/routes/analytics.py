from flask import Blueprint, jsonify, request
from app.services.db import get_db_connection, get_db_cursor

bp = Blueprint('analytics', __name__, url_prefix='/api')

@bp.route('/stats', methods=['GET'])
def get_stats():
    cursor = get_db_cursor("db1")  # Use db1 schema for solicitations
    
    # Get counts by agency
    cursor.execute("""
        SELECT agency, COUNT(*) as count 
        FROM solicitations 
        GROUP BY agency
    """)
    agency_counts = dict(cursor.fetchall())
    
    # Get total counts
    cursor.execute("SELECT COUNT(*) FROM solicitations")
    total_solicitations = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM topics")
    total_topics = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM subtopics")
    total_subtopics = cursor.fetchone()[0]
    
    # Get awards stats
    awards_cursor = get_db_cursor("db2")  # Use db2 schema for awards
    
    awards_cursor.execute("SELECT COUNT(*) FROM awards")
    total_awards = awards_cursor.fetchone()[0]
    
    # Get companies stats
    companies_cursor = get_db_cursor("db3")  # Use db3 schema for companies
    
    companies_cursor.execute("SELECT COUNT(*) FROM companies")
    total_companies = companies_cursor.fetchone()[0]
    
    # Add search counts
    search_term = request.args.get('q', default=None)
    if search_term:
        # Count matching solicitations
        cursor.execute("""
            SELECT COUNT(*) FROM solicitations s
            LEFT JOIN topics t ON s.solicitation_id = t.solicitation_id
            WHERE s.solicitation_title LIKE %s OR
                s.solicitation_number LIKE %s OR
                t.topic_title LIKE %s OR
                t.topic_description LIKE %s
        """, [f'%{search_term}%'] * 4)
        matching_solicitations = cursor.fetchone()[0]
        
        # Count matching awards
        awards_cursor.execute("""
            SELECT COUNT(*) FROM awards
            WHERE firm LIKE %s OR
                award_title LIKE %s OR
                abstract LIKE %s
        """, [f'%{search_term}%'] * 3)
        matching_awards = awards_cursor.fetchone()[0]
        
        # Count matching companies
        companies_cursor.execute("""
            SELECT COUNT(*) FROM companies
            WHERE company_name LIKE %s OR
                company_description LIKE %s OR
                company_address LIKE %s
        """, [f'%{search_term}%'] * 3)
        matching_companies = companies_cursor.fetchone()[0]
        
        return jsonify({
            'total_solicitations': total_solicitations,
            'total_topics': total_topics,
            'total_subtopics': total_subtopics,
            'total_awards': total_awards,
            'total_companies': total_companies,
            'by_agency': agency_counts,
            'search_results': {
                'solicitations': matching_solicitations,
                'awards': matching_awards,
                'companies': matching_companies
            }
        })
    
    return jsonify({
        'total_solicitations': total_solicitations,
        'total_topics': total_topics,
        'total_subtopics': total_subtopics,
        'total_awards': total_awards,
        'total_companies': total_companies,
        'by_agency': agency_counts
    })