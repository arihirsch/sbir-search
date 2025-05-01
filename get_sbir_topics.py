import os
import psycopg2
import requests
import time
import json
from psycopg2.extras import RealDictCursor
from datetime import datetime
from openai import OpenAI

# OpenAI setup
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
BATCH_SIZE = 300  # For embeddings

# Database connection parameters
print("Reading environment variables...")
db_host = os.environ.get("SUPABASE_DB_HOST")
db_name_env = os.environ.get("SUPABASE_DB_NAME")
db_user = os.environ.get("SUPABASE_DB_USER")
db_password = os.environ.get("SUPABASE_DB_PASSWORD")
db_port = os.environ.get("SUPABASE_DB_PORT", "5432")

if not all([db_host, db_name_env, db_user, db_password]):
    raise ValueError("Database connection parameters must be set in environment variables")

def get_db_connection():
    print("Attempting to connect to database...")
    try:
        conn = psycopg2.connect(
            host=db_host,
            database=db_name_env,
            user=db_user,
            password=db_password,
            port=db_port,
            cursor_factory=RealDictCursor
        )
        print("Successfully connected to database!")
        return conn
    except Exception as e:
        print(f"Error connecting to database: {str(e)}")
        raise

# API base URL
BASE_URL = "https://api.www.sbir.gov/public/api/solicitations"

def fetch_data(page):
    print(f"Making API request for page {page + 1}...")
    params = {
        "rows": 10,
        "start": page * 10,
    }
    try:
        response = requests.get(BASE_URL, params=params)
        response.raise_for_status()  # Raise an error for bad status codes
        print(f"Successfully fetched page {page + 1}")
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching page {page + 1}: {str(e)}")
        return None

def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a batch of texts using OpenAI's API"""
    try:
        response = client.embeddings.create(
            input=texts,
            model="text-embedding-3-small"
        )
        return [item.embedding for item in response.data]
    except Exception as e:
        print(f"Embedding error: {str(e)}")
        return [None] * len(texts)

def combine_fields(row, solicitation): 
    """Combine topic and solicitation fields for embedding"""
    return f"""
    Topic Title: {row.get('topic_title', '')}
    Topic Description: {row.get('topic_description', '')}
    Branch: {row.get('branch', '')}
    Topic Open Date: {row.get('topic_open_date', '')}
    Topic Closed Date: {row.get('topic_closed_date', '')}
    Topic POC Name: {row.get('tpoc_name', '')}
    
    Parent Solicitation Title: {solicitation.get('solicitation_title', '')}
    SBIR or STTR Program: {solicitation.get('program', '')}
    Phase I or Phase II: {solicitation.get('phase', '')}
    Solicitation Agency: {solicitation.get('agency', '')}
    Solicitation Branch: {solicitation.get('branch', '')}
    Solicitation Year: {solicitation.get('solicitation_year', '')}
    """

def generate_embeddings():
    """Generate embeddings for topics with NULL embedding field"""
    print("\nStarting embedding generation...")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    total_embeddings_added = 0
    try:
        # Fetch rows with NULL embeddings
        cursor.execute("SELECT * FROM topics WHERE embedding IS NULL")
        rows = cursor.fetchall()

        if not rows:
            print("No topics need embeddings.")
            return total_embeddings_added
        
        print(f"Generating embeddings for {len(rows)} topics...")

        # Process in batches
        for i in range(0, len(rows), BATCH_SIZE):
            batch = rows[i:i + BATCH_SIZE]
            texts = []
            keys = []

            # Build input batch
            for row in batch:
                cursor.execute("SELECT * FROM solicitations WHERE solicitation_id = %s", (row['solicitation_id'],))
                solicitation = cursor.fetchone()
                if solicitation:
                    combined = combine_fields(row, solicitation)
                    texts.append(combined)
                    keys.append((row['topic_number'], row['solicitation_id']))

            # Generate embeddings
            print(f"Generating embeddings for batch {i // BATCH_SIZE + 1}...")
            embeddings = get_embeddings_batch(texts)

            # Update database
            successful_updates = 0
            for idx, embedding in enumerate(embeddings):
                if embedding:
                    cursor.execute(
                        "UPDATE topics SET embedding = %s WHERE topic_number = %s AND solicitation_id = %s",
                        (embedding, keys[idx][0], keys[idx][1])
                    )
                    if cursor.rowcount > 0:
                        successful_updates += 1
            
            total_embeddings_added += successful_updates
            conn.commit()
            print(f"✅ Updated {successful_updates} topics with embeddings (batch {i // BATCH_SIZE + 1})")

    except Exception as e:
        print(f"Error during embedding generation: {str(e)}")
        conn.rollback()
        raise
    finally:
        conn.close()
        print(f"Embedding generation complete! Added {total_embeddings_added} embeddings")
        return total_embeddings_added

