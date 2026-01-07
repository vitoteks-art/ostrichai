import sys
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Handle imports for when running as script
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

try:
    from app.config import settings
except ImportError:
    # Fallback if app.config fails (e.g. missing dependencies in checking env)
    pass

def check_users(db_url=None):
    if not db_url:
        # Try to load from env if not provided
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
        load_dotenv(env_path)
        db_url = os.getenv("DATABASE_URL") or os.getenv("VITE_DATABASE_URL")
        
        # Fallback to settings if available
        if not db_url and 'settings' in globals():
            db_url = settings.database_url

    if not db_url:
        print("Error: Could not find DATABASE_URL in environment or settings.")
        print("Usage: python scripts/check_users.py [DATABASE_URL]")
        return

    print(f"Connecting to: {db_url}")
    
    try:
        engine = create_engine(db_url)
        with engine.connect() as connection:
            query = """
                SELECT u.id, u.email, u.is_verified, u.is_admin,
                       array_agg(ur.role) as roles
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                GROUP BY u.id, u.email, u.is_verified, u.is_admin
            """
            result = connection.execute(text(query))
            print("\n--- Users in Database ---")
            print(f"{'Email':<30} | {'Verified':<10} | {'Admin':<10} | {'Roles':<20} | {'ID'}")
            print("-" * 110)
            rows = result.fetchall()
            if not rows:
                print("No users found.")
            for row in rows:
                roles_str = ",".join([r for r in row.roles if r]) if row.roles and row.roles[0] else "none"
                print(f"{row.email:<30} | {str(row.is_verified):<10} | {str(row.is_admin):<10} | {roles_str:<20} | {row.id}")
            print("-" * 110)
            print(f"Total users: {len(rows)}\n")

    except Exception as e:
        print(f"Error checking users: {e}")

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else None
    check_users(url)
