from sqlalchemy import Column, String, DateTime, Integer, JSON, func, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..database import Base

class ReferralConversion(Base):
    __tablename__ = "referral_conversions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    referral_link_id = Column(UUID(as_uuid=True), ForeignKey("referral_links.id"), nullable=False, index=True)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("referral_campaigns.id"), nullable=False, index=True)
    referrer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    converted_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    conversion_type = Column(String, nullable=False, default='signup')  # 'signup', 'subscription', 'purchase'
    points_awarded = Column(Integer, default=0)
    reward_tier = Column(String)
    status = Column(String, nullable=False, default='pending')  # 'pending', 'approved', 'rejected', 'completed'
    conversion_value = Column(Integer)
    conversion_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (UniqueConstraint('referral_link_id', 'converted_user_id', name='unique_referral_conversion'),)