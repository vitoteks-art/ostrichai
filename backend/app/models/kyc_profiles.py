from sqlalchemy import Column, String, DateTime, JSON, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from ..database import Base

class KycProfile(Base):
    __tablename__ = "kyc_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    status = Column(String, nullable=False, default="required")  # required/pending/verified/rejected
    provider = Column(String)
    kyc_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
