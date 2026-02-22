import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from app.models.user import User
    from app.models.user_role import UserRole
    from app.database import Base
    print("Models imported successfully.")

    # Try to initialize the mapper
    from sqlalchemy.orm import configure_mappers
    configure_mappers()
    print("SQLAlchemy mappers configured successfully.")

except Exception as e:
    print(f"Error during model initialization: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("All good!")
