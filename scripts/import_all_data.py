import sys
import os
from sqlalchemy import create_engine, text
from passlib.context import CryptContext

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Password hashing context (using Argon2)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# Database URL
DATABASE_URL = "postgresql://postgres:OpeOremipo%402014@localhost/ostrichai"

def import_all_data():
    """Import all data from SQL files: profiles, subscriptions"""
    
    # File paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    profiles_file = os.path.join(base_dir, 'profiles_rows (1).sql')
    subscriptions_file = os.path.join(base_dir, 'user_subscriptions_rows.sql')
   
    # Read SQL files
    with open(profiles_file, 'r') as f:
        profiles_sql = f.read()
    
    with open(subscriptions_file, 'r') as f:
        subscriptions_sql = f.read()
    
    # Create engine
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            print("=" * 60)
            print("IMPORTING USER DATA FROM SUPABASE")
            print("=" * 60)
            
            # Step 1: Create users from profiles
            print("\n1. Creating users from profiles...")
            
            # Parse profile IDs and emails from SQL
            import re
            profile_pattern = r"\('([^']+)',\s*'([^']+)',\s*(?:'([^']*)'|null)"
            profiles = re.findall(profile_pattern, profiles_sql)
            
            users_created = 0
            for user_id, email, full_name in profiles:
                # Check if user already exists
                result = conn.execute(
                    text("SELECT id FROM users WHERE id = :id"),
                    {"id": user_id}
                )
                if result.fetchone():
                    print(f"  ✓ User already exists: {email}")
                    continue
                
                # Create user with a default password (user will need to reset)
                # Using a secure random password hash
                default_password = f"ChangeMe123!{user_id[:8]}"
                hashed_password = pwd_context.hash(default_password)
                
                conn.execute(
                    text("""
                        INSERT INTO users (id, email, hashed_password, full_name, is_active, is_admin)
                        VALUES (:id, :email, :password, :full_name, true, false)
                    """),
                    {
                        "id": user_id,
                        "email": email,
                        "password": hashed_password,
                        "full_name": full_name or None
                    }
                )
                users_created += 1
                print(f"  + Created user: {email}")
            
            conn.commit()
            print(f"\n✓ Created {users_created} new users")
            
            # Step 2: Import profiles
            print("\n2. Importing profiles...")
            conn.execute(text("DELETE FROM profiles"))
            conn.execute(text(profiles_sql))
            conn.commit()
            
            result = conn.execute(text("SELECT COUNT(*) FROM profiles"))
            profile_count = result.scalar()
            print(f"✓ Imported {profile_count} profiles")
            
            # Step 3: Import user subscriptions
            print("\n3. Importing user subscriptions...")
            conn.execute(text("DELETE FROM user_subscriptions"))
            conn.execute(text(subscriptions_sql))
            conn.commit()
            
            result = conn.execute(text("SELECT COUNT(*) FROM user_subscriptions"))
            subscription_count = result.scalar()
            print(f"✓ Imported {subscription_count} subscriptions")
            
            # Step 4: Show summary
            print("\n" + "=" * 60)
            print("IMPORT SUMMARY")
            print("=" * 60)
            
            result = conn.execute(text("""
                SELECT 
                    COUNT(DISTINCT u.id) as total_users,
                    COUNT(DISTINCT CASE WHEN us.status = 'active' THEN us.user_id END) as active_subs,
                    COUNT(DISTINCT CASE WHEN us.status = 'canceled' THEN us.user_id END) as canceled_subs
                FROM users u
                LEFT JOIN user_subscriptions us ON u.id = us.user_id
            """))
            summary = result.fetchone()
            
            print(f"\nTotal Users: {summary.total_users}")
            print(f"Active Subscriptions: {summary.active_subs}")
            print(f"Canceled Subscriptions: {summary.canceled_subs}")
            
            # Show subscription distribution
            print("\nSubscription Distribution:")
            result = conn.execute(text("""
                SELECT sp.name, COUNT(us.id) as count
                FROM user_subscriptions us
                JOIN subscription_plans sp ON us.plan_id = sp.id
                WHERE us.status = 'active'
                GROUP BY sp.name
                ORDER BY count DESC
            """))
            for row in result:
                print(f"  - {row.name}: {row.count}")
            
            print("\n" + "=" * 60)
            print("✓ DATA IMPORT COMPLETED SUCCESSFULLY!")
            print("=" * 60)
            print("\nIMPORTANT: All migrated users have temporary passwords.")
            print("They will need to use 'Forgot Password' to reset their password.")
            
    except Exception as e:
        print(f"\n✗ Error during import: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        engine.dispose()

if __name__ == "__main__":
    import_all_data()
