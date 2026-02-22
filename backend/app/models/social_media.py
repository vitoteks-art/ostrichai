from sqlalchemy import Column, String, DateTime, Integer, JSON, func, ForeignKey, CheckConstraint, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..database import Base

class SocialMediaAccount(Base):
    __tablename__ = "social_media_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    platform = Column(String, nullable=False) # 'facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'google'
    platform_user_id = Column(String, nullable=False)
    platform_username = Column(String)
    account_name = Column(String)
    profile_picture_url = Column(String)
    
    access_token = Column(String, nullable=False)
    refresh_token = Column(String)
    token_expires_at = Column(DateTime(timezone=True))
    
    account_type = Column(String, server_default='personal') # 'personal', 'business', 'page'
    permissions = Column(JSON, server_default='[]')
    account_status = Column(String, server_default='active') # 'active', 'expired', 'revoked', 'error'
    
    last_error = Column(String)
    last_error_at = Column(DateTime(timezone=True))
    
    posts_count = Column(Integer, server_default='0')
    last_posted_at = Column(DateTime(timezone=True))
    
    connected_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint(platform.in_(['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'google'])),
        CheckConstraint(account_type.in_(['personal', 'business', 'page'])),
        CheckConstraint(account_status.in_(['active', 'expired', 'revoked', 'error'])),
    )

class SocialMediaPost(Base):
    __tablename__ = "social_media_posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(UUID(as_uuid=True), ForeignKey("social_media_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("user_projects.id", ondelete="SET NULL"), index=True)
    
    platform = Column(String, nullable=False)
    post_text = Column(Text)
    image_urls = Column(JSON, server_default='[]')
    video_url = Column(String)
    
    platform_post_id = Column(String)
    platform_post_url = Column(String)
    post_type = Column(String, server_default='post') # 'post', 'story', 'reel', 'tweet', 'article'
    
    status = Column(String, nullable=False, server_default='pending') # 'pending', 'posting', 'published', 'failed', 'deleted'
    scheduled_for = Column(DateTime(timezone=True))
    posted_at = Column(DateTime(timezone=True))
    
    error_message = Column(Text)
    retry_count = Column(Integer, server_default='0')
    
    likes_count = Column(Integer, server_default='0')
    comments_count = Column(Integer, server_default='0')
    shares_count = Column(Integer, server_default='0')
    impressions_count = Column(Integer, server_default='0')
    last_analytics_update = Column(DateTime(timezone=True))
    
    post_metadata = Column(JSON, server_default='{}')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint(platform.in_(['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'google'])),
        CheckConstraint(post_type.in_(['post', 'story', 'reel', 'tweet', 'article'])),
        CheckConstraint(status.in_(['pending', 'posting', 'published', 'failed', 'deleted'])),
    )

class ScheduledPost(Base):
    __tablename__ = "scheduled_posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    post_text = Column(String, nullable=False)
    image_urls = Column(JSON, server_default='[]')
    video_url = Column(String)
    
    target_accounts = Column(JSON, nullable=False) # Array of account IDs
    
    scheduled_time = Column(DateTime(timezone=True), nullable=False)
    timezone = Column(String, server_default='UTC')
    
    status = Column(String, nullable=False, server_default='scheduled') # 'scheduled', 'processing', 'completed', 'failed', 'cancelled'
    
    processed_at = Column(DateTime(timezone=True))
    result = Column(JSON) # Results from posting to each account
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint(status.in_(['scheduled', 'processing', 'completed', 'failed', 'cancelled'])),
    )
