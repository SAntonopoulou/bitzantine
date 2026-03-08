from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List

from database import get_session
from models import UserRole
from auth import RoleChecker

router = APIRouter(
    prefix="/admin",
    tags=["admin-data"],
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]))],
)

# This file is intentionally left sparse. 
# Specific admin routes are organized into their own files like admin_users.py and admin_events.py
# to prevent routing conflicts and improve organization.
