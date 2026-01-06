from sqlalchemy import Column, Date, DateTime, Integer, JSON, func, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..database import Base

class ReferralAnalytics(Base):
    __tablename__ = "referral_analytics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("referral_campaigns.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    total_clicks = Column(Integer, default=0)
    total_conversions = Column(Integer, default=0)
    total_points_awarded = Column(Integer, default=0)
    viral_coefficient = Column(Integer, default=0)
    top_referrer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    top_referrer_clicks = Column(Integer, default=0)
    new_users_acquired = Column(Integer, default=0)
    revenue_generated = Column(Integer, default=0)
    analytics_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (UniqueConstraint('campaign_id', 'date', name='unique_campaign_date'),)