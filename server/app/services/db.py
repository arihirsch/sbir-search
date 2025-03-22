import os
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import g
from supabase import create_client, Client

def get_supabase_client() -> Client:
    """Get or create a Supabase client."""
    if not hasattr(g, 'supabase'):
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_KEY")
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")
        g.supabase = create_client(url, key)
    return g.supabase

def get_db_connection(db_name="solicitations"):
    """
    Get a PostgreSQL connection to the Supabase database.
    
    Args:
        db_name: Used to determine which schema/table to use (not separate databases in Supabase)
    
    Returns:
        A PostgreSQL connection object
    """
    db_key = f'db_{db_name}'
    
    if not hasattr(g, db_key):
        # Get connection parameters from environment variables
        db_host = os.environ.get("SUPABASE_DB_HOST")
        db_name_env = os.environ.get("SUPABASE_DB_NAME")
        db_user = os.environ.get("SUPABASE_DB_USER")
        db_password = os.environ.get("SUPABASE_DB_PASSWORD")
        db_port = os.environ.get("SUPABASE_DB_PORT", "5432")
        
        if not all([db_host, db_name_env, db_user, db_password]):
            raise ValueError("Database connection parameters must be set in environment variables")
        
        # Connect to PostgreSQL
        conn = psycopg2.connect(
            host=db_host,
            database=db_name_env,  # Use the environment variable value
            user=db_user,
            password=db_password,
            port=db_port,
            cursor_factory=RealDictCursor  # This makes cursor return dictionaries
        )
        
        setattr(g, db_key, conn)
    
    return getattr(g, db_key)

def get_db_cursor(db_name="db1"):
    """
    Get a cursor for the specified schema in PostgreSQL.
    
    Args:
        db_name: The schema name (db1, db2, db3)
    
    Returns:
        A cursor object with the search path set to the specified schema
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Set the search path to the specified schema
    cursor.execute(f"SET search_path TO {db_name}")
    
    return cursor

def close_db(e=None):
    """Close database connections."""
    for db_key in list(vars(g).keys()):
        if db_key.startswith('db_'):
            db = g.pop(db_key, None)
            if db is not None:
                db.close()    
    # Also close Supabase client if it exists
    if hasattr(g, 'supabase'):
        # Supabase client doesn't need explicit closing
        g.pop('supabase', None)
