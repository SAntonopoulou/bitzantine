from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import Event, User
from auth import get_current_active_user

router = APIRouter(
    prefix="/events",
    tags=["events"],
)

@router.get("/", response_model=List[Event])
def get_events(session: Session = Depends(get_session)):
    events = session.exec(select(Event)).all()
    return events

@router.post("/", response_model=Event)
def create_event(event: Event, session: Session = Depends(get_session), current_user: User = Depends(get_current_active_user)):
    session.add(event)
    session.commit()
    session.refresh(event)
    return event
