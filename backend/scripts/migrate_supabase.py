import os
import sys
import asyncio
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import uuid

# Add parent directory to path to import app modules if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configuration
# ------------------------------------------------------------------------------
# REPLACE THIS WITH YOUR SUPABASE CONNECTION STRING
# Find it in Supabase Dashboard > Settings > Database > Connection Pooler (Transaction) or Direct
# format: postgresql://postgres.xxxx:password@aws-0-region.pooler.supabase.com:6543/postgres
SUPABASE_DB_URL = "postgresql://postgres:OpeOremipo%402014@supabase.getostrichai.com:5432/postgres"

# Local Database URL (reads from .env by default if run from backend dir, else defaults)
LOCAL_DB_URL = "postgresql://postgres:OpeOremipo%402014@localhost/ostrichai"

def migrate_users(remote_conn, local_conn):
    print("--- Migrating Users ---")
    # Fetch users from Supabase auth.users
    # Note: We cast UUIDs to text to avoid some driver issues, or handle them as objects.
    remote_users = remote_conn.execute(text("SELECT id, email, encrypted_password, raw_user_meta_data, created_at FROM auth.users")).fetchall()
    
    print(f"Found {len(remote_users)} users in Supabase.")

    migrated_count = 0
    for r_user in remote_users:
        uid = r_user[0] # uuid
        email = r_user[1]
        password = r_user[2]
        meta = r_user[3] or {}
        created_at = r_user[4]
        
        full_name = meta.get('full_name') or meta.get('name')
        
        # Check if user exists locally
        exists = local_conn.execute(text("SELECT 1 FROM users WHERE id = :id"), {"id": uid}).fetchone()
        
        if not exists:
            print(f"Migrating user: {email}")
            local_conn.execute(
                text("""
                INSERT INTO users (id, email, hashed_password, full_name, is_active, is_admin, created_at, updated_at)
                VALUES (:id, :email, :password, :full_name, true, false, :created_at, :created_at)
                """),
                {
                    "id": uid,
                    "email": email,
                    "password": password,
                    "full_name": full_name,
                    "created_at": created_at
                }
            )
            migrated_count += 1
        else:
            print(f"User already exists: {email}")

    local_conn.commit()
    print(f"Migrated {migrated_count} new users.")

def migrate_projects(remote_conn, local_conn):
    print("\n--- Migrating Projects ---")
    # Fetch projects from Supabase public.user_projects
    # Ensure columns match your local model
    try:
        remote_projects = remote_conn.execute(text("SELECT id, user_id, title, type, status, thumbnail_url, file_url, metadata, created_at FROM public.user_projects")).fetchall()
    except Exception as e:
        print(f"Error fetching remote projects: {e}")
        return

    print(f"Found {len(remote_projects)} projects in Supabase.")

    migrated_count = 0
    for proj in remote_projects:
        pid = proj[0]
        
        exists = local_conn.execute(text("SELECT 1 FROM user_projects WHERE id = :id"), {"id": pid}).fetchone()
        
        if not exists:
            try:
                local_conn.execute(
                    text("""
                    INSERT INTO user_projects (id, user_id, title, type, status, thumbnail_url, file_url, metadata, created_at, updated_at)
                    VALUES (:id, :user_id, :title, :type, :status, :thumbnail_url, :file_url, :metadata, :created_at, :created_at)
                    """),
                    {
                        "id": proj[0],
                        "user_id": proj[1],
                        "title": proj[2],
                        "type": proj[3],
                        "status": proj[4],
                        "thumbnail_url": proj[5],
                        "file_url": proj[6],
                        "metadata": proj[7], # 'metadata' column in DB matches
                        "created_at": proj[8]
                    }
                )
                migrated_count += 1
            except Exception as insert_err:
                print(f"Failed to migrate project {pid}: {insert_err}")
                local_conn.rollback() 
        
    local_conn.commit()
    print(f"Migrated {migrated_count} new projects.")

def main():
    if "YOUR_PASSWORD" in SUPABASE_DB_URL:
        print("ERROR: Please edit this script and set your SUPABASE_DB_URL first.")
        return

    print(f"Connecting to Local DB: {LOCAL_DB_URL}")
    local_engine = create_engine(LOCAL_DB_URL)
    local_conn = local_engine.connect()

    print(f"Connecting to Supabase DB...")  
    try:
        remote_engine = create_engine(SUPABASE_DB_URL)
        remote_conn = remote_engine.connect()
    except Exception as e:
        print(f"Failed to connect to Supabase: {e}")
        return

    try:
        migrate_users(remote_conn, local_conn)
        migrate_projects(remote_conn, local_conn)
        # Add more migration functions here (e.g., migrate_subscriptions)
    except Exception as e:
        print(f"Migration failed: {e}")
        local_conn.rollback()
    finally:
        local_conn.close()
        remote_conn.close()
        print("Done.")

if __name__ == "__main__":
    main()
