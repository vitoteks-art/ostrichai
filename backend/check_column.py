import psycopg2

# Production database connection
DATABASE_URL = "postgres://postgres:OpeOremipo@2014@easypanel.getostrichai.com:5433/ostrichai"

try:
    print("Connecting to production database...")
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    print("\n🔍 Checking for 'last_sign_in_at' column in 'users' table...")
    # SQL to check column
    cursor.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_sign_in_at';
    """)
    
    result = cursor.fetchone()
    
    if result:
        print(f"✅ Column Found! Name: {result[0]}, Type: {result[1]}")
        
        # Also check some values
        print("\n🔍 Checking recent values...")
        cursor.execute("SELECT email, last_sign_in_at FROM users WHERE last_sign_in_at IS NOT NULL LIMIT 5")
        rows = cursor.fetchall()
        if rows:
            for row in rows:
                print(f" - User: {row[0]}, Last Login: {row[1]}")
        else:
            print("ℹ️ Column exists but is currently empty (or NULL) for all users.")
            
    else:
        print("❌ Column 'last_sign_in_at' NOT FOUND in 'users' table.")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
