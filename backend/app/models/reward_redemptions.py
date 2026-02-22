from sqlalchemy import Column, String, DateTime, Integer, JSON, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..database import Base

class RewardRedemption(Base):
    __tablename__ = "reward_redemptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("referral_campaigns.id"), index=True)
    reward_type = Column(String, nullable=False)  # 'credits', 'discount', 'free_month', 'free_year', 'custom'
    reward_value = Column(String, nullable=False)
    points_spent = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default='pending')  # 'pending', 'approved', 'fulfilled', 'rejected'
    fulfilled_at = Column(DateTime(timezone=True))
    fulfilled_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    redemption_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())