from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.booking import MeetingType, Appointment, AvailabilitySetting, BookingSetting
from ..models.user import User
from ..schemas.bookings import (
    MeetingTypeCreate, MeetingTypeResponse,
    AppointmentCreate, AppointmentResponse,
    AvailabilitySettingCreate, AvailabilitySettingResponse,
    BookingSettingCreate, BookingSettingResponse
)
from ..auth.dependencies import get_current_user
from uuid import UUID

router = APIRouter()

# Meeting Types
@router.get("/meeting-types", response_model=List[MeetingTypeResponse])
async def get_meeting_types(db: Session = Depends(get_db)):
    return db.query(MeetingType).order_by(MeetingType.created_at.asc()).all()

@router.post("/meeting-types", response_model=MeetingTypeResponse)
async def create_meeting_type(
    meeting_type: MeetingTypeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to create meeting types")
    
    db_mt = MeetingType(**meeting_type.model_dump())
    db.add(db_mt)
    db.commit()
    db.refresh(db_mt)
    return db_mt

@router.put("/meeting-types/{id}", response_model=MeetingTypeResponse)
async def update_meeting_type(
    id: UUID,
    updates: MeetingTypeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to update meeting types")
    
    db_mt = db.query(MeetingType).filter(MeetingType.id == id).first()
    if not db_mt:
        raise HTTPException(status_code=404, detail="Meeting type not found")
    
    for key, value in updates.model_dump().items():
        setattr(db_mt, key, value)
    
    db.commit()
    db.refresh(db_mt)
    return db_mt

@router.delete("/meeting-types/{id}")
async def delete_meeting_type(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete meeting types")
    
    db_mt = db.query(MeetingType).filter(MeetingType.id == id).first()
    if not db_mt:
        raise HTTPException(status_code=404, detail="Meeting type not found")
    
    db.delete(db_mt)
    db.commit()
    return {"success": True}

# Appointments
@router.get("/appointments", response_model=List[AppointmentResponse])
async def get_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.is_admin:
        return db.query(Appointment).order_by(Appointment.date.asc(), Appointment.time.asc()).all()
    else:
        return db.query(Appointment).filter(Appointment.created_by == current_user.id).order_by(Appointment.date.asc(), Appointment.time.asc()).all()

@router.post("/appointments", response_model=AppointmentResponse)
async def create_appointment(
    appointment: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_apt = Appointment(
        **appointment.model_dump(),
        created_by=current_user.id
    )
    db.add(db_apt)
    db.commit()
    db.refresh(db_apt)
    return db_apt

@router.put("/appointments/{id}", response_model=AppointmentResponse)
async def update_appointment(
    id: UUID,
    updates: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_apt = db.query(Appointment).filter(Appointment.id == id).first()
    if not db_apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if not current_user.is_admin and db_apt.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this appointment")
    
    for key, value in updates.model_dump().items():
        setattr(db_apt, key, value)
    
    db.commit()
    db.refresh(db_apt)
    return db_apt

@router.delete("/appointments/{id}")
async def delete_appointment(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_apt = db.query(Appointment).filter(Appointment.id == id).first()
    if not db_apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if not current_user.is_admin and db_apt.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this appointment")
    
    db.delete(db_apt)
    db.commit()
    return {"success": True}

# Availability
@router.get("/availability", response_model=List[AvailabilitySettingResponse])
async def get_availability(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(AvailabilitySetting).filter(AvailabilitySetting.user_id == current_user.id).all()

@router.post("/availability")
async def update_availability(
    availability: List[AvailabilitySettingCreate],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Delete existing availability
    db.query(AvailabilitySetting).filter(AvailabilitySetting.user_id == current_user.id).delete()
    
    # Insert new availability
    for item in availability:
        db_item = AvailabilitySetting(**item.model_dump(), user_id=current_user.id)
        db.add(db_item)
    
    db.commit()
    return {"success": True}

# Settings
@router.get("/settings", response_model=BookingSettingResponse)
async def get_booking_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    settings = db.query(BookingSetting).filter(BookingSetting.user_id == current_user.id).first()
    if not settings:
        # Create default settings
        settings = BookingSetting(
            user_id=current_user.id,
            n8n_webhook_url='https://n8n.getostrichai.com/webhook/calendly'
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.post("/settings", response_model=BookingSettingResponse)
async def update_booking_settings(
    updates: BookingSettingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_settings = db.query(BookingSetting).filter(BookingSetting.user_id == current_user.id).first()
    if not db_settings:
        db_settings = BookingSetting(user_id=current_user.id)
        db.add(db_settings)
    
    for key, value in updates.model_dump().items():
        setattr(db_settings, key, value)
    
    db.commit()
    db.refresh(db_settings)
    return db_settings
