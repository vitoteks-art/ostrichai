from sqlalchemy import Column, String, DateTime, Text, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from ..database import Base

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    email = Column(String, nullable=False)
    full_name = Column(String)
    phone = Column(String)
    location = Column(String)
    bio = Column(Text)
    avatar_url = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())