from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from typing import List, Optional
from datetime import datetime
from sqlalchemy import desc, asc
from sqlalchemy.orm import selectinload

from database import get_session
from models import (
    Event, EventRSVP, User, RSVPStatus, EventRSVPRead, Profile, 
    UserReadWithProfile, EventDetailResponse, EventReadWithDetails
)
from auth import get_current_active_user

router = APIRouter(
    prefix="/events",
    tags=["events"],
    responses={404: {"description": "Not found"}},
)

@router.get("", response_model=List[EventReadWithDetails])
async def get_events(
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 10,
    session: Session = Depends(get_session)
):
    query = select(Event).where(Event.is_template == False).options(
        selectinload(Event.rsvps).selectinload(EventRSVP.user).selectinload(User.profile),
        selectinload(Event.host).selectinload(User.profile)
    )
    if start:
        query = query.where(Event.date >= start)
    if end:
        query = query.where(Event.date <= end)
    
    events = session.exec(query.order_by(desc(Event.date)).offset(skip).limit(limit)).all()
    return events

@router.get("/{event_id}", response_model=EventDetailResponse)
async def get_event(event_id: int, session: Session = Depends(get_session)):
    # This query now explicitly loads all required nested data.
    query = select(Event).where(Event.id == event_id, Event.is_template == False).options(
        selectinload(Event.rsvps).selectinload(EventRSVP.user).selectinload(User.profile),
        selectinload(Event.host).selectinload(User.profile)
    )
    event = session.exec(query).one_or_none()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Find previous and next event IDs
    previous_event_id = session.exec(
        select(Event.id)
        .where(Event.date < event.date, Event.is_template == False)
        .order_by(desc(Event.date))
        .limit(1)
    ).first()
    
    next_event_id = session.exec(
        select(Event.id)
        .where(Event.date > event.date, Event.is_template == False)
        .order_by(asc(Event.date))
        .limit(1)
    ).first()

    return EventDetailResponse(
        event=event,
        previous_event_id=previous_event_id,
        next_event_id=next_event_id,
    )

@router.post("/{event_id}/rsvp", response_model=EventRSVPRead)
async def rsvp_for_event(
    event_id: int,
    status: RSVPStatus,
    user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check if event is full
    if status == RSVPStatus.ATTENDING and event.max_participants:
        attendees_count = session.exec(
            select(func.count(EventRSVP.id)).where(
                EventRSVP.event_id == event_id, 
                EventRSVP.status == RSVPStatus.ATTENDING
            )
        ).one()
        
        # Check if user is already attending to not count them in the check
        rsvp_check = session.exec(
            select(EventRSVP).where(EventRSVP.event_id == event_id, EventRSVP.user_id == user.id)
        ).first()
        is_already_attending = rsvp_check and rsvp_check.status == RSVPStatus.ATTENDING

        if attendees_count >= event.max_participants and not is_already_attending:
             raise HTTPException(status_code=400, detail="Event is full")

    # Find existing RSVP or create a new one
    rsvp = session.exec(
        select(EventRSVP).where(EventRSVP.event_id == event_id, EventRSVP.user_id == user.id)
    ).first()

    if not rsvp:
        rsvp = EventRSVP(event_id=event_id, user_id=user.id, status=status)
        session.add(rsvp)
    else:
        rsvp.status = status
        session.add(rsvp)
    
    session.commit()
    session.refresh(rsvp)
    
    # Eagerly load the user and profile to ensure it's in the response
    user_with_profile = session.exec(
        select(User).where(User.id == user.id).options(selectinload(User.profile))
    ).one()
    
    # Construct the final response model
    return EventRSVPRead(
        id=rsvp.id,
        user_id=rsvp.user_id,
        event_id=rsvp.event_id,
        status=rsvp.status,
        user=user_with_profile
    )
