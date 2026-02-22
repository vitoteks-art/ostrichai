from sqlalchemy import Column, String, DateTime, JSON, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, INET
import uuid
from ..database import Base

class ReferralClick(Base):
    __tablename__ = "referral_clicks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    referral_link_id = Column(UUID(as_uuid=True), ForeignKey("referral_links.id"), nullable=False, index=True)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("referral_campaigns.id"), nullable=False, index=True)
    referrer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    clicked_by_ip = Column(INET)
    clicked_by_user_agent = Column(String)
    clicked_by_fingerprint = Column(String)
    referrer_url = Column(String)
    device_info = Column(JSON, default=dict)
    click_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())