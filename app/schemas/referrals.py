from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ReferralLinkBase(BaseModel):
    campaign_id: str

class ReferralLinkCreate(ReferralLinkBase):
    pass

class ReferralLinkResponse(ReferralLinkBase):
    id: str
    user_id: str
    referral_code: str
    full_url: str
    clicks_count: int
    conversions_count: int
    points_earned: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ReferralStatsResponse(BaseModel):
    total_referrals: int
    total_clicks: int
    total_conversions: int
    total_points: int
    recent_conversions: List[dict] = []
