from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field

class ProjectBase(BaseModel):
    title: str
    type: str # 'video', 'logo', 'ad', 'flyer', 'social', 'social_post', 'scraping', etc
    status: str = 'draft'
    thumbnail_url: Optional[str] = None
    file_url: Optional[str] = None
    project_metadata: Optional[Any] = Field(default_factory=dict)

    class Config:
        populate_by_name = True

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    thumbnail_url: Optional[str] = None
    file_url: Optional[str] = None
    project_metadata: Optional[Any] = Field(None)

    class Config:
        populate_by_name = True
        from_attributes = True

class ProjectResponse(ProjectBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True
