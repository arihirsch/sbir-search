from flask import Blueprint, jsonify, request, current_app
from app.services.db import get_db_connection, get_db_cursor
from datetime import datetime
import urllib.parse
import openai
import os
import json
from http import HTTPStatus

bp = Blueprint('llmsearch', __name__, url_prefix='/api')

def get_schema_info():
    """
    Retrieve database schema information for the LLM from a schema file.
    Returns the schema as a JSON string.
    """
    schema_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
                                    'schemas', 'database_schema.json')
    
    try:
        with open(schema_file_path, 'r') as schema_file:
            schema_info = schema_file.read()
        return schema_info
    except FileNotFoundError:
        current_app.logger.error(f"Schema file not found at {schema_file_path}")
        raise Exception(f"Schema file not found. Please create a schema file at {schema_file_path}")
    except Exception as e:
        current_app.logger.error(f"Error reading schema file: {str(e)}")
        raise Exception(f"Failed to read schema file: {str(e)}")

@bp.route('/llmsearch', methods=['GET'])
def llm_search():
    """
    Convert natural language query to SQL and return results.
    
    Query parameters:
    - q: The natural language query
    - limit: Optional maximum number of results (default: all)
    """
    try:
        # Get query parameters
        user_input = request.args.get('q')
        limit = request.args.get('limit', default=None, type=int)
        
        if not user_input:
            return jsonify({"error": "Missing query parameter 'q'"}), HTTPStatus.BAD_REQUEST
        
        # Get schema information
        schema_info = get_schema_info()
        
        # Generate SQL from natural language and determine which database to use
        sql_result = natural_language_to_sql(user_input, schema_info)
        sql_query = sql_result["sql"]
        db_name = sql_result["database"]
        
        # Add safety limit to query if not present
        if limit is not None and "LIMIT" not in sql_query.upper():
            sql_query = f"{sql_query} LIMIT {limit}"
        
        # Execute query and get results
        cursor = get_db_cursor(db_name=db_name)
        
        try:
            cursor.execute(sql_query)
            columns = [desc[0] for desc in cursor.description] # Get column names
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            #current_app.logger.info(f"Results: {results}")

            return jsonify({
                "results": results,
                "sql_query": sql_query,
                "database": db_name,
                "count": len(results)
            })
        except Exception as e:
            current_app.logger.error(f"SQL execution error: {str(e)}")
            # Return more detailed error information
            return jsonify({
                "error": f"SQL execution error: {str(e)}",
                "sql_query": sql_query,
                "database": db_name
            }), HTTPStatus.BAD_REQUEST
        
    except Exception as e:
        current_app.logger.error(f"LLM search error: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), HTTPStatus.INTERNAL_SERVER_ERROR

def natural_language_to_sql(user_input, schema_info):
    """
    Convert natural language to SQL using OpenAI.
    Returns a dict with the SQL query and the database to use.
    """
    # Configure OpenAI client
    client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    
    prompt = f"""
    Convert the following natural language query into an SQL query based on this database schema.
    This is intended to be used by a user with a search input, so bias towards adding more fields to the query.
    
    We have three separate schemas in our PostgreSQL database:
    1. "db1" - Contains information about solicitations, topics, and subtopics
    2. "db2" - Contains information about awards given to companies
    3. "db3" - Contains information about companies that have received awards
    
    Based on the user's query, determine which schema to use and generate the appropriate SQL query.

    Some fields may be null, so we may have to account for that in the query using OR statements.

    States are abbreviated. For example, Texas is TX, California is CA, etc.
    
    IMPORTANT: For general searches or topic-related queries, use the "db1" schema and specifically query the "topics" table. 
    The topics table contains the most relevant information for general searches.
    If there is not a clear match to awards or companies, default to querying the topics table in the db1 schema.
    Never query the solicitations table directly, even if a user asks for solicitations. Query the topics table instead.
    You may need to join the topics table with the solicitations table to get the full picture of a topic like this:
        SELECT t.*, s.agency, s.solicitation_number, s.solicitation_title
        FROM topics t
        LEFT JOIN solicitations s ON t.solicitation_id = s.solicitation_id
    
    Schema: {schema_info}
    
    Query: {user_input}
    
    Return your response in the following JSON format:
    {{
      "database": "schema_name",
      "sql": "SQL query"
    }}
    
    Where schema_name is one of: "db1", "db2", or "db3".
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an AI that converts natural language to SQL. Return only the JSON with database and SQL query without any explanation. For general searches, prioritize querying the topics table in the db1 schema."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,  # Lower temperature for more deterministic results
            response_format={"type": "json_object"}  # Ensure JSON response
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Parse the JSON response
        try:
            result = json.loads(result_text)
            print(result)
            
            # Validate the response format
            if "database" not in result or "sql" not in result:
                raise ValueError("Response missing required fields")
                
            # Validate the database name
            if result["database"] not in ["db1", "db2", "db3"]:
                # Try to map old database names to new schema names
                db_mapping = {
                    "solicitations": "db1",
                    "awards": "db2",
                    "companies": "db3"
                }
                
                if result["database"] in db_mapping:
                    current_app.logger.info(f"Mapping old database name '{result['database']}' to schema '{db_mapping[result['database']]}'")
                    result["database"] = db_mapping[result["database"]]
                else:
                    raise ValueError(f"Invalid database name: {result['database']}")
            
            # If the database is db1 but the query doesn't reference the topics table,
            # modify it to query the topics table by default
            if result["database"] == "db1" and "topics" not in result["sql"].lower():
                current_app.logger.info("Modifying query to use topics table")
                result["sql"] = f"SELECT * FROM topics WHERE topic_title LIKE '%{user_input}%' OR topic_description LIKE '%{user_input}%'"
                
            return result
        except json.JSONDecodeError:
            # If JSON parsing fails, create a default query for the topics table
            current_app.logger.warning("Failed to parse JSON response, falling back to default topics query")
            return {
                "database": "db1",
                "sql": f"SELECT * FROM topics WHERE topic_title LIKE '%{user_input}%' OR topic_description LIKE '%{user_input}%'"
            }
            
    except Exception as e:
        current_app.logger.error(f"OpenAI API error: {str(e)}")
        raise Exception(f"Failed to generate SQL: {str(e)}")

