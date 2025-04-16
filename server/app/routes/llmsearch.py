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
                                    'schemas', 'llm_schema.json')
    
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
    Convert natural language query to SQL and return the query and database name.
    
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
        cleaned_sql_result = clean_sql_result(user_input, sql_result)
        sql_query = cleaned_sql_result["sql"]
        db_name = cleaned_sql_result["database"]
        
        # Add safety limit to query if not present
        if limit is not None and "LIMIT" not in sql_query.upper():
            sql_query = f"{sql_query} LIMIT {limit}"
        
        return jsonify({
            "sql_query": sql_query,
            "database": db_name
        })
        
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
    You are an expert system designed to convert natural language queries into SQL statements that retrieve structured information from a PostgreSQL database.

    **STRICT REQUIREMENTS**:
    - ONLY use highly structured fields such as: `year`, `phase`, `agency`, `branch`, `state`, etc.
    - DO NOT use or search unstructured or free-text fields such as `description`, `title`, `topic_number`, `topic_description`, `abstract`, `topic_code`, etc.
    - DO NOT perform full-text search or use `ILIKE`/`LIKE` on descriptive fields.
    - DO NOT query on topic numbers or solicitation numbers unless explicitly requested and mapped to structured fields.

    **USAGE BIAS**:
    - This is meant to power a user-facing search. Favor including more constraints when relevant (e.g., include year, branch, and phase if mentioned).
    - When the user query is ambiguous or general, prefer broader structured matches over free text logic.

    **DATABASE OVERVIEW**:
    There are three PostgreSQL schemas:
    1. `db1`: Contains solicitations, topics, and subtopics.
    - For general or topic-based queries, always use the `topics` table in `db1`.
    - NEVER query the `solicitations` table directly.
    - To enrich topic results with solicitation info, JOIN as follows:
        ```sql
        SELECT t.*, s.agency, s.solicitation_number, s.solicitation_title
        FROM topics t
        LEFT JOIN solicitations s ON t.solicitation_id = s.solicitation_id
        ```
    - If a user asks for open topics, use the following query:
        ```sql
        SELECT * FROM topics WHERE topic_open_date < CURRENT_DATE OR topic_open_date IS NULL
        ```
    - If a user asks for closed topics, use the following query:
        ```sql
        SELECT * FROM topics WHERE topic_closed_date < CURRENT_DATE OR topic_closed_date IS NULL
        ```
    - If a user asks for pre-release topics, use the following query:
        ```sql
        SELECT * FROM topics WHERE topic_open_date > CURRENT_DATE
        ```
    2. `db2`: Contains awards information.
    - NEVER query fields for textual information, and never use `ILIKE`/`LIKE` on descriptive fields.
    - For general queries, ```SELECT * FROM awards``` is sufficient.
    3. `db3`: Contains company information (companies that have received awards).
    - ONLY query city, state, and number of awards. NOTHING ELSE, even if specifically requested.
    - NEVER query fields for textual information, and never use `ILIKE`/`LIKE` on descriptive fields.
    - For general queries, ```SELECT * FROM companies``` is sufficient.

    **SPECIAL RULES**:
    - If the user asks about the "Space Force", map this to the Air Force branch (USAF).
    - States are stored as 2-letter abbreviations (e.g., TX for Texas, CA for California).
    - Some fields may be `NULL`. Use appropriate logic like `OR field IS NULL` if filtering on such fields.

    **DEFAULTS**:
    - If it's unclear which schema to use, default to querying the `topics` table in `db1`.
    - Never return empty queries. Make a best-effort match using structured fields.

    ---

    **Schema**:
    {schema_info}

    **User Query**:
    "{user_input}"

    ---

    Respond in this exact JSON format:
    {{
    "database": "db1" | "db2" | "db3",
    "sql": "SQL query here"
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system","content": "You are an AI that converts natural language into SQL queries. Respond ONLY with a JSON object containing the target database (db1, db2, or db3) and a valid SQL query. Do NOT include any commentary or explanation. For general or ambiguous queries, default to querying the 'topics' table in the db1 schema. Avoid querying unstructured text fields like descriptions or titles—use only structured fields such as year, phase, agency, and branch."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0,  # Lower temperature for more deterministic results
            response_format={"type": "json_object"}  # Ensure JSON response
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Parse the JSON response
        try:
            result = json.loads(result_text)
            print("NL2SQL:",result)
            
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
                result["sql"] = f"SELECT * FROM topics"
                
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

def clean_sql_result(user_input: str, sql_result: str) -> str:
    """
    Clean the SQL result to remove any non-structured fields.
    """
    # Things to check/fix
    # don't filter on branch if the branch isn't explicitly mentioned
    # single word or short phrases
    # make sure sql query only selects from the right fields

    # first check if user input contains "topic" or "solicitation"
    if "topic" in user_input.lower() or "solicitation" in user_input.lower():
        if sql_result["database"] != "db1":
            sql_result["database"] = "db1"
            if "topics" not in sql_result["sql"].lower():
                sql_result["sql"] = f"SELECT * FROM topics"
    
    # check if user input contains "award" or "grant"
    if "award" in user_input.lower() or "grant" in user_input.lower():
        if sql_result["database"] != "db2":
            sql_result["database"] = "db2"
            if "awards" not in sql_result["sql"].lower():
                sql_result["sql"] = f"SELECT * FROM awards"

    # check if user input contains "company" or "firm"
    #if "company" in user_input.lower() or "firm" in user_input.lower() or "companies" in user_input.lower():
    #    if sql_result["database"] != "db3":
    #        sql_result["database"] = "db3"
    #        if "companies" not in sql_result["sql"].lower():
    #            sql_result["sql"] = f"SELECT * FROM companies"

    if sql_result["database"] == "db1":
        if "t.topic_closed_date IS NULL" in sql_result["sql"] and "t.topic_closed_date > CURRENT_DATE" not in sql_result["sql"]:
            sql_result["sql"] = sql_result["sql"].replace("t.topic_closed_date IS NULL", "t.topic_closed_date IS NULL OR t.topic_closed_date > CURRENT_DATE")
            print("cleaned topic closed date")
        if "t.topic_open_date = ''" in sql_result["sql"]:
            sql_result["sql"] = sql_result["sql"].replace("t.topic_open_date = ''", "t.topic_open_date < CURRENT_DATE")
            print("cleaned topic open date")
        if "LIKE" in sql_result["sql"].lower():
            sql_result["sql"] = f"SELECT * FROM topics"

    if sql_result["database"] == "db2":
        if "LIKE" in sql_result["sql"].lower():
            sql_result["sql"] = f"SELECT * FROM awards"

    if sql_result["database"] == "db3":
        if "company_name = " in sql_result["sql"].lower():
            sql_result["sql"] = f"SELECT * FROM companies"
        if "LIKE" in sql_result["sql"].lower():
            sql_result["sql"] = f"SELECT * FROM companies"

    return sql_result

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
    Returns a value between 0 and 1, where 1 means identical vectors.
    """
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)

def search_similar_embeddings(embedding: List[float], table: str, limit: int = None) -> List[Dict[str, Any]]:
    """
    Search for similar embeddings in the specified table using cosine similarity.
    Returns results sorted by similarity score (most similar first).
    """
    # Get cursor with access to both the target schema and public
    cursor = get_db_cursor("public")  # Start with public schema for vector operations
    
    # Set search path to include extensions schema first, then others
    cursor.execute("SET search_path TO extensions, public, db1, db2, db3;")
    
    # Convert embedding to string format for PostgreSQL
    embedding_str = "[" + ",".join(map(str, embedding)) + "]"
    
    # Use cosine distance for similarity search, using vector from extensions schema
    # The <=> operator returns cosine distance (1 - cosine similarity)
    query = f"""
        SELECT *, 
            (embedding <=> %s::vector) as distance
        FROM {table}
        WHERE embedding IS NOT NULL
        ORDER BY distance ASC
        LIMIT %s
    """
    
    cursor.execute(query, (embedding_str, limit))
    results = [dict(row) for row in cursor.fetchall()]
    
    # Convert distance to similarity score (1 - distance)
    for result in results:
        result['similarity_score'] = 1 - float(result['distance'])
        del result['distance']
    
    # Results are already ordered by distance (ASC), which means most similar first
    # since we converted distance to similarity score
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
        elif table == "awards":  # awards
            results_text += f"""
            Result {i}:
            Company: {result.get('firm', '')}
            Award Title: {result.get('award', '')}
            Amount: {result.get('award_amount', '')}
            Abstract: {result.get('abstract', '')}
            """
        elif table == "companies":  # companies
            results_text += f"""
            Result {i}:
            Company: {result.get('company_name', '')}
            Location: {result.get('city', '')}, {result.get('state', '')}
            """
    
    prompt = f"""
    You are a technical summarizer. Based on the user query and the search results below, generate a precise, domain-specific summary that addresses the core of the user's question.

    - Extract **highly technical insights** or **relevant findings** inferred from the results.
    - Take into account the intent of the user's query and the results to generate a summary.
    - DO NOT enumerate or list individual results, even if explicitly requested.
    - Identify **patterns**, **trends**, or **emergent themes**, especially from **recent results**.
    - Use result dates to highlight changes or developments over time, and be specific about the dates.
    - Assume the user wants **actionable or analytical** insights—not a verbose or general overview.
    - Limit the output to **under 100 words**. Avoid filler or repetition.
    - If there are no results, return "No results found."

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
        temperature=0.1
    )
    
    return response.choices[0].message.content.strip()

@bp.route('/vectorsearch', methods=['GET'])
def vector_search():
    """
    Perform vector similarity search based on user query.
    If results_to_rank is provided, rank those results by semantic similarity.
    Otherwise, perform a full vector search.
    """
    try:
        # Get query parameters
        user_input = request.args.get('q')
        limit = request.args.get('limit', default=None, type=int)
        results_to_rank = request.args.get('results_to_rank', type=list)
        
        if not user_input:
            return jsonify({"error": "Missing query parameter 'q'"}), HTTPStatus.BAD_REQUEST
        
        # Generate embedding for the query
        query_embedding = get_query_embedding(user_input)
        
        # If results_to_rank is provided, use those results for ranking
        if results_to_rank:
            # Calculate similarity scores for each result
            for result in results_to_rank:
                if 'embedding' in result:
                    try:
                        if isinstance(result['embedding'], str):
                            embedding_array = np.array(json.loads(result['embedding']))
                        else:
                            embedding_array = np.array(result['embedding'])
                        result['similarity_score'] = float(cosine_similarity(query_embedding, embedding_array))
                    except Exception as e:
                        current_app.logger.warning(f"Error calculating similarity for result: {str(e)}")
                        result['similarity_score'] = 0.0
            
            # Sort results by similarity score (most similar first)
            results_to_rank.sort(key=lambda x: x.get('similarity_score', 0), reverse=True)
            
            # Limit results if needed
            if limit:
                results_to_rank = results_to_rank[:limit]
            
            return jsonify({
                "topics": {
                    "results": results_to_rank,
                    "summary": generate_summary(user_input, results_to_rank, "topics")
                }
            })
        
        # Otherwise, perform regular vector search
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

@bp.route('/search', methods=['GET'])
def search():
    """
    Combined search endpoint that uses both LLM and vector search.
    First uses LLM search to get the SQL query, then executes it with vector similarity
    directly in the database.
    """
    try:
        # Get query parameters
        user_input = request.args.get('q')
        limit = request.args.get('limit', default=None, type=int)
        
        if not user_input:
            return jsonify({"error": "Missing query parameter 'q'"}), HTTPStatus.BAD_REQUEST
        
        # First, get the SQL query from LLM search
        llm_response = llm_search()
        if llm_response.status_code != HTTPStatus.OK:
            return llm_response
        
        llm_data = llm_response.get_json()
        if 'error' in llm_data:
            return jsonify(llm_data), llm_response.status_code
        
        # Get the SQL query and database name
        sql_query = llm_data.get('sql_query')
        db_name = llm_data.get('database')
        
        # Determine which table to use based on database
        table_name = "topics" if db_name == "db1" else "awards" if db_name == "db2" else "companies" if db_name == "db3" else None
        
        # Generate embedding for the query
        query_embedding = get_query_embedding(user_input)
        embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
        
        # Get the base query without ORDER BY and LIMIT clauses
        base_query = sql_query.split("ORDER BY")[0].split("LIMIT")[0].strip()
        
        # Add vector similarity to the query, using the IVFFlat index
        vector_query = f"""
            {base_query}
            ORDER BY embedding <=> %s::vector
            LIMIT %s
        """
        
        # Execute the query
        cursor = get_db_cursor(db_name=db_name)
        cursor.execute("SET search_path TO extensions, public, db1, db2, db3;")

        # Log start time
        start_time = datetime.now()
        
        # Execute vector search
        cursor.execute("SET ivfflat.probes = 5;")
        cursor.execute(vector_query, (embedding_str, limit or 100))
        results = [dict(row) for row in cursor.fetchall()]
        
        # Log end time and calculate duration
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        current_app.logger.info(f"Vector search completed in {duration:.2f}s with {len(results)} results")
        
        # Generate summary for the top 20 results only
        summary = generate_summary(user_input, results[:20], table_name)
        
        # Return the ranked results with summary
        return jsonify({
            "results": results,
            "summary": summary,
            "count": len(results),
            "database": db_name  # Add database info to response
        })
        
    except Exception as e:
        current_app.logger.error(f"Combined search error: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), HTTPStatus.INTERNAL_SERVER_ERROR

