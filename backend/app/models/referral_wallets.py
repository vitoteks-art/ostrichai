from sqlalchemy import Column, String, DateTime, Integer, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from ..database import Base

class ReferralWallet(Base):
    __tablename__ = "referral_wallets"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    balance_cents = Column(Integer, nullable=False, default=0)
    pending_cents = Column(Integer, nullable=False, default=0)
    currency = Column(String, nullable=False, default="USD")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
