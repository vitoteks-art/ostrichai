
import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

def restore_database(sql_file_path):
    # 1. Load environment variables
    load_dotenv()
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("Error: DATABASE_URL not found in .env")
        return

    # Fix for SQLAlchemy: needs postgresql:// instead of postgres://
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    print("--- Database Uploader ---")
    print(f"Target Database: {database_url.split('@')[1] if '@' in database_url else 'Unknown Host'}")
    print(f"Source File: {sql_file_path}")
    
    # Check for -y flag to skip confirmation
    if "-y" not in sys.argv and "--yes" not in sys.argv:
        confirm = input("Are you sure you want to execute this SQL file against the target database? (yes/no): ")
        if confirm.lower() != 'yes':
            print("Aborted.")
            return
    else:
        print("Skipping confirmation (-y flag detected).")

    # 2. Connect to Database using SQLAlchemy
    try:
        engine = create_engine(database_url)
        connection = engine.connect()
        print("Connected to database.")
    except Exception as e:
        print(f"Failed to connect to database: {e}")
        return

    # 3. Read and Execute SQL File
    try:
        with open(sql_file_path, 'r', encoding='utf-8') as f:
            # Read the entire file
            # Note: For huge dumps, reading line-by-line or splitting by statements is safer.
            # But standard dumps often contain COPY which requires raw cursor.
            # This script handles standard INSERTs and schema definitions best.
            sql_content = f.read()

        print(f"Executing SQL from {sql_file_path}...")
        
        # Execute in a transaction
        with connection.begin():
            # SQLAlchemy text() might fail on complex scripts with DELIMITERS or COPY.
            # For robust imports, it's cleaner to remove 'search_path' or transaction commands if they cause issues.
            # We execute it as one block.
            connection.execute(text(sql_content))
            
        print("Success! Database restored.")
        
    except Exception as e:
        print(f"Error executing SQL: {e}")
    finally:
        connection.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python upload_db.py <path_to_sql_file>")
        sys.exit(1)
    
    sql_file = sys.argv[1]
    if not os.path.exists(sql_file):
        print(f"File not found: {sql_file}")
        sys.exit(1)
        
    restore_database(sql_file)
