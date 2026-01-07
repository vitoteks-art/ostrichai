from sqlalchemy import Column, String, DateTime, Boolean, JSON, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..database import Base

class ReferralFormSubmission(Base):
    __tablename__ = "referral_form_submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("referral_campaigns.id"), nullable=False, index=True)
    referral_code = Column(String, nullable=True)
    email = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    company = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    website = Column(String, nullable=True)
    message = Column(String, nullable=True)
    form_type = Column(String, nullable=False, default='contact')
    status = Column(String, nullable=False, default='pending')  # 'pending', 'contacted', 'converted', 'rejected'
    consent_given = Column(Boolean, default=False)
    metadata = Column(JSON, default=dict) # for storing notes etc
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
