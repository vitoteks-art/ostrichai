import sys
import os
import asyncio
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from app.models import SubscriptionPlan
from app.database import engine, Base
import uuid

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def seed_plans():
    # Create session
    with Session(engine) as session:
        # Check if plans exist
        existing_plans = session.query(SubscriptionPlan).count()
        if existing_plans > 0:
            print(f"Plans already exist ({existing_plans}). Skipping seed.")
            return

        print("Seeding subscription plans...")

        plans = [
            SubscriptionPlan(
                name="Free",
                description="Perfect for getting started",
                price_cents=0,
                currency="USD",
                interval="month",
                popular=False,
                features={
                    "videoGeneration": True,
                    "logoDesign": False,
                    "adCreation": False,
                    "flyerDesign": False,
                    "blogResearch": False,
                    "scriptGeneration": True,
                    "imageEditing": False,
                    "socialMediaPosts": False,
                    "titleGeneration": True,
                    "batchProcessing": False,
                    "prioritySupport": False,
                    "customBranding": False,
                    "analytics": False,
                    "apiAccess": False,
                    "whiteLabel": False
                },
                limits={
                    "monthlyCredits": 100,
                    "creditRolloverDays": 0,
                    "overageRateCents": 500,
                    "videosPerMonth": 2,
                    "logosPerMonth": 0,
                    "adsPerMonth": 0,
                    "flyersPerMonth": 0,
                    "blogPostsPerMonth": 0,
                    "scriptsPerMonth": 5,
                    "imageEditsPerMonth": 0,
                    "socialPostsPerMonth": 0,
                    "youtubeResearchPerMonth": 2,
                    "titleGenPerMonth": 10,
                    "storageLimit": 100,
                    "maxVideoDuration": 30,
                    "maxImageResolution": "1024x1024",
                    "exportQuality": "standard"
                }
            ),
            SubscriptionPlan(
                name="Pro",
                description="For creators and professionals",
                price_cents=2900, # $29.00
                currency="USD",
                interval="month",
                popular=True,
                features={
                    "videoGeneration": True,
                    "logoDesign": True,
                    "adCreation": True,
                    "flyerDesign": True,
                    "blogResearch": True,
                    "scriptGeneration": True,
                    "imageEditing": True,
                    "socialMediaPosts": True,
                    "titleGeneration": True,
                    "batchProcessing": False,
                    "prioritySupport": True,
                    "customBranding": False,
                    "analytics": True,
                    "apiAccess": False,
                    "whiteLabel": False
                },
                limits={
                    "monthlyCredits": 1000,
                    "creditRolloverDays": 30,
                    "overageRateCents": 400,
                    "videosPerMonth": 20,
                    "logosPerMonth": 10,
                    "adsPerMonth": 10,
                    "flyersPerMonth": 10,
                    "blogPostsPerMonth": 10,
                    "scriptsPerMonth": 50,
                    "imageEditsPerMonth": 50,
                    "socialPostsPerMonth": 50,
                    "youtubeResearchPerMonth": 20,
                    "titleGenPerMonth": 100,
                    "storageLimit": 10240, # 10GB
                    "maxVideoDuration": 180,
                    "maxImageResolution": "2048x2048",
                    "exportQuality": "hd"
                }
            ),
            SubscriptionPlan(
                name="Business",
                description="For agencies and teams",
                price_cents=9900, # $99.00
                currency="USD",
                interval="month",
                popular=False,
                features={
                    "videoGeneration": True,
                    "logoDesign": True,
                    "adCreation": True,
                    "flyerDesign": True,
                    "blogResearch": True,
                    "scriptGeneration": True,
                    "imageEditing": True,
                    "socialMediaPosts": True,
                    "titleGeneration": True,
                    "batchProcessing": True,
                    "prioritySupport": True,
                    "customBranding": True,
                    "analytics": True,
                    "apiAccess": True,
                    "whiteLabel": True
                },
                limits={
                    "monthlyCredits": 5000,
                    "creditRolloverDays": 90,
                    "overageRateCents": 300,
                    "videosPerMonth": -1,
                    "logosPerMonth": -1,
                    "adsPerMonth": -1,
                    "flyersPerMonth": -1,
                    "blogPostsPerMonth": -1,
                    "scriptsPerMonth": -1,
                    "imageEditsPerMonth": -1,
                    "socialPostsPerMonth": -1,
                    "youtubeResearchPerMonth": -1,
                    "titleGenPerMonth": -1,
                    "storageLimit": 102400, # 100GB
                    "maxVideoDuration": 600,
                    "maxImageResolution": "4096x4096",
                    "exportQuality": "premium"
                }
            )
        ]

        session.add_all(plans)
        session.commit()
        print(f"Successfully seeded {len(plans)} plans.")

if __name__ == "__main__":
    seed_plans()
