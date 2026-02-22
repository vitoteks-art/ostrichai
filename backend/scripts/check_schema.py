import psycopg2
import sys

def check():
    try:
        conn = psycopg2.connect(host='localhost', database='ostrichai', user='postgres', password='OpeOremipo@2014')
        cur = conn.cursor()

        print("Columns in scheduled_posts:")
        cur.execute("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'scheduled_posts' ORDER BY ordinal_position")
        for row in cur.fetchall():
            print(f"  {row[0]} ({row[1]}, nullable={row[2]})")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check()
