from sqlalchemy import Column, String, DateTime, Integer, JSON, Boolean, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..database import Base

class UserSubscription(Base):
    __tablename__ = "user_subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("subscription_plans.id"), index=True)

    # Multi-provider payment support
    payment_provider = Column(String, nullable=False)  # 'flutterwave', 'paystack', 'polar', 'admin'
    provider_subscription_id = Column(String)
    provider_customer_id = Column(String)

    # Payment amount in cents (USD or NGN)
    amount_cents = Column(Integer, nullable=False, default=0)
    currency = Column(String, nullable=False, default='USD')

    # Credit system for hybrid pricing
    monthly_credits = Column(Integer, nullable=False, default=0)
    credit_balance = Column(Integer, nullable=False, default=0)
    overage_rate_cents = Column(Integer, nullable=False, default=450)
    credit_rollover_days = Column(Integer, default=0)
    overage_settings = Column(JSON, default=lambda: {"auto_reload": True, "manual_topup": False, "monthly_cap_cents": None})

    # Subscription status
    status = Column(String, nullable=False)  # 'active', 'canceled', 'past_due', 'incomplete', 'trialing', 'pending_approval', 'expired'
    current_period_start = Column(DateTime(timezone=True))
    current_period_end = Column(DateTime(timezone=True))
    cancel_at_period_end = Column(Boolean, default=False)
    trial_end = Column(DateTime(timezone=True))

    # Customer details
    customer_name = Column(String)
    customer_phone = Column(String)
    billing_address = Column(JSON)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())