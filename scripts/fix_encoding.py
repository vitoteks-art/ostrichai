import os

def fix_encoding():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sql_file = os.path.join(base_dir, 'user_projects_rows.sql')
    output_file = os.path.join(base_dir, 'user_projects_rows_utf8.sql')
    
    print(f"Reading {sql_file}...")
    with open(sql_file, 'r', encoding='cp1252', errors='replace') as f:
        content = f.read()
    
    # Replace common problematic characters if needed, although 'replace' handled the bytes.
    # The error 'character with byte sequence 0xa0 in encoding "WIN1252" has no equivalent in encoding "UTF8"'
    # suggests we have a non-breaking space (0xA0) that Postgres is struggling with when the client is WIN1252 but DB is UTF8
    # or vice versa. 
    
    # Let's replace 0xA0 with a regular space.
    content = content.replace('\xa0', ' ')
    
    print(f"Writing {output_file} in UTF-8...")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✓ Conversion complete.")

if __name__ == "__main__":
    fix_encoding()
