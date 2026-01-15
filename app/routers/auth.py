from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Profile, UserSettings, UserSession
from ..schemas.auth import (
    UserCreate, UserResponse, Token, UserLogin, EmailVerificationRequest,
    PasswordResetRequest, PasswordResetConfirm,
    VerificationCodeCheck, SessionCreate, SessionResponse,
    GoogleAuthRequest
)
from ..auth.utils import (
    get_password_hash, verify_password, create_access_token,
    exchange_google_code, get_google_user_info
)
from ..auth.dependencies import get_current_user
from ..utils.email import send_verification_email, send_password_reset_email
from ..config import settings
import random
import string
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

router = APIRouter()

@router.get("/google/url")
async def get_google_auth_url():
    """
    Generate Google authorization URL
    """
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.vite_google_redirect_url,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent"
    }
    url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    print(f"DEBUG: Generated Google Auth URL: {url}", flush=True)
    return {"url": url}

@router.post("/google/callback", response_model=Token)
async def google_callback(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Handle Google OAuth callback
    """
    print(f"DEBUG: Google Callback Hit", flush=True)
    print(f"DEBUG: Config ID: {settings.google_client_id}", flush=True)
    print(f"DEBUG: Config Secret: {settings.google_client_secret[:4]}...", flush=True)
    print(f"DEBUG: Redirect URI from Frontend: {request.redirect_uri}", flush=True)
    
    # 1. Exchange code for token
    token_data = await exchange_google_code(request.code, request.redirect_uri)
    if not token_data:
         raise HTTPException(status_code=400, detail="Failed to exchange code for token (No response)")
    
    if "error" in token_data:
        error_msg = token_data.get("error_description", token_data.get("error", "Unknown Google Error"))
        print(f"Google Error Detail: {error_msg}")
        raise HTTPException(status_code=400, detail=f"Google Error: {error_msg}")
    
    access_token = token_data.get("access_token")
    
    # 2. Get user info
    google_user = await get_google_user_info(access_token)
    if not google_user:
        raise HTTPException(status_code=400, detail="Failed to get user info from Google")
    
    email = google_user.get("email")
    full_name = google_user.get("name")
    
    # 3. Check if user exists
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # Create new user
        # We need a dummy password since it's NOT NULL in our model for now
        dummy_password = "".join(random.choices(string.ascii_letters + string.digits, k=32))
        hashed_password = get_password_hash(dummy_password)
        
        user = User(
            email=email,
            full_name=full_name,
            hashed_password=hashed_password,
            is_verified=True, # Google emails are verified
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create profile
        db_profile = Profile(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            avatar_url=google_user.get("picture")
        )
        db.add(db_profile)
        
        # Create user settings
        db_settings = UserSettings(id=user.id)
        db.add(db_settings)
        db.commit()
    else:
        # Update existing user if needed
        if not user.full_name:
            user.full_name = full_name
        user.is_verified = True # Ensure verified if coming from Google
        user.last_sign_in_at = datetime.now(timezone.utc)
        db.commit()

    # 4. Generate local JWT
    local_access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": local_access_token, "token_type": "bearer"}

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
    
    # Update user last_sign_in_at
    current_user.last_sign_in_at = datetime.now(timezone.utc)
    
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

@router.post("/password-reset/request")
async def request_password_reset(request: PasswordResetRequest, db: Session = Depends(get_db)):
    """
    Send a password reset code to the user's email.
    """
    user = db.query(User).filter(User.email == request.email).first()

    # Always return success to avoid leaking which emails are registered
    if not user:
        return {"message": "If that email exists, a reset code has been sent."}

    reset_code = ''.join(random.choices(string.digits, k=6))
    user.password_reset_code = reset_code
    user.password_reset_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()

    reset_url = None
    if settings.vite_app_url:
        reset_url = f"{settings.vite_app_url.rstrip('/')}/reset-password?email={request.email}&code={reset_code}"

    await send_password_reset_email(request.email, reset_code, reset_url)

    return {"message": "If that email exists, a reset code has been sent."}

@router.post("/password-reset/confirm")
async def confirm_password_reset(request: PasswordResetConfirm, db: Session = Depends(get_db)):
    """
    Confirm a password reset using the code sent to the user's email.
    """
    user = db.query(User).filter(User.email == request.email).first()

    if not user or not user.password_reset_code:
        raise HTTPException(status_code=400, detail="Invalid reset code")

    if user.password_reset_code != request.code:
        raise HTTPException(status_code=400, detail="Invalid reset code")

    if user.password_reset_expires_at and user.password_reset_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset code has expired")

    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")

    user.hashed_password = get_password_hash(request.new_password)
    user.password_reset_code = None
    user.password_reset_expires_at = None
    db.commit()

    return {"message": "Password reset successfully"}
