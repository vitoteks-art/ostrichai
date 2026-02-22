import os
import sys

print(f"CWD: {os.getcwd()}")
env_path = os.path.join('backend', '.env')
print(f"Checking for .env at: {os.path.abspath(env_path)}")

if os.path.exists(env_path):
    print("File exists!")
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            if 'MAILTRAP' in line:
                print(f"Found: {line.strip().split('=')[0]}=***")
else:
    print("File DOES NOT exist at this path.")

# Try to load settings
sys.path.append(os.path.join(os.getcwd(), 'backend'))
try:
    from app.config import settings
    print("Settings loaded.")
    print(f"API Key in settings: {settings.mailtrap_api_key[:5] if settings.mailtrap_api_key else 'None'}...")
except Exception as e:
    print(f"Error: {e}")
