from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, func, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid
from sqlalchemy.orm import relationship
from ..database import Base

class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    html_content = Column(Text, nullable=False)
    text_content = Column(Text, nullable=True)
    type = Column(String, nullable=False)  # promotional, transactional, etc.
    variables = Column(JSON, default=list)  # List of variable names
    is_active = Column(Boolean, default=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    creator = relationship("User")

class EmailCampaign(Base):
    __tablename__ = "email_campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    template_id = Column(UUID(as_uuid=True), ForeignKey("email_templates.id"), nullable=True)
    status = Column(String, default="draft")  # draft, scheduled, sending, sent, failed
    recipients = Column(JSON, nullable=False)  # List of recipient objects
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    stats = Column(JSON, default=dict)  # total, sent, opened, clicked, etc.
    cc = Column(JSON, default=list)
    bcc = Column(JSON, default=list)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    creator = relationship("User")
    template = relationship("EmailTemplate")

class EmailSend(Base):
    __tablename__ = "email_sends"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("email_campaigns.id"), nullable=True)
    recipient_email = Column(String, nullable=False)
    recipient_name = Column(String, nullable=True)
    recipient_id = Column(String, nullable=True)  # External ID if any
    subject = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    status = Column(String, default="pending")  # pending, sent, failed
    message_id = Column(String, nullable=True)  # Internal/Provider message ID
    error_message = Column(Text, nullable=True)
    webhook_response = Column(JSON, nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    campaign = relationship("EmailCampaign")

class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    send_id = Column(UUID(as_uuid=True), ForeignKey("email_sends.id"), nullable=True)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("email_campaigns.id"), nullable=True)
    level = Column(String, default="info")  # info, warning, error
    message = Column(Text, nullable=False)
    log_metadata = Column('metadata', JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    send = relationship("EmailSend")
    campaign = relationship("EmailCampaign")
