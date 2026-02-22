from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, func, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from sqlalchemy.orm import relationship
from ..database import Base

class MeetingType(Base):
    __tablename__ = "meeting_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    duration = Column(Integer, nullable=False)  # in minutes
    description = Column(Text, nullable=True)
    location = Column(String, nullable=True)
    active = Column(Boolean, default=True)
    color = Column(String, default="#3b82f6")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meeting_type_id = Column(UUID(as_uuid=True), ForeignKey("meeting_types.id"), nullable=False)
    meeting_type_name = Column(String, nullable=False)
    client_name = Column(String, nullable=False)
    client_email = Column(String, nullable=False)
    client_phone = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String, default="confirmed")  # confirmed, cancelled, completed
    date = Column(String, nullable=False)  # YYYY-MM-DD
    time = Column(String, nullable=False)  # HH:mm
    duration = Column(Integer, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User")
    meeting_type = relationship("MeetingType")

class AvailabilitySetting(Base):
    __tablename__ = "availability_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    day_of_week = Column(String, nullable=False)  # monday, tuesday, etc.
    enabled = Column(Boolean, default=True)
    start_time = Column(String, nullable=False)  # HH:mm
    end_time = Column(String, nullable=False)  # HH:mm
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User")

class BookingSetting(Base):
    __tablename__ = "booking_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    min_notice_hours = Column(Integer, default=4)
    max_days_in_advance = Column(Integer, default=60)
    buffer_minutes = Column(Integer, default=0)
    n8n_webhook_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User")
