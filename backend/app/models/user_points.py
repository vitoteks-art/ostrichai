from sqlalchemy import Column, Integer, String, DateTime, JSON, func, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..database import Base

class UserPoints(Base):
    __tablename__ = "user_points"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("referral_campaigns.id"), index=True)
    total_points = Column(Integer, default=0)
    available_points = Column(Integer, default=0)
    points_used = Column(Integer, default=0)
    current_tier = Column(String, default='none')  # 'none', 'bronze', 'silver', 'gold', 'platinum'
    lifetime_earned = Column(Integer, default=0)
    last_activity_at = Column(DateTime(timezone=True), server_default=func.now())
    points_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (UniqueConstraint('user_id', 'campaign_id', name='unique_user_campaign_points'),)