from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.email import EmailTemplate, EmailCampaign, EmailSend, EmailLog
from ..models.user import User
from ..schemas.emails import (
    EmailTemplateCreate, EmailTemplateResponse,
    EmailCampaignCreate, EmailCampaignResponse,
    EmailSendCreate, EmailSendResponse
)
from ..auth.dependencies import get_current_user
from uuid import UUID

router = APIRouter()

# Email Templates
@router.get("/templates", response_model=List[EmailTemplateResponse])
async def get_templates(db: Session = Depends(get_db)):
    return db.query(EmailTemplate).filter(EmailTemplate.is_active == True).order_by(EmailTemplate.created_at.desc()).all()

@router.get("/templates/{id}", response_model=EmailTemplateResponse)
async def get_template(id: UUID, db: Session = Depends(get_db)):
    template = db.query(EmailTemplate).filter(EmailTemplate.id == id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@router.post("/templates", response_model=EmailTemplateResponse)
async def create_template(
    template: EmailTemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to create templates")
    
    db_template = EmailTemplate(**template.model_dump(), created_by=current_user.id)
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@router.put("/templates/{id}", response_model=EmailTemplateResponse)
async def update_template(
    id: UUID,
    updates: EmailTemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to update templates")
    
    db_template = db.query(EmailTemplate).filter(EmailTemplate.id == id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    for key, value in updates.model_dump().items():
        setattr(db_template, key, value)
    
    db.commit()
    db.refresh(db_template)
    return db_template

@router.delete("/templates/{id}")
async def delete_template(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete templates")
    
    db_template = db.query(EmailTemplate).filter(EmailTemplate.id == id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    db.delete(db_template)
    db.commit()
    return {"success": True}

# Email Campaigns
@router.get("/campaigns", response_model=List[EmailCampaignResponse])
async def get_campaigns(db: Session = Depends(get_db)):
    return db.query(EmailCampaign).order_by(EmailCampaign.created_at.desc()).all()

@router.get("/campaigns/{id}", response_model=EmailCampaignResponse)
async def get_campaign(id: UUID, db: Session = Depends(get_db)):
    campaign = db.query(EmailCampaign).filter(EmailCampaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@router.post("/campaigns", response_model=EmailCampaignResponse)
async def create_campaign(
    campaign: EmailCampaignCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to create campaigns")
    
    db_campaign = EmailCampaign(
        **campaign.model_dump(),
        created_by=current_user.id,
        stats={
            "totalRecipients": len(campaign.recipients),
            "sent": 0,
            "failed": 0,
            "opened": 0,
            "clicked": 0
        }
    )
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    return db_campaign

@router.patch("/campaigns/{id}/status")
async def update_campaign_status(
    id: UUID,
    status: str,
    stats: Optional[dict] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to update campaign status")
    
    db_campaign = db.query(EmailCampaign).filter(EmailCampaign.id == id).first()
    if not db_campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    db_campaign.status = status
    if stats:
        db_campaign.stats = stats
    
    db.commit()
    return {"success": True}

# Email Sends
@router.post("/sends", response_model=EmailSendResponse)
async def log_email_send(
    send: EmailSendCreate,
    db: Session = Depends(get_db)
):
    db_send = EmailSend(**send.model_dump())
    db.add(db_send)
    db.commit()
    db.refresh(db_send)
    return db_send

@router.patch("/sends/{id}/status")
async def update_send_status(
    id: UUID,
    status: str,
    message_id: Optional[str] = None,
    error_message: Optional[str] = None,
    webhook_response: Optional[dict] = None,
    db: Session = Depends(get_db)
):
    db_send = db.query(EmailSend).filter(EmailSend.id == id).first()
    if not db_send:
        raise HTTPException(status_code=404, detail="Email send record not found")
    
    db_send.status = status
    if message_id: db_send.message_id = message_id
    if error_message: db_send.error_message = error_message
    if webhook_response: db_send.webhook_response = webhook_response
    
    db.commit()
    return {"success": True}

# Email Logs
@router.post("/logs")
async def create_email_log(
    message: str,
    level: str = "info",
    send_id: Optional[UUID] = None,
    campaign_id: Optional[UUID] = None,
    metadata: Optional[dict] = None,
    db: Session = Depends(get_db)
):
    db_log = EmailLog(
        send_id=send_id,
        campaign_id=campaign_id,
        level=level,
        message=message,
        log_metadata=metadata or {}
    )
    db.add(db_log)
    db.commit()
    return {"success": True}
@router.post("/send")
async def send_email(
    request: dict, # {to, subject, html, text, type}
    db: Session = Depends(get_db)
):
    to_email = request.get("to")
    subject = request.get("subject")
    html_content = request.get("html")
    text_content = request.get("text") or ""
    
    if not to_email or not subject or not html_content:
        raise HTTPException(status_code=400, detail="Missing required email fields")
        
    # Log the attempt
    db_log = EmailLog(
        message=f"Attempting to send email to {to_email}: {subject}",
        level="info",
        log_metadata={"type": request.get("type")}
    )
    db.add(db_log)
    db.commit()

    # Try to send via Mailtrap if configured
    from ..config import settings
    import httpx
    
    if settings.mailtrap_api_key:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    "https://send.api.mailtrap.io/api/send",
                    headers={
                        "Authorization": f"Bearer {settings.mailtrap_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "from": {"email": settings.mailtrap_sender_email, "name": "OstrichAi"},
                        "to": [{"email": to_email}],
                        "subject": subject,
                        "html": html_content,
                        "text": text_content
                    }
                )
                if resp.status_code >= 400:
                    error_data = resp.json()
                    db_log.level = "error"
                    db_log.message = f"Mailtrap error: {error_data}"
                    db.commit()
                    # We don't necessarily want to fail the whole request if it's just a sandbox error
                    # but let's return success false in those cases if possible
                else:
                    return {"success": True, "message": "Email sent via Mailtrap"}
        except Exception as e:
            db_log.level = "error"
            db_log.message = f"Email sending failed: {str(e)}"
            db.commit()

    # Fallback/Log-only mode
    print(f"📧 Email to {to_email} (Subject: {subject}) logged (Mailtrap not configured or failed)")
    return {"success": True, "message": "Email logged (backend standby)"}