def insert_data(data):
    print("Establishing database connection for data insertion...")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        for item in data:
            print(f"Processing solicitation ID: {item.get('solicitation_id')}")
            # Insert into solicitations table
            cursor.execute("""
                INSERT INTO solicitations (
                    solicitation_id, solicitation_title, solicitation_number, program, phase, agency, branch,
                    solicitation_year, release_date, open_date, close_date, application_due_dates,
                    solicitation_agency_url, current_status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (solicitation_id) DO NOTHING
            """, (
                item.get("solicitation_id"),
                item.get("solicitation_title"),
                item.get("solicitation_number"),
                item.get("program"),
                item.get("phase"),
                item.get("agency"),
                item.get("branch"),
                item.get("solicitation_year"),
                item.get("release_date"),
                item.get("open_date"),
                item.get("close_date"),
                json.dumps(item.get("application_due_date")),
                item.get("solicitation_agency_url"),
                item.get("current_status")
            ))
            if cursor.rowcount > 0:
                print(f"Inserted solicitation: {item.get('solicitation_id')}")

            topics = item.get("solicitation_topics", [])
            if topics and isinstance(topics, list):
                for topic in topics:
                    if topic:
                        cursor.execute("""
                            INSERT INTO topics (
                                topic_number, solicitation_id, topic_title, branch, topic_description, sbir_topic_link, topic_open_date, topic_closed_date
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT (topic_number, solicitation_id) DO NOTHING
                        """, (
                            topic.get("topic_number"),
                            item.get("solicitation_id"),
                            topic.get("topic_title"),
                            topic.get("branch"),
                            topic.get("topic_description"),
                            topic.get("sbir_topic_link"),
                            topic.get("topic_open_date"),
                            topic.get("topic_closed_date")
                        ))
                        if cursor.rowcount > 0:
                            print(f"Inserted topic: {topic.get('topic_number')} under solicitation {item.get('solicitation_id')}")

                    subtopics = topic.get("subtopics", [])
                    if subtopics and isinstance(subtopics, list):
                        for subtopic in subtopics:
                            if subtopic and subtopic.get("subtopic_id"):
                                try:
                                    cursor.execute("""
                                        INSERT INTO subtopics (
                                            subtopic_id, subtopic_number, topic_number, solicitation_id, subtopic_title, branch, subtopic_description, subtopic_open_date, subtopic_close_date
                                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                                        ON CONFLICT (subtopic_id) DO NOTHING
                                    """, (
                                        subtopic.get("subtopic_id"),
                                        subtopic.get("subtopic_number"),
                                        topic.get("topic_number"),
                                        item.get("solicitation_id"),
                                        subtopic.get("subtopic_title"),
                                        subtopic.get("branch"),
                                        subtopic.get("subtopic_description"),
                                        subtopic.get("subtopic_open_date"),
                                        subtopic.get("subtopic_close_date"),
                                    ))
                                    if cursor.rowcount > 0:
                                        print(f"Inserted subtopic: {subtopic.get('subtopic_number')} (ID: {subtopic.get('subtopic_id')}) under topic {topic.get('topic_number')}")
                                except psycopg2.Error as e:
                                    print(f"Error inserting subtopic {subtopic.get('subtopic_number')}: {str(e)}")
                                    print(f"Topic number was: {topic.get('topic_number')}")

        conn.commit()
        print("Successfully committed all changes to database")
    except Exception as e:
        print(f"Error during data insertion: {str(e)}")
        conn.rollback()
        raise
    finally:
        conn.close()
        print("Database connection closed")

