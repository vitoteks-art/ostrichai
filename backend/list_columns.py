import psycopg2

# Production database connection
DATABASE_URL = "postgres://postgres:OpeOremipo@2014@72.60.215.204:5433/ostrichai"

try:
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    print("--- User Table Columns ---")
    cursor.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY column_name;
    """)
    for row in cursor.fetchall():
        print(f"{row[0]}: {row[1]}")
        
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
