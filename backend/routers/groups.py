from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import Group, User
from auth import get_current_active_user

router = APIRouter(
    prefix="/groups",
    tags=["groups"],
)

@router.get("/", response_model=List[Group])
def get_groups(session: Session = Depends(get_session)):
    groups = session.exec(select(Group)).all()
    return groups

@router.post("/", response_model=Group)
def create_group(group: Group, session: Session = Depends(get_session), current_user: User = Depends(get_current_active_user)):
    session.add(group)
    session.commit()
    session.refresh(group)
    return group