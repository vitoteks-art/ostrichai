from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class SocialMediaAccountBase(BaseModel):
    platform: str
    platform_user_id: str
    platform_username: Optional[str] = None
    account_name: Optional[str] = None
    profile_picture_url: Optional[str] = None
    account_type: str = "personal"
    permissions: List[str] = []

class SocialMediaAccountCreate(SocialMediaAccountBase):
    access_token: str
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None

class SocialMediaAccountUpdate(BaseModel):
    platform_username: Optional[str] = None
    account_name: Optional[str] = None
    profile_picture_url: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    account_status: Optional[str] = None
    last_error: Optional[str] = None

class SocialMediaAccountResponse(SocialMediaAccountBase):
    id: UUID
    user_id: UUID
    account_status: str
    posts_count: int
    last_posted_at: Optional[datetime] = None
    connected_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SocialMediaPostBase(BaseModel):
    platform: str
    post_text: Optional[str] = None
    image_urls: List[str] = []
    video_url: Optional[str] = None
    post_type: str = "post"
    post_metadata: Optional[dict] = {}
    scheduled_for: Optional[datetime] = None

class SocialMediaPostCreate(SocialMediaPostBase):
    account_id: UUID
    project_id: Optional[UUID] = None

class SocialMediaPostResponse(SocialMediaPostBase):
    id: UUID
    user_id: UUID
    account_id: UUID
    project_id: Optional[UUID] = None
    platform_post_id: Optional[str] = None
    platform_post_url: Optional[str] = None
    status: str
    posted_at: Optional[datetime] = None
    error_message: Optional[str] = None
    likes_count: int
    comments_count: int
    shares_count: int
    impressions_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class ScheduledPostBase(BaseModel):
    post_text: str
    image_urls: List[str] = []
    video_url: Optional[str] = None
    target_accounts: List[UUID]
    scheduled_time: datetime
    timezone: str = "UTC"

class ScheduledPostCreate(ScheduledPostBase):
    pass

class ScheduledPostResponse(ScheduledPostBase):
    id: UUID
    user_id: UUID
    status: str
    processed_at: Optional[datetime] = None
    result: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SocialMediaPublishRequest(BaseModel):
    account_id: UUID
    content: dict # Structure: text, imageUrls, videoUrl, hashtags, etc.
    project_id: Optional[UUID] = None
