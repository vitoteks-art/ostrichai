from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import User, ReferralLink, ReferralConversion, ReferralCampaign, UserPoints, ReferralClick, RewardRedemption, ReferralFormSubmission, ReferralReward, ReferralWallet, ReferralWithdrawal, KycProfile, CreditTransaction, UserSubscription
from ..schemas.referrals import ReferralStatsResponse, ReferralLinkResponse, ReferralCampaignResponse, UserPointsResponse, PublicLandingResponse, ReferralClickCreate, ReferralConversionCreate, RewardRedeemRequest, RewardRedeemResponse, ReferralFormSubmissionCreate, ReferralCampaignCreate, ReferralCampaignUpdate, ReferralEarningsSummary, ReferralEarningsReferralItem, ReferralRewardItem, ReferralWithdrawalItem, ReferralWithdrawalRequest, ReferralRedeemCreditsRequest, KycStatusResponse, KycStartRequest
from ..auth.dependencies import get_current_user, get_current_admin_user
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta
import uuid
from ..config import settings

router = APIRouter()

REFERRAL_WINDOW_DAYS = 30
REFERRAL_REWARD_PERCENT = 0.10
WITHDRAW_MIN_CENTS = 5000


def get_or_create_wallet(db: Session, user_id: UUID, currency: str = "USD") -> ReferralWallet:
    wallet = db.query(ReferralWallet).filter(ReferralWallet.user_id == user_id).first()
    if not wallet:
        wallet = ReferralWallet(user_id=user_id, balance_cents=0, pending_cents=0, currency=currency)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet


