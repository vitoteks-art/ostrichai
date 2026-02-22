from sqlalchemy import Column, String, DateTime, Text, JSON, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..database import Base

class UserProject(Base):
    __tablename__ = "user_projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    type = Column(String, nullable=False)  # 'video', 'logo', 'ad', 'flyer', 'social', 'social_post', 'scraping', 'image_edit', 'youtube', 'script', 'title_generation', 'blog', 'background_remove'
    status = Column(String, nullable=False, default='draft')  # 'draft', 'processing', 'completed', 'failed'
    thumbnail_url = Column(String)
    file_url = Column(String)
    # Mapping 'project_metadata' python attribute to 'metadata' database column
    # We avoid using 'metadata' as attribute name because it conflicts with SQLAlchemy Base.metadata
    project_metadata = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())