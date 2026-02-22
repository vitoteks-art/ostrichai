from sqlalchemy import Column, String, DateTime, Text, Boolean, JSON, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..database import Base

class UserNotification(Base):
    __tablename__ = "user_notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, nullable=False, default='info')  # 'info', 'success', 'warning', 'error'
    read = Column(Boolean, default=False)
    notification_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())