def get_or_create_kyc(db: Session, user_id: UUID) -> KycProfile:
    profile = db.query(KycProfile).filter(KycProfile.user_id == user_id).first()
    if not profile:
        profile = KycProfile(user_id=user_id, status="required")
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.get("/public/landing", response_model=PublicLandingResponse)
async def get_public_landing_content(
    campaign_id: UUID,
    referral_code: str,
    db: Session = Depends(get_db)
):
    campaign = db.query(ReferralCampaign).filter(ReferralCampaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Get referrer info from link
    link = db.query(ReferralLink).filter(
        ReferralLink.referral_code == referral_code,
        ReferralLink.campaign_id == campaign_id
    ).first()

    referrer_info = None
    if link:
        referrer = db.query(User).filter(User.id == link.user_id).first()
        if referrer:
            referrer_info = {
                "full_name": referrer.full_name or "A fellow creator",
                "avatar_url": referrer.avatar_url
            }

    return PublicLandingResponse(
        campaign=campaign,
        referrer=referrer_info
    )

@router.post("/campaigns", response_model=ReferralCampaignResponse)
async def create_referral_campaign(
    request: ReferralCampaignCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    campaign = ReferralCampaign(
        creator_id=current_user.id,
        name=request.name,
        description=request.description,
        start_date=request.start_date or datetime.utcnow(),
        end_date=request.end_date,
        status='draft',
        reward_config=request.reward_config or {},
        sharing_config=request.sharing_config or {}
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign

@router.get("/campaigns", response_model=List[ReferralCampaignResponse])
async def get_referral_campaigns(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    campaigns = db.query(ReferralCampaign).filter(ReferralCampaign.creator_id == current_user.id).all()
    return campaigns

@router.delete("/campaigns/{campaign_id}")
async def delete_referral_campaign(
    campaign_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    campaign = db.query(ReferralCampaign).filter(
        ReferralCampaign.id == campaign_id,
        ReferralCampaign.creator_id == current_user.id
    ).first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    db.delete(campaign)
    db.commit()
    return {"success": True}

@router.get("/points", response_model=UserPointsResponse)
async def get_user_points(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    points = db.query(UserPoints).filter(UserPoints.user_id == current_user.id).first()
    if not points:
        return UserPointsResponse(
            user_id=str(current_user.id),
            total_points=0,
            available_points=0,
            points_used=0,
            current_tier="none",
            last_activity_at=current_user.created_at
        )
    return points

@router.get("/leaderboard")
async def get_referral_leaderboard(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    # Simplified leaderboard based on total points
    top_points = db.query(UserPoints).order_by(UserPoints.total_points.desc()).limit(limit).all()
    leaderboard = []
    for p in top_points:
        user = db.query(User).filter(User.id == p.user_id).first()
        leaderboard.append({
            "user_id": str(p.user_id),
            "full_name": user.full_name if user else "Anonymous",
            "total_points": p.total_points,
            "rank": 0 # Logic to be added
        })
    return leaderboard

@router.get("/link", response_model=ReferralLinkResponse)
async def get_referral_link(
    campaign_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ReferralLink).filter(ReferralLink.user_id == current_user.id)
    if campaign_id:
        query = query.filter(ReferralLink.campaign_id == campaign_id)
    link = query.first()

    if not link:
        if not campaign_id:
            campaign = db.query(ReferralCampaign).filter(ReferralCampaign.creator_id == current_user.id).first()
            if not campaign:
                raise HTTPException(status_code=404, detail="No referral campaign found")
            campaign_id = campaign.id

        referral_code = uuid.uuid4().hex[:8]
        base_url = settings.vite_app_url or "https://getostrichai.com"
        full_url = f"{base_url}/ref/{campaign_id}/{referral_code}"

        link = ReferralLink(
            campaign_id=campaign_id,
            user_id=current_user.id,
            referral_code=referral_code,
            full_url=full_url,
            clicks_count=0,
            conversions_count=0,
            points_earned=0,
            status='active'
        )
        db.add(link)
        db.commit()
        db.refresh(link)

    return link

@router.get("/stats", response_model=ReferralStatsResponse)
async def get_referral_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    points = db.query(UserPoints).filter(UserPoints.user_id == current_user.id).first()
    total_referrals = db.query(ReferralConversion).filter(ReferralConversion.referrer_id == current_user.id).count()

    # Placeholder for clicks count
    total_clicks = 0

    return ReferralStatsResponse(
        total_referrals=total_referrals,
        total_clicks=total_clicks,
        total_conversions=total_referrals,
        total_points=points.total_points if points else 0
    )

@router.post("/click")
async def track_referral_click(
    request: ReferralClickCreate,
    db: Session = Depends(get_db)
):
    # Find the link
    link = db.query(ReferralLink).filter(
        ReferralLink.referral_code == request.referral_code,
        ReferralLink.campaign_id == request.campaign_id
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Referral link not found")

    # Create click record
    click = ReferralClick(
        referral_link_id=link.id,
        campaign_id=request.campaign_id,
        referrer_id=link.user_id,
        clicked_by_ip=request.ip,
        clicked_by_user_agent=request.user_agent,
        clicked_by_fingerprint=request.fingerprint,
        referrer_url=request.referrer_url,
        device_info=request.device_info
    )
    db.add(click)

    # Update link stats
    link.clicks_count += 1

    db.commit()
    return {"success": True}

@router.post("/conversion")
async def record_conversion(
    request: ReferralConversionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find the link
    link = db.query(ReferralLink).filter(ReferralLink.id == request.referral_link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Referral link not found")

    # Block self-referrals
    if str(link.user_id) == str(request.converted_user_id):
        return {"success": False, "detail": "Self-referral not allowed"}

    # Only allow one referral conversion per user (any link)
    existing_user_conversion = db.query(ReferralConversion).filter(
        ReferralConversion.converted_user_id == request.converted_user_id
    ).first()
    if existing_user_conversion:
        return {"success": False, "detail": "User already referred"}

    # Check if existing conversion for this link
    existing = db.query(ReferralConversion).filter(
        ReferralConversion.referral_link_id == request.referral_link_id,
        ReferralConversion.converted_user_id == request.converted_user_id
    ).first()

    if existing:
        return {"success": False, "detail": "Conversion already recorded"}

    # Get campaign points config
    campaign = db.query(ReferralCampaign).filter(ReferralCampaign.id == link.campaign_id).first()
    points_to_award = campaign.reward_config.get('points_per_conversion', 500) if campaign else 500

    if request.type in ['subscription', 'purchase']:
        points_to_award *= 2

    expires_at = None
    if request.type == 'signup':
        expires_at = datetime.utcnow() + timedelta(days=REFERRAL_WINDOW_DAYS)

    # Create conversion record
    conversion = ReferralConversion(
        referral_link_id=request.referral_link_id,
        campaign_id=link.campaign_id,
        referrer_id=link.user_id,
        converted_user_id=request.converted_user_id,
        conversion_type=request.type,
        points_awarded=points_to_award,
        conversion_value=request.value,
        status='pending',
        conversion_metadata=request.metadata,
        expires_at=expires_at
    )
    db.add(conversion)

    # Update link stats
    link.conversions_count += 1
    link.points_earned += points_to_award

    # Update user points
    user_points = db.query(UserPoints).filter(UserPoints.user_id == link.user_id).first()
    if not user_points:
        user_points = UserPoints(
            user_id=link.user_id,
            total_points=points_to_award,
            available_points=points_to_award,
            points_used=0,
            current_tier='none'
        )
        db.add(user_points)
    else:
        user_points.total_points += points_to_award
        user_points.available_points += points_to_award

    db.commit()
    return {"success": True, "points_awarded": points_to_award}

@router.post("/redeem", response_model=RewardRedeemResponse)
async def redeem_reward(
    request: RewardRedeemRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get user points
    user_points = db.query(UserPoints).filter(UserPoints.user_id == current_user.id).first()
    if not user_points or user_points.available_points < request.points_spent:
        raise HTTPException(status_code=400, detail="Insufficient points")

    # Create redemption record
    redemption = RewardRedemption(
        user_id=current_user.id,
        campaign_id=request.campaign_id,
        reward_type=request.reward_type,
        reward_value="", # To be filled by fulfillment logic
        points_spent=request.points_spent,
        status='pending'
    )
    db.add(redemption)

    # Deduct points
    user_points.available_points -= request.points_spent
    user_points.points_used += request.points_spent

    db.commit()
    db.refresh(redemption)
    return redemption

@router.post("/process-conversions")
async def process_conversions(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    # Find all pending conversions
    conversions = db.query(ReferralConversion).filter(ReferralConversion.status == 'pending').all()

    processed_count = 0
    for conv in conversions:
        # Simplified: Auto-approve for now
        conv.status = 'completed'
        processed_count += 1

        # In a real app, update link stats and user points here (already done in record_conversion usually)
        # But if we were doing batch processing, we'd do it here.

    db.commit()
    return {"processed_count": processed_count}

@router.post("/form-submission")
async def submit_referral_form(
    request: ReferralFormSubmissionCreate,
    db: Session = Depends(get_db)
):
    # Save submission
    submission = ReferralFormSubmission(
        campaign_id=request.campaign_id,
        referral_code=request.referral_code,
        email=request.email,
        full_name=request.full_name,
        company=request.company,
        phone=request.phone,
        website=request.website,
        message=request.message,
        form_type=request.form_type,
        status='pending',
        consent_given=request.consent_given
    )
    db.add(submission)
    db.commit()
    return {"success": True}

from ..schemas.referrals import ReferralFormSubmissionsPaginatedResponse, ReferralFormSubmissionResponse, ReferralFormSubmissionUpdate

@router.get("/campaigns/{campaign_id}/submissions", response_model=ReferralFormSubmissionsPaginatedResponse)
async def get_campaign_submissions(
    campaign_id: UUID,
    page: int = 1,
    limit: int = 50,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify user owns the campaign
    campaign = db.query(ReferralCampaign).filter(
        ReferralCampaign.id == campaign_id,
        ReferralCampaign.creator_id == current_user.id
    ).first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    query = db.query(ReferralFormSubmission).filter(ReferralFormSubmission.campaign_id == campaign_id)

    if status:
        query = query.filter(ReferralFormSubmission.status == status)

    total = query.count()
    submissions = query.order_by(ReferralFormSubmission.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return ReferralFormSubmissionsPaginatedResponse(
        submissions=submissions,
        total=total,
        page=page,
        limit=limit,
        totalPages=(total + limit - 1) // limit
    )

@router.patch("/campaigns/{campaign_id}/submissions/{submission_id}", response_model=ReferralFormSubmissionResponse)
async def update_submission_status(
    campaign_id: UUID,
    submission_id: UUID,
    update: ReferralFormSubmissionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify user owns the campaign
    campaign = db.query(ReferralCampaign).filter(
        ReferralCampaign.id == campaign_id,
        ReferralCampaign.creator_id == current_user.id
    ).first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    submission = db.query(ReferralFormSubmission).filter(
        ReferralFormSubmission.id == submission_id,
        ReferralFormSubmission.campaign_id == campaign_id
    ).first()

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    submission.status = update.status
    if update.notes:
        submission.submission_metadata = {**(submission.submission_metadata or {}), "notes": update.notes}

    db.commit()
    db.refresh(submission)
    return submission

@router.post("/cleanup-submissions")
async def cleanup_submissions(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    # Basic cleanup: delete old submissions (e.g., older than 2 years as a placeholder)
    # In a real app, this would use a more complex logic or GDPR retention rules
    # Here we'll just return success for now
    return {"success": True, "deleted_count": 0}

@router.get("/campaigns/{campaign_id}/analytics")
async def get_campaign_analytics_detailed(
    campaign_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify user owns the campaign
    campaign = db.query(ReferralCampaign).filter(
        ReferralCampaign.id == campaign_id,
        ReferralCampaign.creator_id == current_user.id
    ).first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    total_clicks = db.query(ReferralClick).filter(ReferralClick.campaign_id == campaign_id).count()
    total_conversions = db.query(ReferralConversion).filter(ReferralConversion.campaign_id == campaign_id).count()

    return {
        "totalClicks": total_clicks,
        "totalConversions": total_conversions,
        "conversionRate": (total_conversions / total_clicks * 100) if total_clicks > 0 else 0,
        "viralCoefficient": 0, # Placeholder
        "topReferrers": [], # Placeholder
        "dailyStats": [], # Placeholder
        "revenueGenerated": 0 # Placeholder
    }

@router.get("/earnings/summary", response_model=ReferralEarningsSummary)
async def get_referral_earnings_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total_clicks = db.query(func.coalesce(func.sum(ReferralLink.clicks_count), 0)).filter(
        ReferralLink.user_id == current_user.id
    ).scalar() or 0

    total_signups = db.query(ReferralConversion).filter(
        ReferralConversion.referrer_id == current_user.id
    ).count()

    total_qualified = db.query(ReferralConversion).filter(
        ReferralConversion.referrer_id == current_user.id,
        ReferralConversion.status.in_(["qualified", "completed"])
    ).count()

    earned_cents = db.query(func.coalesce(func.sum(ReferralReward.amount_cents), 0)).filter(
        ReferralReward.referrer_id == current_user.id,
        ReferralReward.status.in_(["credited", "withdrawn", "approved"])
    ).scalar() or 0

    pending_cents = db.query(func.coalesce(func.sum(ReferralReward.amount_cents), 0)).filter(
        ReferralReward.referrer_id == current_user.id,
        ReferralReward.status == "pending"
    ).scalar() or 0

    wallet = get_or_create_wallet(db, current_user.id)

    return ReferralEarningsSummary(
        total_clicks=total_clicks,
        total_signups=total_signups,
        total_qualified=total_qualified,
        earned_cents=earned_cents,
        pending_cents=pending_cents,
        available_cents=wallet.balance_cents,
        currency=wallet.currency
    )


@router.get("/earnings/referrals", response_model=List[ReferralEarningsReferralItem])
async def get_referral_earnings_referrals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversions = db.query(ReferralConversion).filter(
        ReferralConversion.referrer_id == current_user.id
    ).order_by(ReferralConversion.created_at.desc()).all()

    results: List[ReferralEarningsReferralItem] = []
    for conv in conversions:
        referred_user = db.query(User).filter(User.id == conv.converted_user_id).first()
        reward = db.query(ReferralReward).filter(
            ReferralReward.referral_conversion_id == conv.id
        ).first()
        results.append(
            ReferralEarningsReferralItem(
                referred_user_id=str(conv.converted_user_id),
                referred_email=referred_user.email if referred_user else None,
                signup_date=conv.created_at,
                status=conv.status,
                amount_cents=reward.amount_cents if reward else None
            )
        )
    return results


@router.get("/earnings/rewards", response_model=List[ReferralRewardItem])
async def get_referral_earnings_rewards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rewards = db.query(ReferralReward).filter(
        ReferralReward.referrer_id == current_user.id
    ).order_by(ReferralReward.created_at.desc()).all()

    items: List[ReferralRewardItem] = []
    for reward in rewards:
        referred_user = db.query(User).filter(User.id == reward.referred_user_id).first()
        items.append(
            ReferralRewardItem(
                id=str(reward.id),
                referred_email=referred_user.email if referred_user else None,
                amount_cents=reward.amount_cents,
                currency=reward.currency,
                status=reward.status,
                created_at=reward.created_at
            )
        )
    return items


@router.get("/earnings/withdrawals", response_model=List[ReferralWithdrawalItem])
async def get_referral_earnings_withdrawals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    withdrawals = db.query(ReferralWithdrawal).filter(
        ReferralWithdrawal.user_id == current_user.id
    ).order_by(ReferralWithdrawal.created_at.desc()).all()

    return [
        ReferralWithdrawalItem(
            id=str(w.id),
            amount_cents=w.amount_cents,
            currency=w.currency,
            method=w.method,
            status=w.status,
            kyc_status=w.kyc_status,
            created_at=w.created_at
        )
        for w in withdrawals
    ]


@router.post("/earnings/withdraw", response_model=ReferralWithdrawalItem)
async def request_referral_withdrawal(
    request: ReferralWithdrawalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    wallet = get_or_create_wallet(db, current_user.id)
    kyc = get_or_create_kyc(db, current_user.id)

    if kyc.status != "verified":
        raise HTTPException(status_code=400, detail="KYC not verified")

    if request.amount_cents < WITHDRAW_MIN_CENTS:
        raise HTTPException(status_code=400, detail=f"Minimum withdrawal is {WITHDRAW_MIN_CENTS // 100} USD")

    if wallet.balance_cents < request.amount_cents:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    wallet.balance_cents -= request.amount_cents

    withdrawal = ReferralWithdrawal(
        user_id=current_user.id,
        amount_cents=request.amount_cents,
        currency=wallet.currency,
        method=request.method,
        status="pending",
        kyc_status=kyc.status,
        payout_details=request.payout_details
    )
    db.add(withdrawal)
    db.commit()
    db.refresh(withdrawal)

    return ReferralWithdrawalItem(
        id=str(withdrawal.id),
        amount_cents=withdrawal.amount_cents,
        currency=withdrawal.currency,
        method=withdrawal.method,
        status=withdrawal.status,
        kyc_status=withdrawal.kyc_status,
        created_at=withdrawal.created_at
    )


@router.post("/earnings/redeem-credits")
async def redeem_referral_credits(
    request: ReferralRedeemCreditsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    wallet = get_or_create_wallet(db, current_user.id)

    if wallet.balance_cents < request.amount_cents:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == current_user.id,
        UserSubscription.status == "active"
    ).first()

    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")

    credits_to_add = int(request.amount_cents / 100)
    if credits_to_add <= 0:
        raise HTTPException(status_code=400, detail="Amount too small to convert to credits")

    credits_before = subscription.credit_balance
    subscription.credit_balance += credits_to_add
    credits_after = subscription.credit_balance

    wallet.balance_cents -= request.amount_cents

    transaction = CreditTransaction(
        user_id=current_user.id,
        subscription_id=subscription.id,
        transaction_type='referral_credit',
        credits_before=credits_before,
        credits_after=credits_after,
        credits_changed=credits_to_add,
        description=f"Referral rewards redeemed to credits: {credits_to_add}"
    )
    db.add(transaction)
    db.commit()

    return {"success": True, "credits_added": credits_to_add, "new_balance": subscription.credit_balance}


@router.get("/earnings/kyc", response_model=KycStatusResponse)
async def get_kyc_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = get_or_create_kyc(db, current_user.id)
    return KycStatusResponse(status=profile.status, provider=profile.provider, metadata=profile.kyc_metadata)


@router.post("/earnings/kyc", response_model=KycStatusResponse)
async def start_kyc(
    request: KycStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = get_or_create_kyc(db, current_user.id)
    profile.status = "pending"
    profile.provider = request.provider
    profile.kyc_metadata = request.metadata or {}
    db.commit()
    db.refresh(profile)
    return KycStatusResponse(status=profile.status, provider=profile.provider, metadata=profile.kyc_metadata)


@router.post("/admin/withdrawals/{withdrawal_id}/approve")
async def approve_withdrawal(
    withdrawal_id: UUID,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    withdrawal = db.query(ReferralWithdrawal).filter(ReferralWithdrawal.id == withdrawal_id).first()
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    withdrawal.status = "approved"
    db.commit()
    return {"success": True}


@router.post("/admin/withdrawals/{withdrawal_id}/reject")
async def reject_withdrawal(
    withdrawal_id: UUID,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    withdrawal = db.query(ReferralWithdrawal).filter(ReferralWithdrawal.id == withdrawal_id).first()
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    withdrawal.status = "rejected"
    db.commit()
    return {"success": True}
