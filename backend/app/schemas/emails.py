from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID

class EmailTemplateBase(BaseModel):
    name: str
    subject: str
    html_content: str
    text_content: Optional[str] = None
    type: str
    variables: List[str] = []
    is_active: bool = True

class EmailTemplateCreate(EmailTemplateBase):
    pass

class EmailTemplateResponse(EmailTemplateBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class EmailCampaignBase(BaseModel):
    name: str
    subject: str
    content: str
    template_id: Optional[UUID] = None
    status: str = "draft"
    recipients: List[Any]
    scheduled_at: Optional[datetime] = None
    cc: List[str] = []
    bcc: List[str] = []

class EmailCampaignCreate(EmailCampaignBase):
    pass

class EmailCampaignResponse(EmailCampaignBase):
    id: UUID
    stats: dict
    sent_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class EmailSendBase(BaseModel):
    campaign_id: Optional[UUID] = None
    recipient_email: EmailStr
    recipient_name: Optional[str] = None
    recipient_id: Optional[str] = None
    subject: str
    content: str
    status: str = "pending"
    message_id: Optional[str] = None
    error_message: Optional[str] = None
    webhook_response: Optional[dict] = None

class EmailSendCreate(EmailSendBase):
    pass

class EmailSendResponse(EmailSendBase):
    id: UUID
    sent_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
