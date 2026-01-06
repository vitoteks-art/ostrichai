from sqlalchemy import Column, String, DateTime, Integer, JSON, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..database import Base

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("user_subscriptions.id"), index=True)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("payment_transactions.id"), index=True)

    # Invoice details
    invoice_number = Column(String, unique=True, nullable=False)
    amount_cents = Column(Integer, nullable=False, default=0)
    currency = Column(String, nullable=False, default='USD')

    # Customer details
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    customer_phone = Column(String)

    # Items breakdown
    line_items = Column(JSON, nullable=False)

    # Tax information
    subtotal_cents = Column(Integer, nullable=False, default=0)
    vat_rate = Column(Integer, default=0)  # Percentage
    vat_amount_cents = Column(Integer, default=0)
    discount_amount_cents = Column(Integer, default=0)
    total_amount_cents = Column(Integer, nullable=False, default=0)

    # Status
    status = Column(String, nullable=False)  # 'draft', 'sent', 'paid', 'overdue', 'cancelled'
    due_date = Column(DateTime(timezone=True))
    paid_at = Column(DateTime(timezone=True))

    # File storage
    pdf_url = Column(String)
    download_url = Column(String)

    created_at = Column(DateTime(timezone=True), server_default=func.now())