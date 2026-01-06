from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID

from ..database import get_db
from ..models import UserProject, User
from ..schemas.projects import ProjectCreate, ProjectUpdate, ProjectResponse
from ..auth.dependencies import get_current_user

router = APIRouter(tags=["Projects"])

@router.post("/", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_project = UserProject(
        user_id=current_user.id,
        title=project.title,
        type=project.type,
        status=project.status,
        thumbnail_url=project.thumbnail_url,
        file_url=project.file_url,
        project_metadata=project.project_metadata # Matches the model attribute we defined
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/", response_model=List[ProjectResponse])
async def get_projects(
    skip: int = 0,
    limit: int = 50,
    type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(UserProject).filter(UserProject.user_id == current_user.id)
    
    if type and type != 'all':
        query = query.filter(UserProject.type == type)
        
    projects = query.order_by(UserProject.created_at.desc()).offset(skip).limit(limit).all()
    return projects

@router.get("/dashboard")
async def get_dashboard_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch recent projects
    projects = db.query(UserProject).filter(UserProject.user_id == current_user.id).order_by(UserProject.created_at.desc()).limit(10).all()
    
    # Fetch recent activities (Need to import UserActivity model)
    from ..models import UserActivity
    activities = db.query(UserActivity).filter(UserActivity.user_id == current_user.id).order_by(UserActivity.created_at.desc()).limit(20).all()
    
    # Calculate stats (simplified)
    all_projects_count = db.query(UserProject).filter(UserProject.user_id == current_user.id).count()
    videos_created = db.query(UserProject).filter(UserProject.user_id == current_user.id, UserProject.type == 'video', UserProject.status == 'completed').count()
    
    stats = {
        "totalProjects": all_projects_count,
        "videosCreated": videos_created,
        "storageUsed": 0, # Placeholder
        "storageLimit": 1000
    }
    
    return {
        "projects": projects,
        "activities": activities,
        "stats": stats
    }

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(UserProject).filter(
        UserProject.id == project_id,
        UserProject.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    return project

@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    updates: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(UserProject).filter(
        UserProject.id == project_id,
        UserProject.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    update_data = updates.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(project, key, value)
        
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}")
async def delete_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(UserProject).filter(
        UserProject.id == project_id,
        UserProject.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    db.delete(project)
    db.commit()
    return {"status": "success"}
