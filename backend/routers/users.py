from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from typing import List, Optional
import shutil
import os
import uuid
from datetime import date

from database import get_session
from models import (
    User, Profile, UserRead, UserReadWithProfile, ProfileUpdate, 
    UserPublicProfile, UserGroupRead, GroupRole, MembershipStatus, UserGroupLink,
    PrivacyLevel, UserRole, UserReadMe, Announcement, LoreEntry, Poll, Event, EventRSVP, PollVote, Group
)
from auth import get_current_active_user, get_optional_current_active_user

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

UPLOAD_DIR = "static/uploads/profiles"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/me", response_model=UserReadMe)
async def get_own_profile(current_user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    user = session.exec(
        select(User)
        .where(User.id == current_user.id)
        .options(selectinload(User.profile), selectinload(User.groups))
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user_data = UserReadMe(
        id=user.id, username=user.username, display_name=user.display_name,
        email=user.email, discord_username=user.discord_username, role=user.role,
        is_active=user.is_active, avatar_url=user.profile.avatar_url if user.profile else None,
        groups=[UserGroupRead.from_orm(g) for g in user.groups]
    )
    return user_data

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_own_account(current_user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    user_id = current_user.id

    # Reassign leadership of any groups led by the user to NULL
    led_groups = session.exec(select(Group).where(Group.leader_id == user_id)).all()
    for group in led_groups:
        group.leader_id = None
        session.add(group)

    # Manually delete content where the user is the author/host
    # Using specific fields instead of a generic loop
    for item in session.exec(select(Announcement).where(Announcement.author_id == user_id)).all():
        session.delete(item)
    for item in session.exec(select(LoreEntry).where(LoreEntry.user_id == user_id)).all():
        session.delete(item)
    for item in session.exec(select(Poll).where(Poll.author_id == user_id)).all():
        session.delete(item)
    for item in session.exec(select(Event).where(Event.host_user_id == user_id)).all():
        session.delete(item)
        
    # Manually delete memberships and votes
    for item in session.exec(select(UserGroupLink).where(UserGroupLink.user_id == user_id)).all():
        session.delete(item)
    for item in session.exec(select(EventRSVP).where(EventRSVP.user_id == user_id)).all():
        session.delete(item)
    for item in session.exec(select(PollVote).where(PollVote.user_id == user_id)).all():
        session.delete(item)

    # Delete the user's profile
    profile = session.exec(select(Profile).where(Profile.user_id == user_id)).first()
    if profile:
        session.delete(profile)

    # Finally, delete the user
    user_to_delete = session.get(User, user_id)
    if user_to_delete:
        session.delete(user_to_delete)
    
    session.commit()
    return

@router.get("/{username}/profile", response_model=UserPublicProfile)
async def get_user_profile(
    username: str, 
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_optional_current_active_user)
):
    user = session.exec(
        select(User)
        .where(User.username == username)
        .options(selectinload(User.profile), selectinload(User.groups), selectinload(User.led_groups))
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.profile:
        profile = Profile(user_id=user.id)
        session.add(profile)
        session.commit()
        session.refresh(user)
    
    profile = user.profile
    privacy = profile.privacy_settings or {}
    
    is_owner = current_user and current_user.id == user.id
    is_staff = current_user and current_user.role in [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR]
    is_citizen_plus = current_user and current_user.role in [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR, UserRole.OFFICER, UserRole.CITIZEN]

    def can_see(field_name):
        if is_owner or is_staff: return True
        level = privacy.get(field_name, PrivacyLevel.PUBLIC)
        if level == PrivacyLevel.PUBLIC: return True
        if level == PrivacyLevel.MEMBERS_ONLY and is_citizen_plus: return True
        return False

    response_data = {
        "id": user.id, "username": user.username, "display_name": user.display_name,
        "avatar_url": profile.avatar_url, "header_image_url": profile.header_image_url,
        "username_color": profile.username_color, "in_game_activities": profile.in_game_activities,
        "groups": [], "led_groups": []
    }
    
    if can_see("bio"): response_data["bio"] = profile.bio
    if can_see("real_name"): response_data["real_name"] = profile.real_name
    if can_see("gender"): response_data["gender"] = profile.gender
    if can_see("birthdate"): response_data["birthdate"] = profile.birthdate
    if can_see("location"): response_data["location"] = profile.location
    if can_see("typical_playtime"): response_data["typical_playtime"] = profile.typical_playtime
    if can_see("social_links"): response_data["social_links"] = profile.social_links
        
    if is_owner or is_staff or is_citizen_plus:
        response_data["discord_username"] = user.discord_username
        response_data["email"] = user.email
        
    if is_owner or is_staff:
        response_data["in_game_username"] = profile.in_game_username
        response_data["use_in_game_name"] = profile.use_in_game_name
        response_data["privacy_settings"] = profile.privacy_settings
        
    for group in user.led_groups:
        response_data["led_groups"].append(UserGroupRead.from_orm(group))
    for group in user.groups:
        if group.leader_id != user.id:
             response_data["groups"].append(UserGroupRead.from_orm(group))
             
    return UserPublicProfile(**response_data)

@router.patch("/me/profile", response_model=UserReadWithProfile)
async def update_own_profile(
    profile_update: ProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    if not current_user.profile:
        profile = Profile(user_id=current_user.id)
        session.add(profile)
        session.commit()
        session.refresh(current_user)
        
    profile = current_user.profile
    update_data = profile_update.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(profile, key, value)
        
    session.add(profile)
    session.commit()
    session.refresh(profile)
    session.refresh(current_user)
    
    return current_user

@router.post("/me/avatar")
async def upload_avatar(file: UploadFile = File(...), current_user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"avatar_{current_user.id}_{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    image_url = f"/{os.path.join(UPLOAD_DIR, filename)}"
    if not current_user.profile:
        profile = Profile(user_id=current_user.id, avatar_url=image_url)
        session.add(profile)
    else:
        current_user.profile.avatar_url = image_url
        session.add(current_user.profile)
    session.commit()
    return {"url": image_url}

@router.post("/me/header")
async def upload_header(file: UploadFile = File(...), current_user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"header_{current_user.id}_{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    image_url = f"/{os.path.join(UPLOAD_DIR, filename)}"
    if not current_user.profile:
        profile = Profile(user_id=current_user.id, header_image_url=image_url)
        session.add(profile)
    else:
        current_user.profile.header_image_url = image_url
        session.add(current_user.profile)
    session.commit()
    return {"url": image_url}
