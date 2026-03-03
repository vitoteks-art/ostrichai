from pydantic import BaseModel
from typing import Optional, List, Any
from uuid import UUID
from datetime import datetime


# ---------- Posts ----------

class BlogPostBase(BaseModel):
    title: str
    slug: str
    excerpt: Optional[str] = None

    # Legacy markdown (optional; kept for backward compatibility)
    content_md: Optional[str] = ""

    # Rich editor fields (TipTap)
    content_json: Optional[Any] = None
    content_html: Optional[str] = None
    toc: Optional[Any] = None

    category: Optional[str] = None
    tags: List[str] = []

    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    cover_image_url: Optional[str] = None


class BlogPostCreate(BlogPostBase):
    status: Optional[str] = "draft"


class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    excerpt: Optional[str] = None

    # Legacy markdown
    content_md: Optional[str] = None

    # Rich editor fields
    content_json: Optional[Any] = None
    content_html: Optional[str] = None
    toc: Optional[Any] = None

    category: Optional[str] = None
    tags: Optional[List[str]] = None

    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    cover_image_url: Optional[str] = None

    status: Optional[str] = None


class BlogPostResponse(BlogPostBase):
    id: UUID
    status: str

    created_by: UUID
    updated_by: Optional[UUID] = None

    approved_by: Optional[UUID] = None
    published_by: Optional[UUID] = None

    approved_at: Optional[datetime] = None
    published_at: Optional[datetime] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BlogPostListResponse(BaseModel):
    items: List[BlogPostResponse]
    total: int
    page: int
    page_size: int


# ---------- Comments ----------

class BlogCommentCreate(BaseModel):
    body: str


class BlogCommentResponse(BaseModel):
    id: UUID
    post_id: UUID
    user_id: UUID
    body: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class BlogCommentListResponse(BaseModel):
    items: List[BlogCommentResponse]
    total: int


# ---------- Admin moderation ----------

class BlogCommentModerateRequest(BaseModel):
    status: str  # approved|rejected|spam
    reason: Optional[str] = None


# ---------- Audit ----------

class BlogAuditLogResponse(BaseModel):
    id: UUID
    post_id: UUID
    actor_user_id: UUID
    action: str
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    note: Optional[str] = None
    meta: Any = None
    created_at: datetime

    class Config:
        from_attributes = True
