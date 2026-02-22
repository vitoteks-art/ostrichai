import os

env_path = os.path.join('backend', '.env')
mailtrap_api_key = 'cfbed3a49f3a1fb508037bc926b7d4d9'
mailtrap_sender = 'hello@getostrichai.com'

# Read existing lines
lines = []
if os.path.exists(env_path):
    with open(env_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

# Filter out existing mentions of these keys to avoid duplicates
new_lines = [line for line in lines if not line.startswith('MAILTRAP_API_KEY') and not line.startswith('MAILTRAP_SENDER_EMAIL')]

# Add new keys
new_lines.append(f'MAILTRAP_API_KEY={mailtrap_api_key}\n')
new_lines.append(f'MAILTRAP_SENDER_EMAIL={mailtrap_sender}\n')

# Write back
with open(env_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Updated {env_path} with new API key.")
