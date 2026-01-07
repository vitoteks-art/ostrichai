from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

class UserAdminView(BaseModel):
    id: UUID
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool
    is_admin: bool
    is_superuser: bool
    created_at: datetime
    role: str = "user"
    # Add other relevant fields for admin view

    class Config:
        from_attributes = True

class TransactionAdminView(BaseModel):
    id: UUID
    user_id: UUID
    amount_cents: int
    currency: str
    status: str
    provider: str
    reference: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class AdminStats(BaseModel):
    total_users: int
    total_revenue_cents: int
    active_subscriptions: int

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None

class UserStatusUpdate(BaseModel):
    is_active: bool

class SubscriptionAdminView(BaseModel):
    id: UUID
    user_id: UUID
    plan_id: UUID
    status: str
    amount_cents: int
    currency: str
    customer_name: Optional[str] = None
    provider_customer_id: Optional[str] = None
    created_at: datetime
    plan: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class SubscriptionAssignRequest(BaseModel):
    user_id: UUID
    plan_id: UUID
    reason: Optional[str] = None

class SubscriptionExtendRequest(BaseModel):
    days: int
    reason: Optional[str] = None
