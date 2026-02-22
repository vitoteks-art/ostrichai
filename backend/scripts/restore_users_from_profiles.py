
import os
import sys
import re

# Ensure backend directory is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.append(backend_dir)

from app.database import engine
from sqlalchemy import text
from app.auth.utils import get_password_hash

def recover_users_from_profiles(sql_file_path):
    print("--- User Recovery Script ---")
    
    # 1. Read SQL file
    try:
        with open(sql_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    # 2. Extract Values using Regex
    # Matches patterns like: ('uuid', 'email', ...)
    # Adjust regex based on exact SQL format if needed
    # Insert statement: VALUES ('08e20907...', 'email@...', ...)
    # Tuple regex: \('([0-9a-f-]+)',\s*'([^']+)'
    
    pattern = re.compile(r"\('([0-9a-fA-F-]{36})',\s*'([^']+)'")
    matches = pattern.findall(content)
    
    if not matches:
        print("No user profiles found in SQL file.")
        return

    print(f"Found {len(matches)} profiles. Recovering linked users...")
    
    default_password = "password123"
    hashed_pwd = get_password_hash(default_password)
    
    with engine.connect() as conn:
        with conn.begin():
            count = 0
            for user_id, email in matches:
                # Check if user exists
                result = conn.execute(text("SELECT id FROM users WHERE id = :id"), {"id": user_id})
                if result.fetchone():
                    print(f"User {email} already exists. Skipping.")
                    continue
                
                # Insert User
                try:
                    conn.execute(
                        text("""
                            INSERT INTO users (id, email, hashed_password, is_active, is_admin, created_at, updated_at)
                            VALUES (:id, :email, :pwd, true, false, now(), now())
                        """),
                        {
                            "id": user_id, 
                            "email": email, 
                            "pwd": hashed_pwd
                        }
                    )
                    count += 1
                    print(f"Recovered User: {email}")
                except Exception as e:
                    print(f"Failed to insert user {email}: {e}")
            
            print(f"--- Recovery Complete. Restored {count} users. ---")
            print(f"Default password for all restored users: {default_password}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python restore_users.py <path_to_profiles.sql>")
        sys.exit(1)
    
    sql_file = sys.argv[1]
    recover_users_from_profiles(sql_file)
