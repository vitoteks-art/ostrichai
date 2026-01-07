import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.user import User
from app.database import SQLALCHEMY_DATABASE_URL

# Setup database connection
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def promote_user(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"Error: User with email '{email}' not found.")
            return False
            
        if user.is_admin:
            print(f"User '{email}' is already an admin.")
            return True
            
        user.is_admin = True
        db.commit()
        print(f"Successfully promoted '{email}' to admin.")
        return True
    except Exception as e:
        print(f"Error promoting user: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/promote_admin.py <email>")
        sys.exit(1)
        
    email = sys.argv[1]
    promote_user(email)
