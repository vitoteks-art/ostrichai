from sqlalchemy import Column, String, DateTime, Integer, JSON, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, INET
import uuid
from ..database import Base

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("user_subscriptions.id"), index=True)

    # Multi-provider support
    payment_provider = Column(String, nullable=False)  # 'flutterwave', 'paystack', 'polar', 'admin'
    provider_reference = Column(String, nullable=False)
    provider_transaction_id = Column(String)

    # Transaction details
    amount_cents = Column(Integer, nullable=False, default=0)
    currency = Column(String, nullable=False, default='USD')
    status = Column(String, nullable=False)  # 'pending', 'success', 'failed', 'cancelled'

    # Payment methods
    payment_method = Column(String)  # 'card', 'bank_transfer', 'ussd', 'mobile_money', 'qr'
    bank_name = Column(String)
    account_number = Column(String)

    # Response data from providers
    provider_response = Column(JSON)

    # Error tracking
    failure_reason = Column(String)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    verified_at = Column(DateTime(timezone=True))