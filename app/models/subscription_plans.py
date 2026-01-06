from sqlalchemy import Column, String, DateTime, Integer, JSON, Boolean, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..database import Base

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String)
    price_cents = Column(Integer, nullable=False, default=0)
    currency = Column(String, nullable=False, default='USD')
    interval = Column(String, nullable=False)  # 'month', 'year', 'week'
    features = Column(JSON, nullable=False)
    limits = Column(JSON, nullable=False)
    popular = Column(Boolean, default=False)
    trial_days = Column(Integer, default=0)
    active = Column(Boolean, default=True)
    polar_product_price_id = Column(String)
    polar_checkout_url = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())