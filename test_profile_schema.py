import sys
import os
from uuid import uuid4
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from app.schemas.users import ProfileResponse
    from pydantic import ValidationError

    # Mock data
    data = {
        "id": uuid4(),
        "email": "test@example.com",
        "full_name": "Test User",
        "phone": "123456",
        "location": "Earth",
        "bio": "Hello",
        "avatar_url": None,
        "roles": ["admin", "super_admin"],
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }

    profile = ProfileResponse(**data)
    print("ProfileResponse validated successfully!")
    print(f"Roles: {profile.roles}")

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
