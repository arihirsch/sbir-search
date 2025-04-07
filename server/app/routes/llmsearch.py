from flask import Blueprint, jsonify, request, current_app
from app.services.db import get_db_connection, get_db_cursor
from datetime import datetime
import urllib.parse
import openai
import os
import json
from http import HTTPStatus
import numpy as np
from typing import List, Dict, Any, Tuple

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
        limit = request.args.get('limit', default=100, type=int)
        
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
            response = cursor.fetchall()

            results = []
            for row in response:
                topic_dict = dict(row)
                results.append(topic_dict)
            
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

    Do not search for the Space Force branch in the database. It is under the Air Force.
    
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

def get_query_embedding(query: str) -> List[float]:
    """
    Generate embedding for a query using OpenAI's embedding model.
    """
    client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    response = client.embeddings.create(
        input=query,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def cosine_similarity(a: List[float], b: List[float]) -> float:
    """
    Calculate cosine similarity between two vectors.
    """
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    return dot_product / (norm_a * norm_b)

def search_similar_embeddings(embedding: List[float], table: str, limit: int = 50) -> List[Dict[str, Any]]:
    """
    Search for similar embeddings in the specified table using cosine similarity.
    """
    # Get cursor with access to both the target schema and public
    cursor = get_db_cursor("public")  # Start with public schema for vector operations
    
    # Set search path to include extensions schema first, then others
    cursor.execute("SET search_path TO extensions, public, db1, db2, db3;")
    
    # Convert embedding to string format for PostgreSQL
    embedding_str = "[" + ",".join(map(str, embedding)) + "]"
    
    # Use cosine distance for similarity search, using vector from extensions schema
    query = f"""
        SELECT *, 
            (embedding <=> %s::vector) as similarity
        FROM {table}
        WHERE embedding IS NOT NULL
        ORDER BY similarity ASC
        LIMIT %s
    """
    
    cursor.execute(query, (embedding_str, limit))
    results = [dict(row) for row in cursor.fetchall()]
    
    # Convert similarity to a score between 0 and 1
    for result in results:
        result['similarity_score'] = 1 - float(result['similarity'])
        del result['similarity']
    
    return results

def generate_summary(query: str, results: List[Dict[str, Any]], table: str) -> str:
    """
    Generate a summary of the search results using OpenAI.
    """
    client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    
    # Format results for the prompt
    results_text = ""
    for i, result in enumerate(results, 1):
        if table == "topics":
            results_text += f"""
            Result {i}:
            Title: {result.get('topic_title', '')}
            Description: {result.get('topic_description', '')}
            Agency: {result.get('agency', '')}
            Branch: {result.get('branch', '')}
            Close Date: {result.get('topic_closed_date', '')}
            """
        else:  # awards
            results_text += f"""
            Result {i}:
            Company: {result.get('firm', '')}
            Award Title: {result.get('award', '')}
            Amount: {result.get('award_amount', '')}
            Abstract: {result.get('abstract', '')}
            """
    
    prompt = f"""
    Based on the user query and search results below, provide a concise response that answers the user's question.
    Focus on synthesizing information specific to the user's query based on the search results.
    DO NOT list the results, even if the user asks for them. Talk about general trends or information that you can glean from the results.
    Use the dates of the results to understand trends over time and generally focus on more recent results.
    Keep the response under 100 words.
    
    User Query: {query}

    Search Results:
    {results_text}
    """
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a SBIR expert that can answer questions about the database, and synthesize information from the search results."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2
    )
    
    return response.choices[0].message.content.strip()

@bp.route('/vectorsearch', methods=['GET'])
def vector_search():
    """
    Perform vector similarity search based on user query.
    """
    try:
        # Get query parameters
        user_input = request.args.get('q')
        limit = request.args.get('limit', default=50, type=int)
        
        if not user_input:
            return jsonify({"error": "Missing query parameter 'q'"}), HTTPStatus.BAD_REQUEST
        
        # Generate embedding for the query
        query_embedding = get_query_embedding(user_input)
        
        # Search in both topics and awards tables
        topics_results = search_similar_embeddings(query_embedding, "topics", limit)
        #awards_results = search_similar_embeddings(query_embedding, "awards", limit)
        
        # Generate summaries
        topics_summary = generate_summary(user_input, topics_results, "topics")
        #awards_summary = generate_summary(user_input, awards_results, "awards")
        
        return jsonify({
            "topics": {
                "results": topics_results,
                "summary": topics_summary
            },
            #"awards": {
            #    "results": awards_results,
            #    "summary": awards_summary
            #}
        })
        
    except Exception as e:
        current_app.logger.error(f"Vector search error: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), HTTPStatus.INTERNAL_SERVER_ERROR

