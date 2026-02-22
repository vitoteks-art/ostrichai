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
        SELECT column_name, COUNT(*)
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_sign_in_at'
        GROUP BY column_name;
    """)
    row = cursor.fetchone()
    if row:
        print(f"Column '{row[0]}' exists {row[1]} times.")
    else:
        print("Column 'last_sign_in_at' does not exist.")
        
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
