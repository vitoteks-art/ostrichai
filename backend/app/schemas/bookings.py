from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class MeetingTypeBase(BaseModel):
    name: str
    duration: int
    description: Optional[str] = None
    location: Optional[str] = None
    active: bool = True
    color: str = "#3b82f6"

class MeetingTypeCreate(MeetingTypeBase):
    pass

class MeetingTypeResponse(MeetingTypeBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AppointmentBase(BaseModel):
    meeting_type_id: UUID
    meeting_type_name: str
    client_name: str
    client_email: EmailStr
    client_phone: Optional[str] = None
    notes: Optional[str] = None
    status: str = "confirmed"
    date: str
    time: str
    duration: int

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentResponse(AppointmentBase):
    id: UUID
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AvailabilitySettingBase(BaseModel):
    day_of_week: str
    enabled: bool = True
    start_time: str
    end_time: str

class AvailabilitySettingCreate(AvailabilitySettingBase):
    pass

class AvailabilitySettingResponse(AvailabilitySettingBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BookingSettingBase(BaseModel):
    min_notice_hours: int = 4
    max_days_in_advance: int = 60
    buffer_minutes: int = 0
    n8n_webhook_url: Optional[str] = None

class BookingSettingCreate(BookingSettingBase):
    pass

class BookingSettingResponse(BookingSettingBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
