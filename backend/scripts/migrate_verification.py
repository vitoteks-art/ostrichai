import os
import sys
from sqlalchemy import text

# Ensure backend directory is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.append(backend_dir)

from app.database import engine

def migrate():
    print("--- Database Migrator: Email Verification ---")
    print(f"Connecting to: {engine.url}")
    
    # SQL to add columns
    sql = """
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS verification_code VARCHAR,
    ADD COLUMN IF NOT EXISTS verification_code_expires_at TIMESTAMP WITH TIME ZONE;
    """
    
    try:
        with engine.connect() as conn:
            conn.execute(text(sql))
            conn.commit()
            print("Success! Columns added to 'users' table.")
    except Exception as e:
        print(f"Error migrating database: {e}")

if __name__ == "__main__":
    migrate()
