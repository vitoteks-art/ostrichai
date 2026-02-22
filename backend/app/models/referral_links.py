from sqlalchemy import Column, String, DateTime, Text, Integer, JSON, func, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..database import Base

class ReferralLink(Base):
    __tablename__ = "referral_links"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("referral_campaigns.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    referral_code = Column(String, nullable=False, unique=True)
    short_url = Column(String)
    full_url = Column(String, nullable=False)
    clicks_count = Column(Integer, default=0)
    conversions_count = Column(Integer, default=0)
    points_earned = Column(Integer, default=0)
    status = Column(String, nullable=False, default='active')  # 'active', 'inactive', 'expired'
    expires_at = Column(DateTime(timezone=True))
    link_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (UniqueConstraint('campaign_id', 'user_id', name='unique_campaign_user'),)