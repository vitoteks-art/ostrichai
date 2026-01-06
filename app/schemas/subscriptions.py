from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

class SubscriptionPlanResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    price_cents: int
    currency: str
    interval: str
    features: Dict[str, Any]
    limits: Dict[str, Any]
    popular: bool
    trial_days: int
    active: bool
    polar_product_price_id: Optional[str]
    polar_checkout_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CreditUsageRequest(BaseModel):
    feature_type: str
    credits_needed: int
    feature_count: int = 1

class CreditUsageResponse(BaseModel):
    success: bool
    remaining_balance: int
    usage_id: Optional[UUID] = None
    transaction_id: Optional[UUID] = None
    detail: Optional[str] = None

class UserSubscriptionResponse(BaseModel):
    id: UUID
    user_id: UUID
    plan_id: Optional[UUID]
    payment_provider: str
    provider_subscription_id: Optional[str]
    provider_customer_id: Optional[str]
    amount_cents: int
    currency: str
    monthly_credits: int
    credit_balance: int
    overage_rate_cents: int
    credit_rollover_days: int
    overage_settings: Dict[str, Any]
    status: str
    current_period_start: Optional[datetime]
    current_period_end: Optional[datetime]
    cancel_at_period_end: bool
    trial_end: Optional[datetime]
    customer_name: Optional[str]
    customer_phone: Optional[str]
    billing_address: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True