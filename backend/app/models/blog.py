from sqlalchemy import Column, String, DateTime, Text, JSON, func, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid

from ..database import Base


class BlogPost(Base):
    __tablename__ = "blog_posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    title = Column(String, nullable=False)
    slug = Column(String, nullable=False, unique=True, index=True)
    excerpt = Column(Text)

    # Legacy markdown (kept for backward compatibility)
    content_md = Column(Text, nullable=False, default="")

    # Rich editor fields (TipTap)
    content_json = Column(JSON)
    content_html = Column(Text)
    toc = Column(JSON)

    status = Column(String, nullable=False, default="draft", index=True)  # draft|pending|approved|published

    category = Column(String)
    tags = Column(JSON, default=list)

    seo_title = Column(String)
    seo_description = Column(Text)
    cover_image_url = Column(String)

    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)

    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    published_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)

    approved_at = Column(DateTime(timezone=True))
    published_at = Column(DateTime(timezone=True))

    is_deleted = Column(Boolean, nullable=False, default=False, index=True)
    deleted_at = Column(DateTime(timezone=True))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class BlogComment(Base):
    __tablename__ = "blog_comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    post_id = Column(UUID(as_uuid=True), ForeignKey("blog_posts.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    body = Column(Text, nullable=False)

    status = Column(String, nullable=False, default="pending", index=True)  # pending|approved|rejected|spam

    moderated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    moderated_at = Column(DateTime(timezone=True))
    moderation_reason = Column(Text)

    is_deleted = Column(Boolean, nullable=False, default=False, index=True)
    deleted_at = Column(DateTime(timezone=True))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class BlogPostAuditLog(Base):
    __tablename__ = "blog_post_audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    post_id = Column(UUID(as_uuid=True), ForeignKey("blog_posts.id"), nullable=False, index=True)
    actor_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    action = Column(String, nullable=False)  # created|updated|status_change|deleted
    from_status = Column(String)
    to_status = Column(String)

    note = Column(Text)
    meta = Column(JSON, default=dict)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
