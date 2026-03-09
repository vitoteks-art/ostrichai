from sqlalchemy import Column, String, DateTime, Integer, JSON, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..database import Base

class ReferralWithdrawal(Base):
    __tablename__ = "referral_withdrawals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    amount_cents = Column(Integer, nullable=False, default=0)
    currency = Column(String, nullable=False, default="USD")
    method = Column(String, nullable=False)  # bank/crypto
    status = Column(String, nullable=False, default="pending")  # pending/approved/paid/rejected
    kyc_status = Column(String, nullable=False, default="required")  # required/pending/verified/rejected
    payout_details = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
