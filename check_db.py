
import os
import uuid
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# URL for the external Easypanel database
DATABASE_URL = "postgresql://easypanel:Hbe3GBej78_T5H8_vAtR_@srv939063.hstgr.cloud:5432/ostrichai"

def check_projects():
    try:
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Check total projects
        result = db.execute(text("SELECT count(*) FROM user_projects")).fetchone()
        print(f"Total projects in database: {result[0]}")
        
        # Check recent projects
        result = db.execute(text("SELECT id, user_id, title, type, status, created_at FROM user_projects ORDER BY created_at DESC LIMIT 5")).fetchall()
        print("\nRecent 5 projects:")
        for row in result:
            print(f"ID: {row[0]}, UserID: {row[1]}, Title: {row[2]}, Type: {row[3]}, Status: {row[4]}, Created: {row[5]}")
            
        # Check users
        result = db.execute(text("SELECT id, email FROM users LIMIT 5")).fetchall()
        print("\nRecent 5 users:")
        for row in result:
            print(f"ID: {row[0]}, Email: {row[1]}")
            
        db.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_projects()
