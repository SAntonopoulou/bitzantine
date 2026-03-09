from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, SQLModel
from sqlalchemy.orm import selectinload
from typing import List, Optional

from database import get_session
from models import User, UserRead, UserRole, Group, UserGroupLink, Profile, StreamerStatus
from auth import get_current_active_user, RoleChecker

router = APIRouter(
    prefix="/admin",
    tags=["admin-users"],
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]))]
)

@router.get("/users")
async def get_users(session: Session = Depends(get_session)):
    users = session.exec(select(User).options(selectinload(User.profile), selectinload(User.groups))).all()
    response_data = []
    for user in users:
        if not user.profile:
            profile = Profile(user_id=user.id)
            session.add(profile)
            session.commit()
            session.refresh(user)
        user_data = {
            "id": user.id, "username": user.username, "display_name": user.display_name,
            "email": user.email, "discord_username": user.discord_username, "role": user.role,
            "is_active": user.is_active, "groups": [group.name for group in user.groups],
            "avatar_url": user.profile.avatar_url if user.profile else None,
            "streamer_status": user.profile.streamer_status if user.profile else 'none'
        }
        response_data.append(user_data)
    return response_data

@router.get("/streamer-applications", response_model=List[UserRead])
async def get_streamer_applications(session: Session = Depends(get_session)):
    """
    Returns a list of all users whose streamer_status is PENDING.
    """
    pending_users = session.exec(
        select(User)
        .join(Profile)
        .where(Profile.streamer_status == StreamerStatus.PENDING)
        .options(selectinload(User.profile))
    ).all()
    return pending_users

@router.post("/users/{user_id}/streamer-approve", status_code=status.HTTP_200_OK)
async def approve_streamer(user_id: int, session: Session = Depends(get_session)):
    profile = session.exec(select(Profile).where(Profile.user_id == user_id)).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found for user.")
    profile.streamer_status = StreamerStatus.APPROVED
    session.add(profile)
    session.commit()
    return {"message": "Streamer application approved."}

@router.post("/users/{user_id}/streamer-reject", status_code=status.HTTP_200_OK)
async def reject_streamer(user_id: int, session: Session = Depends(get_session)):
    profile = session.exec(select(Profile).where(Profile.user_id == user_id)).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found for user.")
    profile.streamer_status = StreamerStatus.REJECTED
    session.add(profile)
    session.commit()
    return {"message": "Streamer application rejected."}

@router.post("/users/{user_id}/streamer-remove", status_code=status.HTTP_200_OK)
async def remove_streamer(user_id: int, session: Session = Depends(get_session)):
    profile = session.exec(select(Profile).where(Profile.user_id == user_id)).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found for user.")
    profile.streamer_status = StreamerStatus.NONE
    session.add(profile)
    session.commit()
    return {"message": "User removed from streamer program."}

class RoleUpdateRequest(SQLModel):
    role: UserRole

@router.put("/users/{user_id}/role", response_model=UserRead)
async def update_user_role(
    user_id: int, role_update: RoleUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    user_to_update = session.get(User, user_id)
    if not user_to_update:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if current_user.role == UserRole.SUPER_ADMIN:
        # Super admins can assign any role
        pass
    elif current_user.role == UserRole.ADMIN:
        # Admins can assign any role except SUPER_ADMIN
        if role_update.role == UserRole.SUPER_ADMIN:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins cannot assign super admin role.")
    else:
        # Moderators and other roles are not authorized to change user roles
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to change user roles")

    user_to_update.role = role_update.role
    session.add(user_to_update)
    session.commit()
    session.refresh(user_to_update)
    return user_to_update

class StatusUpdateRequest(SQLModel):
    is_active: bool

@router.put("/users/{user_id}/status", response_model=UserRead)
async def update_user_status(user_id: int, status_update: StatusUpdateRequest, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_active = status_update.is_active
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

class GroupAssignRequest(SQLModel):
    group_id: int

@router.post("/users/{user_id}/assign-group", status_code=status.HTTP_204_NO_CONTENT)
async def assign_group_to_user(user_id: int, group_assign: GroupAssignRequest, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    group = session.get(Group, group_assign.group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    existing_link = session.exec(select(UserGroupLink).where(UserGroupLink.user_id == user_id, UserGroupLink.group_id == group_assign.group_id)).first()
    if existing_link: return
    user_group_link = UserGroupLink(user_id=user_id, group_id=group_assign.group_id)
    session.add(user_group_link)
    session.commit()

@router.delete("/users/{user_id}/remove-group/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_group_from_user(user_id: int, group_id: int, session: Session = Depends(get_session)):
    link = session.exec(select(UserGroupLink).where(UserGroupLink.user_id == user_id, UserGroupLink.group_id == group_id)).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User is not in the specified group")
    session.delete(link)
    session.commit()

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN]))])
async def delete_user(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    session.delete(user)
    session.commit()
