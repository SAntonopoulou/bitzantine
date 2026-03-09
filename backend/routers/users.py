from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Body
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict
import shutil
import os
import uuid
import random
from datetime import date, datetime, timedelta

from database import get_session
from models import (
    User, Profile, UserRead, UserReadWithProfile, ProfileUpdate, 
    UserPublicProfile, UserGroupRead, GroupRole, MembershipStatus, UserGroupLink,
    PrivacyLevel, UserRole, UserReadMe, Announcement, LoreEntry, Poll, Event, EventRSVP, PollVote, Group,
    StreamerStatus
)
from auth import get_current_active_user, get_optional_current_active_user, get_password_hash, RoleChecker
from email_utils import send_email

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
    led_groups = session.exec(select(Group).where(Group.leader_id == user_id)).all()
    for group in led_groups:
        group.leader_id = None
        session.add(group)
    for model in [Announcement, LoreEntry, Poll, Event]:
        author_field = "author_id" if hasattr(model, "author_id") else "user_id" if hasattr(model, "user_id") else "host_user_id"
        items = session.exec(select(model).where(getattr(model, author_field) == user_id)).all()
        for item in items:
            session.delete(item)
    for item in session.exec(select(UserGroupLink).where(UserGroupLink.user_id == user_id)).all():
        session.delete(item)
    for item in session.exec(select(EventRSVP).where(EventRSVP.user_id == user_id)).all():
        session.delete(item)
    for item in session.exec(select(PollVote).where(PollVote.user_id == user_id)).all():
        session.delete(item)
    profile = session.exec(select(Profile).where(Profile.user_id == user_id)).first()
    if profile:
        session.delete(profile)
    user_to_delete = session.get(User, user_id)
    if user_to_delete:
        session.delete(user_to_delete)
    session.commit()
    return

@router.post("/me/streamer-apply", status_code=status.HTTP_202_ACCEPTED)
async def apply_for_streamer(
    social_links: Dict[str, str],
    current_user: User = Depends(RoleChecker([UserRole.CITIZEN, UserRole.OFFICER, UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    session: Session = Depends(get_session)
):
    profile = current_user.profile
    if not profile:
        profile = Profile(user_id=current_user.id)
        session.add(profile)
    
    profile.social_links = {**(profile.social_links or {}), **social_links}
    profile.streamer_status = StreamerStatus.PENDING
    
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return {"message": "Application submitted successfully."}

@router.patch("/me/streamer-settings", status_code=status.HTTP_200_OK)
async def update_streamer_settings(
    visibility: PrivacyLevel,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    profile = current_user.profile
    if not profile or profile.streamer_status != StreamerStatus.APPROVED:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not an approved streamer.")
    
    if visibility not in [PrivacyLevel.PUBLIC, PrivacyLevel.MEMBERS_ONLY]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid visibility level.")

    profile.streamer_visibility = visibility
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return {"message": "Settings updated."}

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
        "streamer_status": profile.streamer_status, "streamer_visibility": profile.streamer_visibility,
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

@router.post("/me/change-email")
async def change_email(
    new_email: str = Body(..., embed=True),
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    # Check if email is already taken
    existing_user = session.exec(select(User).where(User.email == new_email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    old_email = current_user.email
    current_user.email = new_email
    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    # Send notification to old email
    send_email(
        to_email=old_email,
        subject="Your Bitzantine Email Has Been Changed",
        html_content=f"<p>Hello {current_user.username},</p><p>Your email address has been changed to {new_email}. If you did not authorize this change, please contact support immediately.</p>"
    )

    # Send verification/notification to new email
    send_email(
        to_email=new_email,
        subject="Email Changed Successfully",
        html_content=f"<p>Hello {current_user.username},</p><p>Your email address has been successfully changed to {new_email}.</p>"
    )

    return {"message": "Email updated successfully"}

@router.post("/me/request-password-change")
async def request_password_change(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    verification_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    verification_code_expires_at = datetime.utcnow() + timedelta(minutes=15)

    current_user.verification_code = verification_code
    current_user.verification_code_expires_at = verification_code_expires_at
    session.add(current_user)
    session.commit()

    send_email(
        to_email=current_user.email,
        subject="Password Change Request",
        html_content=f"""
        <p>Hello {current_user.username},</p>
        <p>You have requested to change your password. Please use the following code to verify your identity:</p>
        <h2>{verification_code}</h2>
        <p>This code will expire in 15 minutes.</p>
        <p>If you did not request this change, please ignore this email.</p>
        """
    )

    return {"message": "Verification code sent to your email"}

@router.post("/me/change-password")
async def change_password(
    code: str = Body(..., embed=True),
    new_password: str = Body(..., embed=True),
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    if not current_user.verification_code or current_user.verification_code != code:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    if not current_user.verification_code_expires_at or datetime.utcnow() > current_user.verification_code_expires_at:
        raise HTTPException(status_code=400, detail="Verification code has expired")

    current_user.hashed_password = get_password_hash(new_password)
    current_user.verification_code = None
    current_user.verification_code_expires_at = None
    session.add(current_user)
    session.commit()

    send_email(
        to_email=current_user.email,
        subject="Password Changed Successfully",
        html_content=f"<p>Hello {current_user.username},</p><p>Your password has been successfully changed.</p>"
    )

    return {"message": "Password changed successfully"}
