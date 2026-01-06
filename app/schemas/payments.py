from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class PaymentBase(BaseModel):
    amount_cents: int
    currency: str = "USD"
    provider: str  # flutterwave, paystack, polar, etc.
    metadata: Optional[Dict[str, Any]] = None

class PaymentCreate(PaymentBase):
    subscription_plan_id: Optional[str] = None
    email: str
    name: Optional[str] = None
    redirect_url: Optional[str] = None

class PaymentResponse(PaymentBase):
    id: str
    status: str
    payment_url: Optional[str] = None
    reference: str
    created_at: datetime

    class Config:
        from_attributes = True

class WebhookEvent(BaseModel):
    event: str
    data: Dict[str, Any]
    provider: str

class PaymentVerificationResponse(BaseModel):
    status: str
    message: str
    data: Dict[str, Any]

class TransactionRecord(BaseModel):
    provider: str
    reference: str
    amount_cents: int
    currency: str = "USD"
    status: str = "pending"
    subscription_id: Optional[str] = None
    payment_method: Optional[str] = None
    provider_response: Optional[Dict[str, Any]] = None

class TransactionUpdate(BaseModel):
    status: str
    verified_at: Optional[datetime] = None
    failure_reason: Optional[str] = None
    provider_response: Optional[Dict[str, Any]] = None
