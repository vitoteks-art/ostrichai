import psycopg2

def verify_counts():
    try:
        conn = psycopg2.connect(host='localhost', database='ostrichai', user='postgres', password='OpeOremipo@2014')
        cur = conn.cursor()
        
        tables = [
            'user_profiles', 
            'user_subscriptions', 
            'user_projects', 
            'social_media_accounts', 
            'social_media_posts',
            'subscription_plans'
        ]
        
        print("=" * 40)
        print("DATABASE RECORD COUNTS")
        print("=" * 40)
        
        for table in tables:
            try:
                cur.execute(f"SELECT COUNT(*) FROM {table}")
                count = cur.fetchone()[0]
                print(f"{table:25}: {count}")
            except Exception as e:
                print(f"{table:25}: ERROR - {e}")
                conn.rollback()
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error connecting to database: {e}")

if __name__ == "__main__":
    verify_counts()
