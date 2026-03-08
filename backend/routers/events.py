from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from typing import List, Optional
from datetime import datetime
from sqlalchemy import desc, asc
from sqlalchemy.orm import selectinload

from database import get_session
from models import (
    Event, EventRSVP, User, RSVPStatus, EventRSVPRead, Profile, 
    UserReadWithProfile, EventDetailResponse, EventReadWithDetails, GroupRead
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
        selectinload(Event.host).selectinload(User.profile),
        selectinload(Event.host_group)
    )
    if start:
        query = query.where(Event.date >= start)
    if end:
        query = query.where(Event.date <= end)
    
    events = session.exec(query.order_by(desc(Event.date)).offset(skip).limit(limit)).all()
    
    response = []
    for event in events:
        rsvps = []
        for rsvp in event.rsvps:
            rsvps.append(EventRSVPRead(
                id=rsvp.id,
                user_id=rsvp.user_id,
                event_id=rsvp.event_id,
                status=rsvp.status,
                user=UserReadWithProfile(
                    id=rsvp.user.id,
                    username=rsvp.user.username,
                    display_name=rsvp.user.display_name,
                    email=rsvp.user.email,
                    discord_username=rsvp.user.discord_username,
                    role=rsvp.user.role,
                    is_active=rsvp.user.is_active,
                    avatar_url=rsvp.user.profile.avatar_url if rsvp.user.profile else None,
                    profile=rsvp.user.profile
                )
            ))
        
        host_with_profile = None
        if event.host:
            host_with_profile = UserReadWithProfile(
                id=event.host.id,
                username=event.host.username,
                display_name=event.host.display_name,
                email=event.host.email,
                discord_username=event.host.discord_username,
                role=event.host.role,
                is_active=event.host.is_active,
                avatar_url=event.host.profile.avatar_url if event.host.profile else None,
                profile=event.host.profile
            )
            
        host_group_details = None
        if event.host_group:
            host_group_details = GroupRead.from_orm(event.host_group)

        response.append(EventReadWithDetails(
            **event.dict(),
            rsvps=rsvps,
            host=host_with_profile,
            host_group=host_group_details
        ))
    return response

@router.get("/{event_id}", response_model=EventDetailResponse)
async def get_event(event_id: int, session: Session = Depends(get_session)):
    query = select(Event).where(Event.id == event_id, Event.is_template == False).options(
        selectinload(Event.rsvps).selectinload(EventRSVP.user).selectinload(User.profile),
        selectinload(Event.host).selectinload(User.profile),
        selectinload(Event.host_group)
    )
    event = session.exec(query).one_or_none()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

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

    rsvps = []
    for rsvp in event.rsvps:
        rsvps.append(EventRSVPRead(
            id=rsvp.id,
            user_id=rsvp.user_id,
            event_id=rsvp.event_id,
            status=rsvp.status,
            user=UserReadWithProfile(
                id=rsvp.user.id,
                username=rsvp.user.username,
                display_name=rsvp.user.display_name,
                email=rsvp.user.email,
                discord_username=rsvp.user.discord_username,
                role=rsvp.user.role,
                is_active=rsvp.user.is_active,
                avatar_url=rsvp.user.profile.avatar_url if rsvp.user.profile else None,
                profile=rsvp.user.profile
            )
        ))
    
    host_with_profile = None
    if event.host:
        host_with_profile = UserReadWithProfile(
            id=event.host.id,
            username=event.host.username,
            display_name=event.host.display_name,
            email=event.host.email,
            discord_username=event.host.discord_username,
            role=event.host.role,
            is_active=event.host.is_active,
            avatar_url=event.host.profile.avatar_url if event.host.profile else None,
            profile=event.host.profile
        )

    host_group_details = None
    if event.host_group:
        host_group_details = GroupRead.from_orm(event.host_group)

    event_with_details = EventReadWithDetails(
        **event.dict(),
        rsvps=rsvps,
        host=host_with_profile,
        host_group=host_group_details
    )

    return EventDetailResponse(
        event=event_with_details,
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

    if status == RSVPStatus.ATTENDING and event.max_participants:
        attendees_count = session.exec(
            select(func.count(EventRSVP.id)).where(
                EventRSVP.event_id == event_id, 
                EventRSVP.status == RSVPStatus.ATTENDING
            )
        ).one()
        
        rsvp_check = session.exec(
            select(EventRSVP).where(EventRSVP.event_id == event_id, EventRSVP.user_id == user.id)
        ).first()
        is_already_attending = rsvp_check and rsvp_check.status == RSVPStatus.ATTENDING

        if attendees_count >= event.max_participants and not is_already_attending:
             raise HTTPException(status_code=400, detail="Event is full")

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
    
    user_with_profile = session.exec(
        select(User).where(User.id == user.id).options(selectinload(User.profile))
    ).one()
    
    return EventRSVPRead(
        id=rsvp.id,
        user_id=rsvp.user_id,
        event_id=rsvp.event_id,
        status=rsvp.status,
        user=UserReadWithProfile(
            id=user_with_profile.id,
            username=user_with_profile.username,
            display_name=user_with_profile.display_name,
            email=user_with_profile.email,
            discord_username=user_with_profile.discord_username,
            role=user_with_profile.role,
            is_active=user_with_profile.is_active,
            avatar_url=user_with_profile.profile.avatar_url if user_with_profile.profile else None,
            profile=user_with_profile.profile
        )
    )
