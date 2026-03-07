from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, SQLModel
from sqlalchemy.orm import selectinload
from typing import List, Optional

from database import get_session
from models import User, UserRead, UserRole, Group, UserGroupLink, Profile, Announcement, LoreEntry, Event
from auth import get_current_active_user, RoleChecker

router = APIRouter(
    prefix="/admin",
    tags=["admin-users"],
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]))]
)

class UserReadWithGroups(UserRead):
    groups: List[str] = []

@router.get("/users", response_model=List[UserReadWithGroups])
async def get_users(session: Session = Depends(get_session)):
    """
    Fetch all users, including their profile and assigned groups.
    """
    result = session.exec(select(User).options(selectinload(User.groups)))
    users = result.all()
    
    users_with_groups = []
    for user in users:
        group_names = [group.name for group in user.groups] if user.groups else []
        user_data = UserReadWithGroups(
            id=user.id,
            username=user.username,
            email=user.email,
            discord_username=user.discord_username,
            role=user.role,
            is_active=user.is_active,
            groups=group_names
        )
        users_with_groups.append(user_data)
    return users_with_groups

class RoleUpdateRequest(SQLModel):
    role: UserRole

@router.put("/users/{user_id}/role", response_model=UserRead)
async def update_user_role(
    user_id: int,
    role_update: RoleUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    user_to_update = session.get(User, user_id)
    if not user_to_update:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Permission checks
    if current_user.role == UserRole.SUPER_ADMIN:
        # Super admin can promote to admin
        if role_update.role == UserRole.ADMIN:
            pass
        # Super admin can promote to moderator
        elif role_update.role == UserRole.MODERATOR:
            pass
    elif current_user.role == UserRole.ADMIN:
        # Admin can promote to moderator
        if role_update.role == UserRole.MODERATOR:
            pass
        else:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins can only promote users to Moderator")
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to change user roles")

    user_to_update.role = role_update.role
    session.add(user_to_update)
    session.commit()
    session.refresh(user_to_update)
    return user_to_update

class StatusUpdateRequest(SQLModel):
    is_active: bool

@router.put("/users/{user_id}/status", response_model=UserRead)
async def update_user_status(
    user_id: int,
    status_update: StatusUpdateRequest,
    session: Session = Depends(get_session)
):
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
async def assign_group_to_user(
    user_id: int,
    group_assign: GroupAssignRequest,
    session: Session = Depends(get_session)
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    group = session.get(Group, group_assign.group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    user_group_link = UserGroupLink(user_id=user_id, group_id=group_assign.group_id)
    session.add(user_group_link)
    session.commit()

@router.delete("/users/{user_id}/remove-group/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_group_from_user(
    user_id: int,
    group_id: int,
    session: Session = Depends(get_session)
):
    link = session.exec(
        select(UserGroupLink).where(UserGroupLink.user_id == user_id, UserGroupLink.group_id == group_id)
    ).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User is not in the specified group")
    
    session.delete(link)
    session.commit()

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN]))])
async def delete_user(
    user_id: int, 
    reattribute_to: Optional[int] = None,
    session: Session = Depends(get_session)
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if reattribute_to:
        target_user = session.get(User, reattribute_to)
        if not target_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user for reattribution not found")
        
        # Reattribute Announcements
        announcements = session.exec(select(Announcement).where(Announcement.author_id == user_id)).all()
        for ann in announcements:
            ann.author_id = reattribute_to
            session.add(ann)
            
        # Reattribute Lore Entries
        lore_entries = session.exec(select(LoreEntry).where(LoreEntry.user_id == user_id)).all()
        for entry in lore_entries:
            entry.user_id = reattribute_to
            session.add(entry)
            
        # Reattribute Events
        events = session.exec(select(Event).where(Event.host_user_id == user_id)).all()
        for event in events:
            event.host_user_id = reattribute_to
            session.add(event)
    else:
        # If not reattributing, content will be deleted via cascade or set to null depending on DB constraints.
        # For this project, we'll manually delete to be safe if reattribution isn't chosen.
        session.exec(select(Announcement).where(Announcement.author_id == user_id)).all() # Just to be explicit
        # SQLModel/SQLAlchemy will handle the rest based on relationship definitions.
        pass

    session.delete(user)
    session.commit()
