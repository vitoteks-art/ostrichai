from sqlalchemy import Column, String, DateTime, Integer, JSON, func, ForeignKey, CheckConstraint, Numeric
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..database import Base

class FacebookAdAccount(Base):
    __tablename__ = "facebook_ad_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    social_account_id = Column(UUID(as_uuid=True), ForeignKey("social_media_accounts.id", ondelete="CASCADE"))
    
    ad_account_id = Column(String, nullable=False, unique=True) # act_xxxx
    ad_account_name = Column(String)
    account_status = Column(String, server_default='active') # 'active', 'disabled', 'unsettled', 'pending_review'
    currency = Column(String, server_default='USD')
    timezone = Column(String, server_default='UTC')
    
    business_id = Column(String)
    business_name = Column(String)
    
    capabilities = Column(JSON, server_default='[]')
    spending_limit = Column(Numeric(10, 2))
    
    campaigns_count = Column(Integer, server_default='0')
    total_spend = Column(Numeric(10, 2), server_default='0')
    
    connected_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint(account_status.in_(['active', 'disabled', 'unsettled', 'pending_review'])),
    )

class FacebookCampaign(Base):
    __tablename__ = "facebook_campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    ad_account_id = Column(UUID(as_uuid=True), ForeignKey("facebook_ad_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("user_projects.id", ondelete="SET NULL"), index=True)
    
    campaign_id = Column(String) # fb campaign ID
    adset_id = Column(String) # fb ad set ID
    ad_id = Column(String) # fb ad ID
    
    campaign_name = Column(String, nullable=False)
    objective = Column(String, nullable=False) # OUTCOME_TRAFFIC, OUTCOME_ENGAGEMENT, OUTCOME_LEADS, OUTCOME_SALES
    status = Column(String, nullable=False, server_default='draft') # 'draft', 'creating', 'active', 'paused', 'completed', 'failed'
    
    budget_type = Column(String, nullable=False, server_default='daily') # 'daily', 'lifetime'
    budget_amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String, server_default='USD')
    
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    
    targeting = Column(JSON, nullable=False, server_default='{}')
    placements = Column(JSON, server_default='["facebook_feed", "instagram_feed"]')
    
    creative_data = Column(JSON, nullable=False)
    
    impressions = Column(Integer, server_default='0')
    clicks = Column(Integer, server_default='0')
    spend = Column(Numeric(10, 2), server_default='0')
    conversions = Column(Integer, server_default='0')
    
    error_message = Column(String)
    
    campaign_metadata = Column(JSON, server_default='{}')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint(status.in_(['draft', 'creating', 'active', 'paused', 'completed', 'failed'])),
        CheckConstraint(budget_type.in_(['daily', 'lifetime'])),
    )
