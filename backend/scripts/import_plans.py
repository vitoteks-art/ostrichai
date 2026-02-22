import sys
import os
from sqlalchemy import create_engine, text

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Database URL
DATABASE_URL = "postgresql://postgres:OpeOremipo%402014@localhost/ostrichai"

def import_subscription_plans():
    """Import subscription plans from SQL file"""
    
    # Read the SQL file
    sql_file_path = os.path.join(os.path.dirname(__file__), '..', 'subscription_plans_rows.sql')
    
    with open(sql_file_path, 'r') as f:
        sql_content = f.read()
    
    # Create engine and connection
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # Clear existing plans first
            print("Clearing existing subscription plans...")
            conn.execute(text("DELETE FROM subscription_plans"))
            conn.commit()
            
            # Execute the insert statement
            print("Importing subscription plans...")
            conn.execute(text(sql_content))
            conn.commit()
            
            # Verify the import
            result = conn.execute(text("SELECT COUNT(*) FROM subscription_plans"))
            count = result.scalar()
            
            print(f"Successfully imported {count} subscription plans!")
            
            # Show the plans
            result = conn.execute(text("SELECT name, interval, price_cents/100.0 as price FROM subscription_plans ORDER BY price_cents"))
            print("\nImported plans:")
            for row in result:
                print(f"  - {row.name} ({row.interval}): ${row.price:.2f}")
                
    except Exception as e:
        print(f"Error importing subscription plans: {e}")
        raise
    finally:
        engine.dispose()

if __name__ == "__main__":
    import_subscription_plans()