def fix_date_formats():
    """
    Fixes date formats in the database by converting 'YYYY/MM/DD' to 'YYYY-MM-DD'.
    """
    print("Starting date format fixes...")
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        date_columns = {
            "solicitations": ["release_date", "open_date", "close_date", "application_due_dates"],
            "topics": ["topic_open_date", "topic_closed_date"]
        }

        for table, columns in date_columns.items():
            for column in columns:
                print(f"Fixing date format for {table}.{column}")
                query = f"""
                UPDATE {table}
                SET {column} = TO_DATE(REPLACE({column}::TEXT, '/', '-'), 'YYYY-MM-DD')
                WHERE {column}::TEXT LIKE '____/__/__';
                """
                cursor.execute(query)
                print(f"Updated {column} in {table}")

        conn.commit()
        print("Successfully committed all date format fixes")
    except Exception as e:
        print(f"Error during date format fixes: {str(e)}")
        conn.rollback()
        raise
    finally:
        conn.close()
        print("Database connection closed")

def recreate_vector_index():
    """Recreate the IVFFlat index for vector search"""
    print("\nRecreating vector search index...")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Set longer timeout for index creation
        cursor.execute("SET statement_timeout = '50min';")
        
        # Increase work memory for better index creation performance
        cursor.execute("SET maintenance_work_mem = '512MB';")
        
        # Drop existing index if it exists
        print("Dropping existing index...")
        cursor.execute("""
            DROP INDEX IF EXISTS topics_embedding_ivfflat_idx;
        """)
        
        # Count total topics for calculating optimal lists
        cursor.execute("SELECT COUNT(*) as count FROM topics WHERE embedding IS NOT NULL")
        total_topics = cursor.fetchone()['count']
        
        # Calculate number of lists (roughly sqrt of total topics, with minimum of 100)
        n_lists = max(100, round((total_topics ** 0.5) / 10) * 10)
        print(f"Creating new index with {n_lists} lists based on {total_topics} topics...")
        
        # Create the IVFFLAT index
        cursor.execute(f"""
            CREATE INDEX topics_embedding_ivfflat_idx
            ON topics
            USING ivfflat (embedding extensions.vector_cosine_ops)
            WITH (lists = {n_lists});
        """)
        
        conn.commit()
        print("✅ Vector search index recreated successfully!")
    
    except Exception as e:
        print(f"Error recreating vector index: {str(e)}")
        conn.rollback()
        raise
    finally:
        conn.close()

def main():
    print(f"Starting SBIR data collection at {datetime.now()}")
    try:
        MAX_PAGES = 25
        page = 0
        while page < MAX_PAGES:
            print(f"Processing page {page + 1} of {MAX_PAGES}...")
            data = fetch_data(page)
            if not data or len(data) == 0:
                print("No more data")
                break
            insert_data(data)
            time.sleep(1)  # Avoid excessive requests
            page += 1

        print("Running date format fixes...")
        fix_date_formats()

        print("Generating embeddings for new topics...")
        embeddings_added = generate_embeddings()

        if embeddings_added > 0:
            print(f"Added {embeddings_added} new embeddings, recreating vector search index...")
            recreate_vector_index()
        else:
            print("No new embeddings added, skipping index recreation")

        print("Data collection and processing complete!")
    except Exception as e:
        print(f"Fatal error in main execution: {str(e)}")
        raise

if __name__ == "__main__":
    main() 