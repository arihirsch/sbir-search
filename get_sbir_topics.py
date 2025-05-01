import os
import psycopg2
import requests
import time
import json
from psycopg2.extras import RealDictCursor
from datetime import datetime

# Database connection parameters
db_host = os.environ.get("SUPABASE_DB_HOST")
db_name_env = os.environ.get("SUPABASE_DB_NAME")
db_user = os.environ.get("SUPABASE_DB_USER")
db_password = os.environ.get("SUPABASE_DB_PASSWORD")
db_port = os.environ.get("SUPABASE_DB_PORT", "5432")

if not all([db_host, db_name_env, db_user, db_password]):
    raise ValueError("Database connection parameters must be set in environment variables")

def get_db_connection():
    return psycopg2.connect(
        host=db_host,
        database=db_name_env,
        user=db_user,
        password=db_password,
        port=db_port,
        cursor_factory=RealDictCursor
    )

# API base URL
BASE_URL = "https://api.www.sbir.gov/public/api/solicitations"

def fetch_data(page):
    params = {
        "rows": 10,
        "start": page * 10,
    }
    response = requests.get(BASE_URL, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching page {page}: {response.status_code}")
        return None

def insert_data(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    for item in data:
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
                                print(f"Error inserting subtopic {subtopic.get('subtopic_number')}: {e}")
                                print(f"Topic number was: {topic.get('topic_number')}")

    conn.commit()
    conn.close()

def fix_date_formats():
    """
    Fixes date formats in the database by converting 'YYYY/MM/DD' to 'YYYY-MM-DD'.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    date_columns = {
        "solicitations": ["release_date", "open_date", "close_date", "application_due_dates"],
        "topics": ["topic_open_date", "topic_closed_date"]
    }

    for table, columns in date_columns.items():
        for column in columns:
            query = f"""
            UPDATE {table}
            SET {column} = TO_DATE(REPLACE({column}::TEXT, '/', '-'), 'YYYY-MM-DD')
            WHERE {column}::TEXT LIKE '____/__/__';
            """
            cursor.execute(query)
            print(f"Updated {column} in {table}")

    conn.commit()
    conn.close()
    print("Date format fixing complete!")

def main():
    print(f"Starting SBIR data collection at {datetime.now()}")
    page = 0
    while True:
        print(f"Fetching page {page + 1}...")
        data = fetch_data(page)
        if not data or len(data) == 0:
            print("No more data")
            break
        insert_data(data)
        time.sleep(1)  # Avoid excessive requests
        page += 1

    print("Running date format fixes...")
    fix_date_formats()
    print("Data collection and processing complete!")

if __name__ == "__main__":
    main() 