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
    
    cursor.execute("""
        SELECT column_name
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY column_name;
    """)
    cols = [row[0] for row in cursor.fetchall()]
    print("ALL_COLUMNS:" + "|".join(cols))
        
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
