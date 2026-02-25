from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import SubscriptionPlan, UserSubscription, User, UserUsage, CreditTransaction
from ..schemas.subscriptions import SubscriptionPlanResponse, UserSubscriptionResponse, CreditUsageRequest, CreditUsageResponse, UserUsageResponse
from ..auth.dependencies import get_current_user
from typing import List
from uuid import UUID

router = APIRouter()

@router.get("/plans", response_model=list[SubscriptionPlanResponse])
async def get_plans(db: Session = Depends(get_db)):
    plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.active == True).order_by(SubscriptionPlan.price_cents).all()
    return plans

from typing import Optional

@router.get("/my-subscription", response_model=Optional[UserSubscriptionResponse])
async def get_my_subscription(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == current_user.id,
        UserSubscription.status.in_(['active', 'pending_approval', 'expired'])
    ).order_by(UserSubscription.created_at.desc()).first()

    return subscription

@router.get("/has-trial")
async def has_had_trial(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if user has or ever had a free subscription
    count = db.query(UserSubscription).filter(
        UserSubscription.user_id == current_user.id,
        UserSubscription.amount_cents == 0
    ).count()
    return {"has_had_trial": count > 0}

@router.get("/usage", response_model=List[UserUsageResponse])
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
    request_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    feature_type = request_data.get("feature_type")
    amount = request_data.get("amount", 1)
    metadata = request_data.get("metadata", {})

    if not feature_type:
        raise HTTPException(status_code=400, detail="feature_type is required")

    # Get user's subscription
    subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == current_user.id,
        UserSubscription.status == 'active'
    ).first()

    if not subscription:
        # We might want to allow tracking usage even without active sub if it's free feature
        # but the model requires subscription_id? Let's check the schema.
        # Actually in models/user_usage.py subscription_id is nullable. So it's fine.
        subscription_id = None
    else:
        subscription_id = subscription.id

    # Create usage record
    usage = UserUsage(
        user_id=current_user.id,
        subscription_id=subscription_id,
        feature_type=feature_type,
        usage_count=amount,
        usage_metadata=metadata
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

@router.post("/purchase-credits")
async def purchase_credits(
    request_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add credits to a user's subscription after payment is verified client-side.

    This replaces the old Supabase RPC `purchase_overage_credits`.
    """

    credits_to_purchase = int(request_data.get("credits_to_purchase", 0) or 0)
    provider = request_data.get("payment_provider")
    provider_reference = request_data.get("provider_reference")
    amount_cents = int(request_data.get("amount_cents", 0) or 0)
    currency = request_data.get("currency") or "USD"

    if credits_to_purchase <= 0:
        raise HTTPException(status_code=400, detail="credits_to_purchase must be > 0")

    # Get user's active subscription
    subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == current_user.id,
        UserSubscription.status == 'active'
    ).first()

    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")

    try:
        credits_before = subscription.credit_balance
        subscription.credit_balance += credits_to_purchase
        credits_after = subscription.credit_balance

        # Record credit transaction
        transaction = CreditTransaction(
            user_id=current_user.id,
            subscription_id=subscription.id,
            transaction_type='topup',
            credits_before=credits_before,
            credits_after=credits_after,
            credits_changed=credits_to_purchase,
            feature_type='credit_purchase',
            feature_count=1,
            description=f"Credit purchase via {provider} ({provider_reference}) amount={amount_cents}{currency}"
        )
        db.add(transaction)

        db.commit()
        db.refresh(transaction)

        return {
            "success": True,
            "new_balance": subscription.credit_balance,
            "transaction_id": str(transaction.id)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to purchase credits: {str(e)}")


@router.post("")
async def create_subscription(
    request_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan_id = request_data.get("plan_id")
    payment_provider = request_data.get("payment_provider")
    payment_data = request_data.get("payment_data")
    
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    subscription = UserSubscription(
        user_id=current_user.id,
        plan_id=plan_id,
        payment_provider=payment_provider,
        status='pending_approval' if payment_provider != 'admin' else 'active',
        amount_cents=plan.price_cents,
        currency=plan.currency or 'USD',
        monthly_credits=plan.limits.get("monthlyCredits", 0) if plan.limits else 0,
        credit_balance=plan.limits.get("monthlyCredits", 0) if plan.limits else 0,
        customer_name=current_user.full_name
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription

@router.post("/{subscription_id}/cancel")
async def cancel_subscription(
    subscription_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subscription = db.query(UserSubscription).filter(
        UserSubscription.id == subscription_id,
        UserSubscription.user_id == current_user.id
    ).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
        
    subscription.status = 'canceled'
    db.commit()
    return {"status": "success"}

@router.post("/{subscription_id}/approve")
async def approve_subscription(
    subscription_id: UUID,
    db: Session = Depends(get_db)
):
    subscription = db.query(UserSubscription).filter(UserSubscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
        
    subscription.status = 'active'
    db.commit()
    return {"status": "success"}

@router.post("/{subscription_id}/reject")
async def reject_subscription(
    subscription_id: UUID,
    db: Session = Depends(get_db)
):
    subscription = db.query(UserSubscription).filter(UserSubscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
        
    subscription.status = 'rejected'
    db.commit()
    return {"status": "success"}

@router.post("/{subscription_id}/set-pending")
async def set_subscription_pending(
    subscription_id: UUID,
    db: Session = Depends(get_db)
):
    subscription = db.query(UserSubscription).filter(UserSubscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
        
    subscription.status = 'pending_approval'
    db.commit()
    return {"status": "success"}
