import os
import psycopg2

# Database connection details
DB_CONFIG = {
    'host': 'localhost',
    'database': 'ostrichai',
    'user': 'postgres',
    'password': 'OpeOremipo@2014'
}

def import_projects_final():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_file = os.path.join(base_dir, 'user_projects_rows_utf8.sql')
    
    print("=" * 60)
    print("FINAL PROJECTS IMPORT")
    print("=" * 60)
    
    # Read the original file
    # We use cp1252 or latin-1 if utf-8 fails, but errors='ignore' is a fallback
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        with open(input_file, 'r', encoding='cp1252') as f:
            content = f.read()

    # Trim to the first INSERT and last semicolon
    insert_start = content.find('INSERT INTO')
    if insert_start == -1:
        print("No INSERT INTO found!")
        return
        
    last_semicolon = content.rfind(');')
    if last_semicolon == -1:
        print("No ); found!")
        # If it's truncated, we take as much as possible
        content = content[insert_start:]
    else:
        content = content[insert_start:last_semicolon+2]
        
    print(f"Cleaned SQL length: {len(content)}")
    
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    try:
        # 1. Clear table
        cur.execute("DELETE FROM user_projects")
        print("✓ Cleared table.")
        
        # 2. Set the crucial setting for backslash escapes
        cur.execute("SET standard_conforming_strings = off")
        print("✓ SET standard_conforming_strings = off")
        
        # 3. Execute the bulk insert
        print("Importing...")
        cur.execute(content)
        conn.commit()
        print("✓ SUCCESS! Bulk import completed.")
        
        # 4. Verify count
        cur.execute("SELECT COUNT(*) FROM user_projects")
        print(f"TOTAL RECORDS IN DATABASE: {cur.fetchone()[0]}")
        
    except Exception as e:
        conn.rollback()
        print(f"✗ FAILED: {e}")
        # Show partial context if it's a syntax error
        if "syntax error" in str(e).lower() or "invalid input" in str(e).lower():
            pass # Psycopg2 usually prints context automatically
            
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    import_projects_final()
