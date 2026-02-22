import sys
import os
from dotenv import load_dotenv

# Explicitly load .env from the same directory as the script's parent (backend)
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.user import User
# Handle imports for when running as script
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

try:
    from app.config import settings
    from app.models.user import User
    from app.models.user_role import UserRole
    from app.database import SQLALCHEMY_DATABASE_URL
except ImportError:
    pass

def promote_user(email: str, db_url=None):
    if not db_url:
        # Try to load from env if not provided
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
        load_dotenv(env_path)
        db_url = os.getenv("DATABASE_URL") or os.getenv("VITE_DATABASE_URL")
        
        # Fallback to settings if available
        if not db_url and 'settings' in globals():
            db_url = settings.database_url

    if not db_url:
        print("Error: Could not find DATABASE_URL. Please provide it as an argument.")
        return False

    print(f"Connecting to: {db_url}")
    
    try:
        engine = create_engine(db_url)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"Error: User with email '{email}' not found.")
            return False
            
        if user.is_admin:
            print(f"User '{email}' is already an admin.")
            return True
            
        user.is_admin = True
        
        # Add super_admin role to user_roles table
        if 'UserRole' in globals():
            existing_role = db.query(UserRole).filter(UserRole.user_id == user.id, UserRole.role == 'super_admin').first()
            if not existing_role:
                new_role = UserRole(user_id=user.id, role='super_admin')
                db.add(new_role)
                print(f"Added 'super_admin' role to user_roles for '{email}'.")
            else:
                print(f"User '{email}' already has 'super_admin' role.")
        else:
            print("Warning: UserRole model not found, skipping role table update.")

        db.commit()
        print(f"Successfully promoted '{email}' to admin status.")
        return True
    except Exception as e:
        print(f"Error promoting user: {e}")
        db.rollback()
        return False
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/promote_admin.py <email> [db_url]")
        sys.exit(1)
        
    email = sys.argv[1]
    db_url = sys.argv[2] if len(sys.argv) > 2 else None
    
    promote_user(email, db_url)
