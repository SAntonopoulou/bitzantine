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
    UserPublicProfile, UserGroupRead, GroupRole, MembershipStatus, UserGroupLink
)
from auth import get_current_active_user

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

UPLOAD_DIR = "static/uploads/profiles"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/{username}/profile", response_model=UserPublicProfile)
async def get_user_profile(username: str, session: Session = Depends(get_session)):
    user = session.exec(
        select(User)
        .where(User.username == username)
        .options(
            selectinload(User.profile),
            selectinload(User.groups),
            selectinload(User.led_groups)
        )
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Ensure profile exists
    if not user.profile:
        # Create empty profile if not exists
        profile = Profile(user_id=user.id)
        session.add(profile)
        session.commit()
        session.refresh(user)
    
    profile = user.profile
    privacy = profile.privacy_settings or {}
    
    # Mandatory Public Fields
    response_data = {
        "id": user.id,
        "username": user.username,
        "avatar_url": profile.avatar_url,
        "header_image_url": profile.header_image_url,
        "username_color": profile.username_color,
        "in_game_activities": profile.in_game_activities,
        "groups": [],
        "led_groups": []
    }
    
    # Optional Public Fields based on Privacy Settings
    if privacy.get("show_bio", True):
        response_data["bio"] = profile.bio
    if privacy.get("show_real_name", False):
        response_data["real_name"] = profile.real_name
    if privacy.get("show_gender", False):
        response_data["gender"] = profile.gender
    if privacy.get("show_birthdate", False):
        response_data["birthdate"] = profile.birthdate
    if privacy.get("show_location", False):
        response_data["location"] = profile.location
    if privacy.get("show_discord", False):
        response_data["discord_username"] = user.discord_username
    if privacy.get("show_email", False):
        response_data["email"] = user.email
    if privacy.get("show_social_links", True):
        response_data["social_links"] = profile.social_links
        
    # Process Groups
    # Led Groups
    for group in user.led_groups:
        response_data["led_groups"].append(UserGroupRead(id=group.id, name=group.name, type=group.type))
        
    # Member Groups (excluding led groups)
    for group in user.groups:
        # Check if user is just a member/officer but not the main leader (already covered in led_groups)
        if group.leader_id != user.id:
             response_data["groups"].append(UserGroupRead(id=group.id, name=group.name, type=group.type))
             
    return response_data

@router.patch("/me/profile", response_model=UserReadWithProfile)
async def update_own_profile(
    profile_update: ProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    # Ensure profile exists
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
    session.refresh(current_user)
    
    # Re-fetch to ensure all relationships are loaded if needed, though for this return type it might be simple
    user = session.exec(
        select(User)
        .where(User.id == current_user.id)
        .options(selectinload(User.profile))
    ).first()
    
    return user

@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"avatar_{current_user.id}_{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    image_url = f"/{UPLOAD_DIR}/{filename}"
    
    if not current_user.profile:
        profile = Profile(user_id=current_user.id, avatar_url=image_url)
        session.add(profile)
    else:
        current_user.profile.avatar_url = image_url
        session.add(current_user.profile)
        
    session.commit()
    return {"url": image_url}

@router.post("/me/header")
async def upload_header(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"header_{current_user.id}_{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    image_url = f"/{UPLOAD_DIR}/{filename}"
    
    if not current_user.profile:
        profile = Profile(user_id=current_user.id, header_image_url=image_url)
        session.add(profile)
    else:
        current_user.profile.header_image_url = image_url
        session.add(current_user.profile)
        
    session.commit()
    return {"url": image_url}
