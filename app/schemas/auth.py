from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: Optional[str]
    is_active: bool
    is_verified: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class EmailVerificationRequest(BaseModel):
    email: EmailStr
    code: str

# Session Schemas
class SessionCreate(BaseModel):
    session_token: str

class SessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    session_token: str
    is_active: bool
    login_at: datetime
    logout_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True