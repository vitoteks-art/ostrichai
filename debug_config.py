import os
import sys

# Ensure backend directory is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
# backend_dir = os.path.dirname(current_dir) # No, we are in root
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from app.config import settings
    print("Settings loaded successfully!")
    print(f"Mailtrap API Key: {settings.mailtrap_api_key}")
except Exception as e:
    print(f"Error loading settings: {e}")
    import traceback
    traceback.print_exc()
