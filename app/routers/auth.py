from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Profile, UserSettings, UserSession
from ..schemas.auth import (
    UserCreate, UserResponse, Token, UserLogin, EmailVerificationRequest,
    PasswordResetRequest, PasswordResetConfirm,
    VerificationCodeCheck, SessionCreate, SessionResponse
)
from ..auth.utils import get_password_hash, verify_password, create_access_token
from ..auth.dependencies import get_current_user
from ..utils.email import send_verification_email
import random
import string
from datetime import datetime, timedelta, timezone

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    hashed_password = get_password_hash(user_data.password)
    
    # Generate verification code
    verification_code = ''.join(random.choices(string.digits, k=6))
    verification_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    db_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        verification_code=verification_code,
        verification_code_expires_at=verification_expiry,
        is_verified=False  # Explicitly set to False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Send verification email
    await send_verification_email(db_user.email, verification_code)

    # Create profile
    db_profile = Profile(
        id=db_user.id,
        email=db_user.email,
        full_name=db_user.full_name
    )
    db.add(db_profile)

    # Create user settings
    db_settings = UserSettings(id=db_user.id)
    db.add(db_settings)

    db.commit()

    return UserResponse(
        id=db_user.id,
        email=db_user.email,
        full_name=db_user.full_name,
        is_active=db_user.is_active,
        is_verified=db_user.is_verified,
        is_admin=db_user.is_admin,
        created_at=db_user.created_at
    )

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email to log in."
        )

    # Update last sign in time
    user.last_sign_in_at = datetime.now(timezone.utc)
    db.commit()

    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/sessions/login", response_model=SessionResponse)
async def record_login_session(
    session_data: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record a new user login session
    """
    user_session = UserSession(
        user_id=current_user.id,
        session_token=session_data.session_token,
        is_active=True,
        login_at=datetime.now(timezone.utc)
    )
    db.add(user_session)
    db.commit()
    db.refresh(user_session)
    return user_session

@router.post("/sessions/logout")
async def logout_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark all active sessions for the current user as inactive
    """
    db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.is_active == True
    ).update({
        UserSession.is_active: False,
        UserSession.logout_at: datetime.now(timezone.utc)
    })
    
    db.commit()
    return {"message": "Logged out successfully"}

@router.post("/sessions/cleanup")
async def cleanup_sessions(
    db: Session = Depends(get_db)
):
    """
    Cleanup old inactive sessions (can be called by cron job or periodically)
    """
    twenty_four_hours_ago = datetime.now(timezone.utc) - timedelta(hours=24)
    
    # Logic: Mark sessions created > 24h ago as inactive if they are still active
    # This is a bit simplistic policy, maybe we want 'updated_at' but for now it matches frontend logic
    updated_count = db.query(UserSession).filter(
        UserSession.is_active == True,
        UserSession.created_at < twenty_four_hours_ago
    ).update({
        UserSession.is_active: False,
        UserSession.logout_at: datetime.now(timezone.utc)
    })
    
    db.commit()
    return {"message": f"Cleaned up {updated_count} expired sessions"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        is_admin=current_user.is_admin,
        created_at=current_user.created_at
    )

@router.post("/verify-email")
async def verify_email(request: EmailVerificationRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_verified:
        return {"message": "Email already verified"}
    
    if not user.verification_code or user.verification_code != request.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    if user.verification_code_expires_at and user.verification_code_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Verification code has expired")
    
    # Mark as verified
    user.is_verified = True
    user.verification_code = None
    user.verification_code_expires_at = None
    db.commit()
    
    return {"message": "Email verified successfully"}

@router.post("/resend-verification")
async def resend_verification(email: str = Query(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_verified:
        return {"message": "Email already verified"}
    
    # Generate new code
    verification_code = ''.join(random.choices(string.digits, k=6))
    user.verification_code = verification_code
    user.verification_code_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()
    
    # Send email
    await send_verification_email(user.email, verification_code)
    
    return {"message": "Verification code resent"}