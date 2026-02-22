from sqlalchemy import Column, String, DateTime, Text, JSON, Boolean, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..database import Base

class ReferralCampaign(Base):
    __tablename__ = "referral_campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text)
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    start_date = Column(DateTime(timezone=True), server_default=func.now())
    end_date = Column(DateTime(timezone=True))
    status = Column(String, nullable=False, default='active')  # 'draft', 'active', 'paused', 'completed'
    reward_config = Column(JSON, default=dict)
    sharing_config = Column(JSON, default=dict)
    landing_page_config = Column(JSON, default=dict)
    analytics = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())