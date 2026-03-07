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

@router.get("/users", response_model=List[User])
async def get_all_users(session: Session = Depends(get_session)):
    users = session.exec(select(User)).all()
    return users

@router.get("/groups", response_model=List[Group])
async def get_all_groups(session: Session = Depends(get_session)):
    groups = session.exec(select(Group)).all()
    return groups
