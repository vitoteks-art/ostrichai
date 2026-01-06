from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from uuid import UUID

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class ProfileResponse(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str]
    phone: Optional[str]
    location: Optional[str]
    bio: Optional[str]
    avatar_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserSettingsUpdate(BaseModel):
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    profile_visibility: Optional[str] = None
    activity_tracking: Optional[bool] = None
    theme_preference: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None

class UserSettingsResponse(BaseModel):
    id: UUID
    email_notifications: bool
    push_notifications: bool
    profile_visibility: str
    activity_tracking: bool
    theme_preference: str
    language: str
    timezone: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

from typing import Dict, Any

class UserActivityBase(BaseModel):
    action: str
    details: Optional[str] = None
    activity_metadata: Optional[Any] = Field(default_factory=dict)

    class Config:
        populate_by_name = True

class UserActivityCreate(UserActivityBase):
    pass

class UserActivityResponse(UserActivityBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True