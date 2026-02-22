
import os
import sys

# Ensure backend directory is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.append(backend_dir)

from app.database import engine, Base
# Import all models to ensure they are registered with Base
from app.models import *

def init_db():
    print("--- Database Initializer ---")
    print(f"Connecting to: {engine.url}")
    print("Creating tables if they don't exist...")
    
    try:
        Base.metadata.create_all(bind=engine)
        print("Success! Tables created.")
    except Exception as e:
        print(f"Error creating tables: {e}")

if __name__ == "__main__":
    init_db()
