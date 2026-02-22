import psycopg2

try:
    conn = psycopg2.connect(
        host="72.60.215.204",
        port=5433,
        user="postgres",
        password="OpeOremipo@2014",
        database="ostrichai"
    )
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
