from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

class UserAdminView(BaseModel):
    id: UUID
    email: EmailStr
    is_active: bool
    is_superuser: bool
    created_at: datetime
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
