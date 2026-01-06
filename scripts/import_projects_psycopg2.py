import os
import psycopg2
import re

# Database connection details
DB_CONFIG = {
    'host': 'localhost',
    'database': 'ostrichai',
    'user': 'postgres',
    'password': 'OpeOremipo@2014'
}

def import_projects():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sql_file = os.path.join(base_dir, 'user_projects_rows_utf8.sql')
    
    print("=" * 60)
    print("IMPORTING PROJECTS RECORD BY RECORD (UTF-8)")
    print("=" * 60)
    
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    try:
        cur.execute("DELETE FROM user_projects")
        conn.commit()
        print("✓ Cleared existing projects")
        
        # Read file with utf-8
        with open(sql_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        cur.execute("SET client_encoding = 'UTF8'")
        
        # Execute the entire content as it contains valid bulk INSERT(s)
        try:
            cur.execute(content)
            conn.commit()
            print("✓ Bulk import executed successfully")
        except Exception as e:
            conn.rollback()
            print(f"✗ Error during bulk import: {e}")
            # Fallback to a simpler line-by-line or split if needed, 
            # but usually the SQL dump is valid as a whole.
        
        cur.execute("SELECT COUNT(*) FROM user_projects")
        print(f"COUNT IN DATABASE: {cur.fetchone()[0]}")
        
        cur.execute("SELECT COUNT(*) FROM user_projects")
        print(f"COUNT IN DATABASE: {cur.fetchone()[0]}")
        
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    import_projects()
