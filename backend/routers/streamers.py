from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from database import get_session
from models import User, Profile, StreamerStatus, PrivacyLevel, UserRole
from auth import get_optional_current_active_user
from services.streaming_api import get_twitch_streams, format_stream_data

router = APIRouter(
    prefix="/streamers",
    tags=["streamers"],
)

@router.get("/")
async def get_public_streamers(
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_optional_current_active_user)
):
    query = (
        select(User)
        .join(Profile)
        .where(Profile.streamer_status == StreamerStatus.APPROVED)
        .options(selectinload(User.profile))
    )

    # Filter by visibility based on user authentication and role
    if not current_user or current_user.role not in [UserRole.CITIZEN, UserRole.OFFICER, UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        query = query.where(Profile.streamer_visibility == PrivacyLevel.PUBLIC)
    
    approved_streamers = session.exec(query).all()
    
    # Get Twitch usernames to fetch stream status in one batch
    twitch_usernames = [
        user.profile.social_links.get("twitch")
        for user in approved_streamers
        if user.profile and user.profile.social_links and "twitch" in user.profile.social_links
    ]
    
    live_twitch_data = await get_twitch_streams(twitch_usernames) if twitch_usernames else {}

    response_data = []
    for user in approved_streamers:
        stream_info = {"is_live": False}
        twitch_username = user.profile.social_links.get("twitch", "").lower()

        if live_twitch_data and twitch_username in live_twitch_data:
            stream_info = format_stream_data(live_twitch_data[twitch_username])

        response_data.append({
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name,
            "avatar_url": user.profile.avatar_url,
            "social_links": user.profile.social_links,
            "stream_info": stream_info
        })
        
    # Sort by is_live status
    response_data.sort(key=lambda x: x['stream_info']['is_live'], reverse=True)

    return response_data
