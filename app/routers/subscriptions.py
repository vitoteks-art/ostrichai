from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import SubscriptionPlan, UserSubscription, User, UserUsage, CreditTransaction
from ..schemas.subscriptions import SubscriptionPlanResponse, UserSubscriptionResponse, CreditUsageRequest, CreditUsageResponse
from ..auth.dependencies import get_current_user

router = APIRouter()

@router.get("/plans", response_model=list[SubscriptionPlanResponse])
async def get_plans(db: Session = Depends(get_db)):
    plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.active == True).order_by(SubscriptionPlan.price_cents).all()
    return plans

@router.get("/my-subscription", response_model=UserSubscriptionResponse)
async def get_my_subscription(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == current_user.id,
        UserSubscription.status.in_(['active', 'pending_approval', 'expired'])
    ).order_by(UserSubscription.created_at.desc()).first()

    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")

    return subscription

@router.get("/usage")
async def get_usage_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get current usage for the user
    usage = db.query(UserUsage).filter(UserUsage.user_id == current_user.id).all()
    return usage

@router.get("/credit-balance")
async def get_credit_balance(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == current_user.id,
        UserSubscription.status == 'active'
    ).first()

    if not subscription:
        return {"balance": 0, "monthly_allocation": 0}

    return {
        "balance": subscription.credit_balance,
        "monthly_allocation": subscription.monthly_credits,
        "overage_rate_cents": subscription.overage_rate_cents
    }

@router.post("/track-usage")
async def track_usage(
    feature_type: str,
    amount: int = 1,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get user's subscription
    subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == current_user.id,
        UserSubscription.status == 'active'
    ).first()

    if not subscription:
        raise HTTPException(status_code=400, detail="No active subscription found")

    # Create usage record
    usage = UserUsage(
        user_id=current_user.id,
        subscription_id=subscription.id,
        feature_type=feature_type,
        usage_count=amount
    )
    db.add(usage)
    db.commit()

    return {"success": True, "usage_recorded": amount}

@router.post("/use-credits", response_model=CreditUsageResponse)
async def use_credits(
    request: CreditUsageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Get user's active subscription
    subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == current_user.id,
        UserSubscription.status == 'active'
    ).first()

    if not subscription:
        return CreditUsageResponse(
            success=False,
            remaining_balance=0,
            detail="No active subscription found. Please upgrade your plan."
        )

    # 2. Check balance
    if subscription.credit_balance < request.credits_needed:
        return CreditUsageResponse(
            success=False,
            remaining_balance=subscription.credit_balance,
            detail=f"Insufficient credits. You need {request.credits_needed} but have {subscription.credit_balance}."
        )

    try:
        # 3. Record balance before
        credits_before = subscription.credit_balance
        
        # 4. Deduct credits
        subscription.credit_balance -= request.credits_needed
        credits_after = subscription.credit_balance
        
        # 5. Create usage record
        usage = UserUsage(
            user_id=current_user.id,
            subscription_id=subscription.id,
            feature_type=request.feature_type,
            usage_count=request.feature_count
        )
        db.add(usage)
        
        # 6. Create credit transaction record
        transaction = CreditTransaction(
            user_id=current_user.id,
            subscription_id=subscription.id,
            transaction_type='usage',
            credits_before=credits_before,
            credits_after=credits_after,
            credits_changed=-request.credits_needed,
            feature_type=request.feature_type,
            feature_count=request.feature_count,
            description=f"Usage: {request.feature_type}"
        )
        db.add(transaction)
        
        # 7. Commit changes
        db.commit()
        db.refresh(usage)
        db.refresh(transaction)
        
        return CreditUsageResponse(
            success=True,
            remaining_balance=subscription.credit_balance,
            usage_id=usage.id,
            transaction_id=transaction.id
        )
        
    except Exception as e:
        db.rollback()
        return CreditUsageResponse(
            success=False,
            remaining_balance=subscription.credit_balance,
            detail=f"Error processing credit usage: {str(e)}"
        )