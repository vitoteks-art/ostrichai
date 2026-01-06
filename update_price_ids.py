import sys
sys.path.append('e:/migration/leads-07/leads/backend')
from app.database import SessionLocal
from app.models.subscription_plans import SubscriptionPlan

def update_price_ids():
    db = SessionLocal()
    mapping = {
        'Starter': 'd3e2ff16-4ede-4b4f-a2c7-f46a8d8ef59c',
        'Pro': 'd197ec1d-cb78-40a8-bca0-a463a16cf5c4',
        'Business': 'eb455f19-e905-4f33-8ba9-3c210ddffff5'
    }
    
    try:
        for name, price_id in mapping.items():
            # Use ilike for case-insensitive and partial match to handle trailing spaces
            plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name.ilike(f"%{name}%")).first()
            if plan:
                plan.polar_product_price_id = price_id
                print(f"✅ Updated {plan.name} to {price_id}")
            else:
                print(f"❌ Could not find plan with name: {name}")
        
        db.commit()
        print("🎉 Database successfully updated.")
    except Exception as e:
        db.rollback()
        print(f"❌ Error during update: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_price_ids()
