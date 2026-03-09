from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

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

class UserPointsResponse(BaseModel):
    user_id: str
    total_points: int
    available_points: int
    points_used: int
    current_tier: str
    last_activity_at: datetime

class ReferralCampaignResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    status: str
    reward_config: dict
    sharing_config: dict
    created_at: datetime

    class Config:
        from_attributes = True

class PublicLandingResponse(BaseModel):
    campaign: ReferralCampaignResponse
    referrer: Optional[Dict[str, Any]] = None

class ReferralClickCreate(BaseModel):
    referral_code: str
    campaign_id: UUID
    ip: Optional[str] = None
    user_agent: Optional[str] = None
    fingerprint: Optional[str] = None
    referrer_url: Optional[str] = None
    device_info: Optional[Dict[str, Any]] = None

class ReferralConversionCreate(BaseModel):
    referral_link_id: UUID
    converted_user_id: UUID
    type: str # 'signup', 'subscription', 'purchase'
    value: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

class RewardRedeemRequest(BaseModel):
    campaign_id: UUID
    reward_type: str
    points_spent: int

class RewardRedeemResponse(BaseModel):
    id: str
    user_id: str
    reward_type: str
    reward_value: str
    points_spent: int
    status: str
    created_at: datetime

class ReferralEarningsSummary(BaseModel):
    total_clicks: int
    total_signups: int
    total_qualified: int
    earned_cents: int
    pending_cents: int
    available_cents: int
    currency: str

class ReferralEarningsReferralItem(BaseModel):
    referred_user_id: str
    referred_email: Optional[str] = None
    signup_date: datetime
    status: str
    amount_cents: Optional[int] = None

class ReferralRewardItem(BaseModel):
    id: str
    referred_email: Optional[str] = None
    amount_cents: int
    currency: str
    status: str
    created_at: datetime

class ReferralWithdrawalItem(BaseModel):
    id: str
    amount_cents: int
    currency: str
    method: str
    status: str
    kyc_status: str
    created_at: datetime

class ReferralWithdrawalRequest(BaseModel):
    amount_cents: int
    method: str
    payout_details: Dict[str, Any]

class ReferralRedeemCreditsRequest(BaseModel):
    amount_cents: int

class KycStatusResponse(BaseModel):
    status: str
    provider: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class KycStartRequest(BaseModel):
    provider: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ReferralFormSubmissionCreate(BaseModel):
    campaign_id: UUID
    referral_code: Optional[str] = None
    email: str
    full_name: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    message: Optional[str] = None
    form_type: str
    consent_given: bool

class ReferralCampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    reward_config: Optional[Dict[str, Any]] = None
    sharing_config: Optional[Dict[str, Any]] = None

class ReferralCampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    reward_config: Optional[Dict[str, Any]] = None
    sharing_config: Optional[Dict[str, Any]] = None

class ReferralFormSubmissionResponse(BaseModel):
    id: UUID
    campaign_id: UUID
    referral_code: Optional[str]
    email: str
    full_name: Optional[str]
    company: Optional[str]
    phone: Optional[str]
    website: Optional[str]
    message: Optional[str]
    form_type: str
    status: str
    consent_given: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ReferralFormSubmissionsPaginatedResponse(BaseModel):
    submissions: List[ReferralFormSubmissionResponse]
    total: int
    page: int
    limit: int
    totalPages: int

class ReferralFormSubmissionUpdate(BaseModel):
    status: str
    notes: Optional[str] = None
