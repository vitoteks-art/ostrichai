from sqlalchemy import Column, String, DateTime, Integer, JSON, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..database import Base

class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("user_subscriptions.id"), index=True)

    # Transaction type
    transaction_type = Column(String, nullable=False)  # 'monthly_allocation', 'overage_purchase', 'manual_purchase', 'usage', 'rollover', 'expiration'

    # Credit amounts
    credits_before = Column(Integer, nullable=False, default=0)
    credits_after = Column(Integer, nullable=False, default=0)
    credits_changed = Column(Integer, nullable=False, default=0)

    # Cost information (for purchases)
    amount_cents = Column(Integer)
    currency = Column(String)

    # Feature usage details (for usage transactions)
    feature_type = Column(String)
    feature_count = Column(Integer, default=1)

    # Payment provider (for purchases)
    payment_provider = Column(String)
    provider_reference = Column(String)

    # Description and metadata
    description = Column(String)
    transaction_metadata = Column(JSON, default=dict)

    created_at = Column(DateTime(timezone=True), server_default=func.now())