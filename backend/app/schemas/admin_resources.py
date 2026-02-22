from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

# Audit Log
class AdminAuditLogCreate(BaseModel):
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    new_values: Optional[Dict[str, Any]] = None
    audit_metadata: Optional[Dict[str, Any]] = None

class AdminAuditLogResponse(AdminAuditLogCreate):
    id: UUID
    admin_id: UUID
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class AdminAuditLogList(BaseModel):
    logs: List[AdminAuditLogResponse]
    total_count: int

# System Alert
class SystemAlertCreate(BaseModel):
    title: str
    message: str
    type: str = Field(..., description="'info', 'warning', 'error', 'critical'")
    source: str

class SystemAlertResponse(SystemAlertCreate):
    id: UUID
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# System Setting
class SystemSettingUpdate(BaseModel):
    value: Any

class SystemSettingCreate(BaseModel):
    key: str
    value: Any
    category: str
    is_public: bool = False

class SystemSettingResponse(SystemSettingCreate):
    updated_by: Optional[UUID] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
