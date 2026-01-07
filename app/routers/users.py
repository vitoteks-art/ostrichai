from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import httpx
import base64
from ..database import get_db
from ..models import Profile, UserSettings, UserProject, UserNotification, UserActivity
from ..schemas.users import ProfileUpdate, ProfileResponse, UserSettingsUpdate, UserSettingsResponse, UserActivityCreate, UserActivityResponse
from ..auth.dependencies import get_current_user
from ..models import User
from ..config import settings

router = APIRouter()

@router.get("/profile", response_model=ProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Add roles from User model
    profile.roles = [r.role for r in current_user.roles]
    return profile

@router.put("/profile", response_model=ProfileResponse)
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.id == current_user.id).first()
    if not profile:
        profile = Profile(id=current_user.id, email=current_user.email)
        db.add(profile)

    for field, value in profile_data.dict(exclude_unset=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    
    # Add roles from User model
    profile.roles = [r.role for r in current_user.roles]
    return profile

@router.post("/profile/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Read file content
        contents = await file.read()
        # Convert to base64 for ImgBB
        base64_image = base64.b64encode(contents).decode('utf-8')
        
        # Upload to ImgBB
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.imgbb.com/1/upload",
                data={
                    "key": settings.vite_imgbb_api_key,
                    "image": base64_image,
                    "name": f"avatar_{current_user.id}"
                }
            )
            
            if resp.status_code != 200:
                print(f"❌ ImgBB error: {resp.text}")
                raise HTTPException(status_code=resp.status_code, detail="Failed to upload image to storage")
            
            img_data = resp.json()
            avatar_url = img_data.get("data", {}).get("url")
            
            if not avatar_url:
                raise HTTPException(status_code=500, detail="ImgBB did not return a URL")

            # Update profile in DB
            profile = db.query(Profile).filter(Profile.id == current_user.id).first()
            if not profile:
                profile = Profile(id=current_user.id, email=current_user.email)
                db.add(profile)
            
            profile.avatar_url = avatar_url
            db.commit()
            
            return {"avatar_url": avatar_url}
            
    except Exception as e:
        print(f"❌ Avatar upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/settings", response_model=UserSettingsResponse)
async def get_settings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    settings = db.query(UserSettings).filter(UserSettings.id == current_user.id).first()
    if not settings:
        settings = UserSettings(id=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("/settings", response_model=UserSettingsResponse)
async def update_settings(
    settings_data: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    settings = db.query(UserSettings).filter(UserSettings.id == current_user.id).first()
    if not settings:
        settings = UserSettings(id=current_user.id)
        db.add(settings)

    for field, value in settings_data.dict(exclude_unset=True).items():
        setattr(settings, field, value)

    db.commit()
    db.refresh(settings)
    return settings

@router.get("/projects")
async def get_user_projects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    projects = db.query(UserProject).filter(UserProject.user_id == current_user.id).all()
    return projects

@router.get("/notifications")
async def get_user_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notifications = db.query(UserNotification).filter(UserNotification.user_id == current_user.id).all()
    return notifications

@router.get("/activity")
async def get_user_activity(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    activities = db.query(UserActivity).filter(UserActivity.user_id == current_user.id).order_by(UserActivity.created_at.desc()).limit(limit).all()
    return activities

@router.post("/activity", response_model=UserActivityResponse)
async def log_user_activity(
    activity_data: UserActivityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    activity = UserActivity(
        user_id=current_user.id,
        action=activity_data.action,
        details=activity_data.details,
        activity_metadata=activity_data.activity_metadata or {}
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity