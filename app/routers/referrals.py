from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.dependencies import get_current_user
from ..models import User, ReferralLink, ReferralConversion
from ..schemas.referrals import ReferralStatsResponse, ReferralLinkResponse

router = APIRouter()

@router.get("/link", response_model=ReferralLinkResponse)
async def get_referral_link(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    link = db.query(ReferralLink).filter(ReferralLink.user_id == current_user.id).first()
    if not link:
        # Create one if it doesn't exist (simplified logic)
        # In reality, you probably need a campaign_id
        raise HTTPException(status_code=404, detail="Referral link not found")
    return link

@router.get("/stats", response_model=ReferralStatsResponse)
async def get_referral_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Aggregation logic would be here
    total_referrals = db.query(ReferralConversion).filter(ReferralConversion.referrer_id == current_user.id).count()
    return ReferralStatsResponse(
        total_referrals=total_referrals,
        total_clicks=0, # Placeholder
        total_conversions=total_referrals,
        total_points=0
    )