from sqlalchemy import Column, Integer, Date, DateTime, String, JSON, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..database import Base

class UserUsage(Base):
    __tablename__ = "user_usage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("user_subscriptions.id"), index=True)
    feature_type = Column(String, nullable=False)
    usage_count = Column(Integer, nullable=False, default=1)
    usage_date = Column(Date, nullable=False, default=func.current_date())
    usage_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())