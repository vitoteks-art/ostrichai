
import os
import sys

# Ensure backend directory is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.append(backend_dir)

from app.database import engine
from sqlalchemy import text

def verify_db():
    print("--- Verifying Database Content ---")
    print(f"Connected to: {engine.url}")
    
    with engine.connect() as conn:
        try:
            # Check users
            result = conn.execute(text("SELECT COUNT(*) FROM users"))
            user_count = result.scalar()
            print(f"Users count: {user_count}")
            
            # Check profiles
            result = conn.execute(text("SELECT COUNT(*) FROM profiles"))
            profile_count = result.scalar()
            print(f"Profiles count: {profile_count}")

            # Check subscription plans
            result = conn.execute(text("SELECT COUNT(*) FROM subscription_plans"))
            plans_count = result.scalar()
            print(f"Subscription Plans count: {plans_count}")

            # Check user_projects
            result = conn.execute(text("SELECT COUNT(*) FROM user_projects"))
            projects_count = result.scalar()
            print(f"User Projects count: {projects_count}")
            
        except Exception as e:
            print(f"Verification failed: {e}")

if __name__ == "__main__":
    verify_db()
