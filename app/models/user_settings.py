from sqlalchemy import Column, Boolean, String, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from ..database import Base

class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    email_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=False)
    profile_visibility = Column(String, default='public')  # 'public', 'private'
    activity_tracking = Column(Boolean, default=True)
    theme_preference = Column(String, default='system')  # 'light', 'dark', 'system'
    language = Column(String, default='en')
    timezone = Column(String, default='UTC')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())