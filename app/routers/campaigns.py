from typing import List, Optional, Dict, Any
import httpx
import sys
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

from ..database import get_db
from ..models import FacebookAdAccount, FacebookCampaign, SocialMediaAccount, User
from ..schemas.campaigns import (
    FacebookAdAccountCreate, FacebookAdAccountResponse,
    FacebookCampaignCreate, FacebookCampaignUpdate, FacebookCampaignResponse
)
from ..auth.dependencies import get_current_user

router = APIRouter(tags=["Ad Campaigns"])

@router.get("/ad-accounts", response_model=List[FacebookAdAccountResponse])
async def get_ad_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(FacebookAdAccount).filter(FacebookAdAccount.user_id == current_user.id).all()

@router.post("/ad-accounts", response_model=FacebookAdAccountResponse)
async def create_ad_account_record(
    account: FacebookAdAccountCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_account = db.query(FacebookAdAccount).filter(
        FacebookAdAccount.user_id == current_user.id,
        FacebookAdAccount.ad_account_id == account.ad_account_id
    ).first()

    if db_account:
        for var, value in vars(account).items():
            setattr(db_account, var, value)
    else:
        db_account = FacebookAdAccount(**account.dict(), user_id=current_user.id)
        db.add(db_account)
    
    db.commit()
    db.refresh(db_account)
    return db_account

@router.get("/campaigns", response_model=List[FacebookCampaignResponse])
async def get_campaigns(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(FacebookCampaign).filter(
        FacebookCampaign.user_id == current_user.id
    ).order_by(FacebookCampaign.created_at.desc()).offset(skip).limit(limit).all()

@router.post("/campaigns", response_model=FacebookCampaignResponse)
async def create_campaign_record(
    campaign: FacebookCampaignCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_campaign = FacebookCampaign(**campaign.dict(), user_id=current_user.id)
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    return db_campaign

@router.patch("/campaigns/{campaign_id}", response_model=FacebookCampaignResponse)
async def update_campaign_status(
    campaign_id: UUID,
    updates: FacebookCampaignUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_campaign = db.query(FacebookCampaign).filter(
        FacebookCampaign.id == campaign_id,
        FacebookCampaign.user_id == current_user.id
    ).first()
    
    if not db_campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    update_data = updates.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_campaign, key, value)
        
    db.commit()
    db.refresh(db_campaign)
    return db_campaign

@router.post("/sync")
async def sync_campaign_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Synchronizes analytics for active Facebook campaigns.
    """
    # Fetch active campaigns
    campaigns = db.query(FacebookCampaign).filter(
        FacebookCampaign.user_id == current_user.id,
        FacebookCampaign.status == 'active'
    ).all()

    if not campaigns:
        return {"status": "success", "updated_count": 0, "message": "No active campaigns to sync"}

    updated_count = 0
    async with httpx.AsyncClient() as client:
        for campaign in campaigns:
            ad_account = db.query(FacebookAdAccount).filter(FacebookAdAccount.id == campaign.ad_account_id).first()
            if not ad_account:
                continue
            
            social_account = db.query(SocialMediaAccount).filter(SocialMediaAccount.id == ad_account.social_account_id).first()
            if not social_account:
                continue
                
            try:
                # GET graph.facebook.com/v18.0/{campaign_id}/insights?fields=impressions,clicks,spend&access_token={token}
                url = f"https://graph.facebook.com/v18.0/{campaign.campaign_id}/insights"
                params = {
                    "fields": "impressions,clicks,spend",
                    "access_token": social_account.access_token
                }
                response = await client.get(url, params=params)
                data = response.json()
                
                if "data" in data and len(data["data"]) > 0:
                    insights = data["data"][0]
                    campaign.impressions = int(insights.get("impressions", 0))
                    campaign.clicks = int(insights.get("clicks", 0))
                    campaign.spend = float(insights.get("spend", 0.0))
                    updated_count += 1
            except Exception as e:
                print(f"Error syncing campaign {campaign.campaign_id}: {str(e)}", file=sys.stderr)

    db.commit()
    return {"status": "success", "updated_count": updated_count}
