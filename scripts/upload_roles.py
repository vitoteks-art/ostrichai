import sys
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Handle python path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

try:
    from app.database import Base, engine as db_engine
    from app.models.user_role import UserRole
    from app.config import settings
except ImportError:
    pass

def upload_roles(db_url=None):
    # Load .env
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    load_dotenv(env_path)
    
    if not db_url:
        db_url = os.getenv("DATABASE_URL") or os.getenv("VITE_DATABASE_URL")
        if not db_url and 'settings' in globals():
            db_url = settings.database_url

    if not db_url:
        print("Error: Could not find DATABASE_URL. Provide it as an argument.")
        print("Usage: python scripts/upload_roles.py [DATABASE_URL]")
        return False

    print(f"Connecting to: {db_url}")
    
    # Step 0: Read and execute SQL
    sql_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "user_roles_rows (1).sql")
    if not os.path.exists(sql_file):
        print(f"Error: SQL file not found at {sql_file}")
        return False

    with open(sql_file, 'r', encoding='utf-8', errors='ignore') as f:
        sql_content = f.read()

    if not sql_content.strip():
        print("Error: SQL file is empty.")
        return False

    # Clean SQL: Truncate everything after the last semicolon
    last_semicolon = sql_content.rfind(';')
    if last_semicolon != -1:
        sql_content = sql_content[:last_semicolon + 1]
        print(f"Cleaned SQL content (truncated to last semicolon).")

    # Handle duplicate IDs: Append ON CONFLICT DO NOTHING to the INSERT statements
    # We assume the last character before the semicolon is a closing parenthesis
    # or that the SQL is just INSERT INTO ... VALUES ... ;
    if "ON CONFLICT" not in sql_content.upper():
        sql_content = sql_content.replace(');', ') ON CONFLICT (id) DO NOTHING;')
        print("Added 'ON CONFLICT (id) DO NOTHING' to handle duplicates.")

    try:
        import psycopg2
        # Parse URL for psycopg2
        import urllib.parse as urlparse
        result = urlparse.urlparse(db_url)
        username = result.username
        password = urlparse.unquote(result.password) if result.password else None
        database = result.path[1:]
        hostname = result.hostname
        port = result.port

        print(f"Connecting with psycopg2 to {hostname}:{port}...")
        conn = psycopg2.connect(
            database=database,
            user=username,
            password=password,
            host=hostname,
            port=port,
            sslmode='disable'
        )
        conn.autocommit = False
        cur = conn.cursor()

        try:
            # Step 1: Drop and Create
            print("Recreating 'user_roles' table...")
            cur.execute('DROP TABLE IF EXISTS "public"."user_roles" CASCADE;')
            cur.execute("""
            CREATE TABLE "public"."user_roles" (
                "id" uuid PRIMARY KEY,
                "user_id" uuid NOT NULL,
                "role" varchar NOT NULL,
                "assigned_by" uuid,
                "assigned_at" timestamp with time zone,
                "role_metadata" jsonb,
                "created_at" timestamp with time zone,
                "updated_at" timestamp with time zone
            );
            """)
            print("Table created.")

            # Step 2: Insert data
            # Replace "metadata" column name with "role_metadata" in the SQL content
            if '"metadata"' in sql_content:
                sql_content = sql_content.replace('"metadata"', '"role_metadata"')
                print("Renamed 'metadata' column to 'role_metadata' in SQL content.")

            print(f"Executing SQL from {os.path.basename(sql_file)}...")
            cur.execute(sql_content)
            print("SQL inserts completed.")
            
            conn.commit()
            print("Transaction committed successfully.")
            return True

        except Exception as e:
            conn.rollback()
            print(f"SQL Error: {e}")
            return False
        finally:
            cur.close()
            conn.close()

    except Exception as e:
        print(f"Connection failure: {e}")
        return False

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else None
    upload_roles(url)
