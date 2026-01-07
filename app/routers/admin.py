from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..auth.dependencies import get_current_user
from ..models import User, PaymentTransaction, UserSubscription, SubscriptionPlan
from ..schemas.admin import (
    UserAdminView, TransactionAdminView, AdminStats, 
    UserProfileUpdate, UserStatusUpdate, 
    SubscriptionAdminView, SubscriptionAssignRequest, SubscriptionExtendRequest
)
from uuid import UUID
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from ..models import User, PaymentTransaction, UserSubscription, SubscriptionPlan
from ..models.admin_resources import AdminAuditLog, SystemAlert, SystemSetting
from ..schemas.admin_resources import (
    AdminAuditLogResponse, SystemAlertCreate, SystemAlertResponse,
    SystemSettingCreate, SystemSettingResponse, SystemSettingUpdate
)

router = APIRouter()

def get_admin_user(current_user: User = Depends(get_current_user)):
    # Check is_admin field from User model (legacy) or roles relationship
    is_admin = getattr(current_user, "is_admin", False)
    is_superuser = getattr(current_user, "is_superuser", False)
    
    # Check RBAC roles
    has_role = False
    if hasattr(current_user, "roles"):
        role_names = [r.role for r in current_user.roles]
        if "admin" in role_names or "super_admin" in role_names:
            has_role = True

    if not (is_admin or is_superuser or has_role):
         raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

@router.get("/subscriptions", response_model=List[SubscriptionAdminView])
async def list_subscriptions(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    query = db.query(UserSubscription)
    
    if search:
        query = query.filter(UserSubscription.customer_name.ilike(f"%{search}%"))
    
    if status:
        query = query.filter(UserSubscription.status == status)
        
    subscriptions = query.order_by(UserSubscription.created_at.desc()).offset(skip).limit(limit).all()
    return subscriptions

@router.post("/subscriptions/assign", response_model=SubscriptionAdminView)
async def assign_subscription(
    request: SubscriptionAssignRequest,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    # Check if user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check if plan exists
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == request.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    # Create or update subscription
    subscription = db.query(UserSubscription).filter(UserSubscription.user_id == request.user_id).first()
    
    if subscription:
        subscription.plan_id = request.plan_id
        subscription.status = 'active'
        subscription.amount_cents = plan.price_cents
        subscription.currency = plan.currency
        subscription.monthly_credits = plan.limits.get("monthlyCredits", 0) if plan.limits else 0
        subscription.credit_balance = subscription.monthly_credits
    else:
        subscription = UserSubscription(
            user_id=request.user_id,
            plan_id=request.plan_id,
            status='active',
            payment_provider='admin',
            amount_cents=plan.price_cents,
            currency=plan.currency or "USD",
            monthly_credits=plan.limits.get("monthlyCredits", 0) if plan.limits else 0,
            credit_balance=plan.limits.get("monthlyCredits", 0) if plan.limits else 0,
            customer_name=user.full_name or user.email
        )
        db.add(subscription)
        
    db.commit()
    db.refresh(subscription)
    return subscription

@router.post("/subscriptions/{subscription_id}/extend", response_model=SubscriptionAdminView)
async def extend_subscription(
    subscription_id: UUID,
    request: SubscriptionExtendRequest,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    subscription = db.query(UserSubscription).filter(UserSubscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
        
    # Extend current_period_end
    if not subscription.current_period_end:
        subscription.current_period_end = datetime.now() + timedelta(days=request.days)
    else:
        subscription.current_period_end += timedelta(days=request.days)
        
    subscription.status = 'active'
    db.commit()
    db.refresh(subscription)
    return subscription

@router.post("/subscriptions/process-expired")
async def process_expired_subscriptions(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    now = datetime.now()
    expired = db.query(UserSubscription).filter(
        UserSubscription.status == 'active',
        UserSubscription.current_period_end < now
    ).all()
    
    for sub in expired:
        sub.status = 'expired'
        
    db.commit()
    return {"success": True, "updated_count": len(expired)}

@router.post("/users/{user_id}/profile", response_model=UserAdminView)
async def update_user_profile(
    user_id: UUID,
    profile_update: UserProfileUpdate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if profile_update.full_name is not None:
        user.full_name = profile_update.full_name
    # Map other fields if they exist in the User model
    
    db.commit()
    db.refresh(user)
    return user

@router.post("/users/{user_id}/status", response_model=UserAdminView)
async def toggle_user_status(
    user_id: UUID,
    status_update: UserStatusUpdate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = status_update.is_active
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: UUID,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    # Only super admins should ideally delete users
    # But for now, any admin can
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"success": True}

@router.get("/users", response_model=List[UserAdminView])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/transactions", response_model=List[TransactionAdminView])
async def list_transactions(
    skip: int = 0,
    limit: int = 100,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    transactions = db.query(PaymentTransaction).offset(skip).limit(limit).all()
    return transactions

@router.get("/stats", response_model=AdminStats)
async def get_stats(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    user_count = db.query(User).count()
    # Placeholder for other stats
    return AdminStats(
        total_users=user_count,
        total_revenue_cents=0,
        active_subscriptions=0
    )


# --- Audit Logs ---
@router.get("/audit-log", response_model=List[AdminAuditLogResponse])
async def get_audit_log(
    skip: int = 0,
    limit: int = 50,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    return db.query(AdminAuditLog).order_by(AdminAuditLog.created_at.desc()).offset(skip).limit(limit).all()

# --- System Alerts ---
@router.get("/alerts", response_model=List[SystemAlertResponse])
async def get_system_alerts(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    return db.query(SystemAlert).order_by(SystemAlert.created_at.desc()).all()

@router.post("/alerts", response_model=SystemAlertResponse)
async def create_system_alert(
    alert: SystemAlertCreate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    db_alert = SystemAlert(**alert.dict())
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert

# --- System Settings ---
@router.get("/settings", response_model=List[SystemSettingResponse])
async def get_system_settings(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    return db.query(SystemSetting).all()

@router.put("/settings/{key}", response_model=SystemSettingResponse)
async def update_system_setting(
    key: str,
    setting_update: SystemSettingUpdate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    db_setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    
    if not db_setting:
        # If not found, create new (upsert behavior logic can be complex in REST, here we assume it exists or use POST for create)
        # But per requirements we might want upsert. Let's stick to update for existing keys first.
        # Actually, let's allow creating via this endpoint for simplicity if it doesn't exist
        db_setting = SystemSetting(
            key=key,
            value=setting_update.value,
            category="general", # Default
            updated_by=admin.id
        )
        db.add(db_setting)
    else:
        db_setting.value = setting_update.value
        db_setting.updated_by = admin.id
        
    db.commit()
    db.refresh(db_setting)
    return db_setting

@router.post("/export-data")
async def export_data(
    request: dict, # Simplified for now
    admin: User = Depends(get_admin_user)
):
    # Mock export
    return {"success": True, "requestId": str(uuid.uuid4())}

# --- Simplified Role Management ---
@router.get("/users/{user_id}/role")
async def get_user_role(
    user_id: UUID,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"role": "admin" if user.is_admin else "user"}

@router.post("/users/{user_id}/role")
async def set_user_role(
    user_id: UUID,
    role_data: Dict[str, str], # {"role": "admin" | "user"}
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    if not admin.is_superuser:
         # Optional: Check if admin serves as superuser. For now, we trust is_admin.
         # But usually only super_admin can make others admins.
         pass

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_role = role_data.get("role")
    if new_role == "admin":
        user.is_admin = True
    elif new_role == "user":
        user.is_admin = False
    
    db.commit()
    return {"success": True}