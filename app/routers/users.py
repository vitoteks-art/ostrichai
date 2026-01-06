from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Profile, UserSettings, UserProject, UserNotification, UserActivity
from ..schemas.users import ProfileUpdate, ProfileResponse, UserSettingsUpdate, UserSettingsResponse, UserActivityCreate, UserActivityResponse
from ..auth.dependencies import get_current_user
from ..models import User

router = APIRouter()

@router.get("/profile", response_model=ProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
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
    return profile

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