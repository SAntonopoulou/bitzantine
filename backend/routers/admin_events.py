from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import selectinload

from database import get_session
from models import Event, EventTemplate, User, EventUpdate, Group, UserRead, EventReadWithDetails, EventBase
from auth import RoleChecker, UserRole

router = APIRouter(
    prefix="/admin/events",
    tags=["admin-events"],
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]))],
    responses={404: {"description": "Not found"}},
)

# --- Static Routes (Must be before dynamic routes) ---

# Data for forms
@router.get("/form-data/users")
async def get_users_for_form(session: Session = Depends(get_session)):
    users = session.exec(select(User).options(selectinload(User.profile))).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "display_name": u.display_name
        } for u in users
    ]

@router.get("/form-data/groups")
async def get_groups_for_form(session: Session = Depends(get_session)):
    groups = session.exec(select(Group)).all()
    return [
        {
            "id": g.id,
            "name": g.name
        } for g in groups
    ]

# Event Templates
@router.get("/templates")
async def get_event_templates(session: Session = Depends(get_session)):
    templates = session.exec(select(EventTemplate)).all()
    # Explicitly return JSONResponse to bypass any Pydantic validation issues
    return JSONResponse(content=[t.dict() for t in templates])

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

# --- Dynamic Routes ---

@router.post("", response_model=Event)
async def create_event(event: EventBase, session: Session = Depends(get_session)):
    new_event = Event.from_orm(event)
    session.add(new_event)
    session.commit()
    session.refresh(new_event)
    return new_event

@router.get("/{event_id}", response_model=EventReadWithDetails)
async def get_event_for_admin(event_id: int, session: Session = Depends(get_session)):
    """
    Fetches a single event with all its details for the admin panel.
    """
    event = session.exec(
        select(Event).where(Event.id == event_id).options(
            selectinload(Event.host).selectinload(User.profile)
        )
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    host_details = None
    if event.host:
        host_details = UserRead.from_orm(event.host)
        host_details.display_name = event.host.display_name

    event_details = EventReadWithDetails(
        **event.dict(),
        host=host_details,
        rsvps=[] 
    )
    return event_details

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
