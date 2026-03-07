from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from datetime import datetime

from database import get_session
from models import Event, EventTemplate, User, EventUpdate
from auth import RoleChecker, UserRole

router = APIRouter(
    prefix="/admin/events",
    tags=["admin-events"],
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]))],
    responses={404: {"description": "Not found"}},
)

@router.post("", response_model=Event)
async def create_event(event: Event, session: Session = Depends(get_session)):
    new_event = Event.from_orm(event)
    session.add(new_event)
    session.commit()
    session.refresh(new_event)
    return new_event

@router.put("/{event_id}", response_model=Event)
async def update_event(event_id: int, event_update: EventUpdate, session: Session = Depends(get_session)):
    db_event = session.get(Event, event_id)
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    update_data = event_update.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_event, key, value)
        
    session.add(db_event)
    session.commit()
    session.refresh(db_event)
    return db_event

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(event_id: int, session: Session = Depends(get_session)):
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    session.delete(event)
    session.commit()
    return

# Event Templates
@router.get("/templates", response_model=List[EventTemplate])
async def get_event_templates(session: Session = Depends(get_session)):
    templates = session.exec(select(EventTemplate)).all()
    return templates

@router.post("/templates", response_model=EventTemplate)
async def create_event_template(template: EventTemplate, session: Session = Depends(get_session)):
    session.add(template)
    session.commit()
    session.refresh(template)
    return template

@router.put("/templates/{template_id}", response_model=EventTemplate)
async def update_event_template(template_id: int, template_update: EventTemplate, session: Session = Depends(get_session)):
    db_template = session.get(EventTemplate, template_id)
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")

    update_data = template_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_template, key, value)

    session.add(db_template)
    session.commit()
    session.refresh(db_template)
    return db_template

@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event_template(template_id: int, session: Session = Depends(get_session)):
    template = session.get(EventTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    session.delete(template)
    session.commit()
    return
