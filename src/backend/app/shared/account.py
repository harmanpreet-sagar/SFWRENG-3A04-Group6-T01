"""Pydantic models for the Account Management subsystem"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.shared.enums import UserRole


class AccountResponse(BaseModel):
    aid: int
    name: str
    email: str
    clearance: str # 'admin' | 'operator'
    is_active: bool
    created_at: datetime
    updated_at: datetime
 
    model_config = {"from_attributes": True}

class AccountListResponse(BaseModel):
    accounts: List[AccountResponse]
    total: int


class AccountCreate(BaseModel):
    """Used by POST, same structure as createAccount in Logins class."""
    name: str = Field(..., min_length=1, max_length=128)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    clearance: str = Field(..., pattern="^(admin|operator)$")


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    age: Optional[int] = None
    address: Optional[str] = None


class AccountPasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class AccountResponse(AccountBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    account: AccountResponse

class CredentialsUpdate(BaseModel):
    """Mirrors ChangeUserPass controller: confirmChanges(), writeToD B()."""
    new_password: str = Field(..., min_length=6, max_length=128)

    
class AuditLogEntry(BaseModel):
    id: int
    event_type: str
    actor_id: Optional[int]
    actor_email: Optional[str]
    target_id: Optional[int]
    target_email: Optional[str]
    detail: Optional[str]
    created_at: datetime
 
    model_config = {"from_attributes": True}
 
 
class AuditLogListResponse(BaseModel):
    entries: List[AuditLogEntry]
    total: int