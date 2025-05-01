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
BATCH_SIZE = 1000  # Larger batch size for awards as they're generally simpler

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
BASE_URL = "https://api.www.sbir.gov/public/api/awards"

def fetch_data(page):
    print(f"Making API request for page {page + 1}...")
    params = {
        "rows": 50,
        "start": page * 50,
    }
    try:
        response = requests.get(BASE_URL, params=params)
        response.raise_for_status()
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

def combine_award_fields(row): 
    """Combine award fields for embedding"""
    return f"""
    Company: {row.get('firm', '')}
    Award Title: {row.get('award', '')}
    Abstract: {row.get('abstract', '')}
    Agency: {row.get('agency', '')}
    Branch: {row.get('branch', '')}
    Phase: {row.get('phase', '')}
    Program: {row.get('program', '')}
    Award Amount: {row.get('award_amount', '')}
    Address: {row.get('address1', '')} {row.get('address2', '')} {row.get('city', '')} {row.get('state', '')} {row.get('zip', '')}
    """

def generate_embeddings():
    """Generate embeddings for awards with NULL embedding field"""
    print("\nStarting embedding generation...")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    total_embeddings_added = 0
    try:
        # Fetch rows with NULL embeddings
        cursor.execute("SELECT * FROM awards WHERE embedding IS NULL")
        rows = cursor.fetchall()

        if not rows:
            print("No awards need embeddings.")
            return total_embeddings_added
        
        print(f"Generating embeddings for {len(rows)} awards...")

        # Process in batches
        for i in range(0, len(rows), BATCH_SIZE):
            batch = rows[i:i + BATCH_SIZE]
            texts = []
            keys = []

            # Build input batch
            for row in batch:
                combined = combine_award_fields(row)
                texts.append(combined)
                keys.append(row['award_link'])

            # Generate embeddings
            print(f"Generating embeddings for batch {i // BATCH_SIZE + 1}...")
            embeddings = get_embeddings_batch(texts)

            # Update database
            successful_updates = 0
            for idx, embedding in enumerate(embeddings):
                if embedding:
                    cursor.execute(
                        "UPDATE awards SET embedding = %s WHERE award_link = %s::bigint",
                        (embedding, keys[idx])
                    )
                    if cursor.rowcount > 0:
                        successful_updates += 1
            
            total_embeddings_added += successful_updates
            conn.commit()
            print(f"✅ Updated {successful_updates} awards with embeddings (batch {i // BATCH_SIZE + 1})")

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
    
    awards_added = 0
    try:
        for item in data:
            cursor.execute("""
                INSERT INTO awards (
                    award_link, firm, award_title, agency, branch, phase, program,
                    agency_tracking_number, contract, proposal_award_date, contract_end_date,
                    solicitation_number, solicitation_year, topic_code, award_year, award_amount,
                    duns, uei, hubzone_owned, socially_economically_disadvantaged, women_owned,
                    number_employees, company_url, address1, address2, city, state, zip,
                    poc_name, poc_title, poc_phone, poc_email,
                    pi_name, pi_title, pi_phone, pi_email,
                    ri_name, ri_poc_name, ri_poc_phone,
                    research_area_keywords, abstract
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (award_link) DO NOTHING
            """, (
                item.get("award_link"),
                item.get("firm"),
                item.get("award_title"),
                item.get("agency"),
                item.get("branch"),
                item.get("phase"),
                item.get("program"),
                item.get("agency_tracking_number"),
                item.get("contract"),
                item.get("proposal_award_date"),
                item.get("contract_end_date"),
                item.get("solicitation_number"),
                item.get("solicitation_year"),
                item.get("topic_code"),
                item.get("award_year"),
                item.get("award_amount"),
                item.get("duns"),
                item.get("uei"),
                item.get("hubzone_owned"),
                item.get("socially_economically_disadvantaged"),
                item.get("women_owned"),
                item.get("number_employees"),
                item.get("company_url"),
                item.get("address1"),
                item.get("address2"),
                item.get("city"),
                item.get("state"),
                item.get("zip"),
                item.get("poc_name"),
                item.get("poc_title"),
                item.get("poc_phone"),
                item.get("poc_email"),
                item.get("pi_name"),
                item.get("pi_title"),
                item.get("pi_phone"),
                item.get("pi_email"),
                item.get("ri_name"),
                item.get("ri_poc_name"),
                item.get("ri_poc_phone"),
                item.get("research_area_keywords"),
                item.get("abstract")
            ))
            if cursor.rowcount > 0:
                awards_added += 1
                print(f"Inserted award: {item.get('award_link')}")

        conn.commit()
        print(f"Successfully committed all changes to database. Added {awards_added} new awards.")
    except Exception as e:
        print(f"Error during data insertion: {str(e)}")
        conn.rollback()
        raise
    finally:
        conn.close()
        print("Database connection closed")
        return awards_added

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
            DROP INDEX IF EXISTS awards_embedding_ivfflat_idx;
        """)
        
        # Count total awards for calculating optimal lists
        cursor.execute("SELECT COUNT(*) as count FROM awards WHERE embedding IS NOT NULL")
        total_awards = cursor.fetchone()['count']
        
        # Calculate number of lists (roughly sqrt of total awards, with minimum of 100)
        n_lists = max(100, round((total_awards ** 0.5) / 10) * 10)
        print(f"Creating new index with {n_lists} lists based on {total_awards} awards...")
        
        # Create the IVFFLAT index
        cursor.execute(f"""
            CREATE INDEX awards_embedding_ivfflat_idx
            ON awards
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
    print(f"Starting SBIR awards collection at {datetime.now()}")
    try:
        MAX_PAGES = 35
        page = 0
        total_awards_added = 0
        while page < MAX_PAGES:
            print(f"Processing page {page + 1} of {MAX_PAGES}...")
            data = fetch_data(page)
            if not data or len(data) == 0:
                print("No more data")
                break
            awards_added = insert_data(data)
            total_awards_added += awards_added
            time.sleep(0.1)  # Avoid excessive requests
            page += 1

        print(f"Added {total_awards_added} new awards in total")

        print("Generating embeddings for new awards...")
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