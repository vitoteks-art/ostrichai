from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

from ..database import get_db
from ..models import FacebookAdAccount, FacebookCampaign, User
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
