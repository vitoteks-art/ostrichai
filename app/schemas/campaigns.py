from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class FacebookAdAccountBase(BaseModel):
    ad_account_id: str
    ad_account_name: Optional[str] = None
    account_status: str = "active"
    currency: str = "USD"
    timezone: str = "UTC"
    business_id: Optional[str] = None
    business_name: Optional[str] = None

class FacebookAdAccountCreate(FacebookAdAccountBase):
    social_account_id: Optional[UUID] = None

class FacebookAdAccountResponse(FacebookAdAccountBase):
    id: UUID
    user_id: UUID
    social_account_id: Optional[UUID] = None
    capabilities: List[str] = []
    spending_limit: Optional[Decimal] = None
    campaigns_count: int
    total_spend: Decimal
    connected_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FacebookCampaignBase(BaseModel):
    campaign_name: str
    objective: str
    budget_type: str = "daily"
    budget_amount: Decimal
    currency: str = "USD"
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    targeting: dict = {}
    placements: List[str] = ["facebook_feed", "instagram_feed"]
    creative_data: dict

class FacebookCampaignCreate(FacebookCampaignBase):
    ad_account_id: UUID
    project_id: Optional[UUID] = None

class FacebookCampaignUpdate(BaseModel):
    campaign_id: Optional[str] = None
    adset_id: Optional[str] = None
    ad_id: Optional[str] = None
    status: Optional[str] = None
    impressions: Optional[int] = None
    clicks: Optional[int] = None
    spend: Optional[Decimal] = None
    conversions: Optional[int] = None
    error_message: Optional[str] = None
    campaign_metadata: Optional[dict] = None

class FacebookCampaignResponse(FacebookCampaignBase):
    id: UUID
    user_id: UUID
    ad_account_id: UUID
    project_id: Optional[UUID] = None
    campaign_id: Optional[str] = None
    adset_id: Optional[str] = None
    ad_id: Optional[str] = None
    status: str
    impressions: int
    clicks: int
    spend: Decimal
    conversions: int
    error_message: Optional[str] = None
    campaign_metadata: dict
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
