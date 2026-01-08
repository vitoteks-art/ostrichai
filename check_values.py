import psycopg2

# Use direct IP to avoid DNS issues
DATABASE_URL = "postgres://postgres:OpeOremipo@2014@72.60.215.204:5433/ostrichai"

try:
    print("Connecting to production database (via IP)...")
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    print("\n🔍 Checking for populated 'last_sign_in_at' values...")
    cursor.execute("SELECT email, last_sign_in_at FROM users WHERE last_sign_in_at IS NOT NULL LIMIT 5")
    rows = cursor.fetchall()
    
    if rows:
        for row in rows:
            print(f"✅ User: {row[0]}, Last Login: {row[1]}")
    else:
        print("ℹ️ Column exists but ALL values are currently NULL.")
        print("   This means no one has logged in since the code deployment, OR the code isn't deployed.")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
