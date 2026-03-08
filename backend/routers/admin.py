from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from typing import List

from database import get_session
from models import User, Group, UserRole
from auth import RoleChecker

router = APIRouter(
    prefix="/admin",
    tags=["admin-data"],
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]))],
)

# Redundant routes removed to avoid conflict with admin_users.py and admin_groups.py
