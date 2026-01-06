import os
import psycopg2

# Database connection details
DB_CONFIG = {
    'host': 'localhost',
    'database': 'ostrichai',
    'user': 'postgres',
    'password': 'OpeOremipo@2014'
}

def import_posts():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sql_file = os.path.join(base_dir, 'social_media_posts_rows_utf8.sql')
    
    print("=" * 60)
    print("IMPORTING SOCIAL MEDIA POSTS (UTF-8)")
    print("=" * 60)
    
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    try:
        # Check if table has data and warn or clear
        cur.execute("SELECT COUNT(*) FROM social_media_posts")
        count = cur.fetchone()[0]
        if count > 0:
            print(f"✓ Table has {count} records. Clearing...")
            cur.execute("DELETE FROM social_media_posts")
            conn.commit()
        
        print(f"Reading {sql_file}...")
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
            
        cur.execute("SET client_encoding = 'UTF8'")
        
        print("Executing SQL...")
        cur.execute(sql_content)
        conn.commit()
        
        cur.execute("SELECT COUNT(*) FROM social_media_posts")
        new_count = cur.fetchone()[0]
        print(f"✓ Migration complete. Successfully imported {new_count} records.")
        
    except Exception as e:
        conn.rollback()
        print(f"Error during import: {e}")
        # If it fails as a block, we might need to split it, but let's try block first.
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    import_posts()
