from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..auth.dependencies import get_current_user
from ..models import User, PaymentTransaction
from ..schemas.admin import UserAdminView, TransactionAdminView, AdminStats

router = APIRouter()

def get_admin_user(current_user: User = Depends(get_current_user)):
    # Check is_admin field from User model
    if not getattr(current_user, "is_admin", False):
         raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

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