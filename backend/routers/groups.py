from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from database import get_session
from models import Group, User, UserRole, UserGroupLink, MembershipStatus, GroupRole, Profile
from auth import get_current_active_user, RoleChecker
import shutil
import os
import uuid

router = APIRouter(
    prefix="/groups",
    tags=["groups"],
)

# --- Helper for Hierarchy ---
def get_group_tree(session: Session, parent_id: Optional[int] = None):
    statement = select(Group).where(Group.parent_id == parent_id).options(
        selectinload(Group.leader).selectinload(User.profile),
        selectinload(Group.children)
    )
    groups = session.exec(statement).all()
    
    tree = []
    for group in groups:
        # Fetch officers manually or via relationship if defined
        officers_stmt = select(User).join(UserGroupLink).where(
            UserGroupLink.group_id == group.id,
            UserGroupLink.group_role == GroupRole.OFFICER,
            UserGroupLink.status == MembershipStatus.APPROVED
        ).options(selectinload(User.profile))
        officers = session.exec(officers_stmt).all()
        
        group_data = {
            "id": group.id,
            "name": group.name,
            "description": group.description,
            "type": group.type,
            "image_url": group.image_url,
            "leader": {
                "id": group.leader.id,
                "username": group.leader.username,
                "display_name": group.leader.display_name,
                "avatar_url": group.leader.profile.avatar_url if group.leader.profile else None
            } if group.leader else None,
            "officers": [{
                "id": officer.id,
                "username": officer.username,
                "display_name": officer.display_name,
                "avatar_url": officer.profile.avatar_url if officer.profile else None
            } for officer in officers],
            "children": get_group_tree(session, group.id)
        }
        tree.append(group_data)
    return tree

@router.get("/hierarchy")
def get_hierarchy(session: Session = Depends(get_session)):
    return get_group_tree(session)

@router.get("/", response_model=List[Group])
def get_groups(session: Session = Depends(get_session)):
    groups = session.exec(select(Group).options(selectinload(Group.leader).selectinload(User.profile))).all()
    return groups

@router.get("/{id}")
def get_group(id: int, session: Session = Depends(get_session)):
    group = session.exec(select(Group).where(Group.id == id).options(selectinload(Group.leader).selectinload(User.profile))).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Get members with roles
    members_stmt = select(User, UserGroupLink.group_role, UserGroupLink.status).join(UserGroupLink).where(UserGroupLink.group_id == id).options(selectinload(User.profile))
    members_data = session.exec(members_stmt).all()
    
    return {
        "group": group,
        "members": [{"user": {
            "id": m[0].id,
            "username": m[0].username,
            "display_name": m[0].display_name,
            "avatar_url": m[0].profile.avatar_url if m[0].profile else None
        }, "role": m[1], "status": m[2]} for m in members_data]
    }

@router.post("/", response_model=Group, dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN]))])
async def create_group(
    name: str = Form(...),
    description: str = Form(...),
    type: str = Form(...),
    leader_id: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session)
):
    image_url = None
    if image:
        file_extension = os.path.splitext(image.filename)[1]
        file_name = f"{uuid.uuid4()}{file_extension}"
        file_path = f"static/images/{file_name}"
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_url = f"/static/images/{file_name}"

    group = Group(
        name=name,
        description=description,
        type=type,
        image_url=image_url,
        leader_id=leader_id
    )
    session.add(group)
    session.commit()
    session.refresh(group)

    # If a leader is assigned, add them as a member with LEADER role
    if leader_id:
        link = UserGroupLink(
            user_id=leader_id, 
            group_id=group.id, 
            status=MembershipStatus.APPROVED, 
            group_role=GroupRole.LEADER
        )
        session.add(link)
        session.commit()

    return group

@router.patch("/{id}", response_model=Group, dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN]))])
async def update_group(
    id: int,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    type: Optional[str] = Form(None),
    leader_id: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session)
):
    group = session.get(Group, id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if name:
        group.name = name
    if description:
        group.description = description
    if type:
        group.type = type
    
    if image:
        file_extension = os.path.splitext(image.filename)[1]
        file_name = f"{uuid.uuid4()}{file_extension}"
        file_path = f"static/images/{file_name}"
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        group.image_url = f"/static/images/{file_name}"

    if leader_id is not None:
        # If leader changed
        if group.leader_id != leader_id:
            # Demote old leader if exists
            if group.leader_id:
                old_link = session.exec(select(UserGroupLink).where(UserGroupLink.user_id == group.leader_id, UserGroupLink.group_id == id)).first()
                if old_link:
                    old_link.group_role = GroupRole.MEMBER
                    session.add(old_link)
            
            group.leader_id = leader_id
            
            # Promote new leader
            if leader_id:
                new_link = session.exec(select(UserGroupLink).where(UserGroupLink.user_id == leader_id, UserGroupLink.group_id == id)).first()
                if new_link:
                    new_link.group_role = GroupRole.LEADER
                    new_link.status = MembershipStatus.APPROVED
                    session.add(new_link)
                else:
                    new_link = UserGroupLink(
                        user_id=leader_id, 
                        group_id=id, 
                        status=MembershipStatus.APPROVED, 
                        group_role=GroupRole.LEADER
                    )
                    session.add(new_link)

    session.add(group)
    session.commit()
    session.refresh(group)
    return group

def delete_group_recursive(session: Session, group_id: int):
    # Find children
    children = session.exec(select(Group).where(Group.parent_id == group_id)).all()
    for child in children:
        delete_group_recursive(session, child.id)
    
    # Delete links
    links = session.exec(select(UserGroupLink).where(UserGroupLink.group_id == group_id)).all()
    for link in links:
        session.delete(link)
        
    # Delete group
    group = session.get(Group, group_id)
    if group:
        session.delete(group)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN]))])
def delete_group(id: int, session: Session = Depends(get_session)):
    group = session.get(Group, id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    delete_group_recursive(session, id)
    session.commit()

@router.patch("/{id}/move", dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN]))])
def move_group(id: int, parent_id: Optional[int], session: Session = Depends(get_session)):
    group = session.get(Group, id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    group.parent_id = parent_id
    session.add(group)
    session.commit()
    return {"message": "Group moved successfully"}

@router.patch("/{id}/leader", dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN]))])
def assign_leader(id: int, leader_id: int, session: Session = Depends(get_session)):
    group = session.get(Group, id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    user = session.get(User, leader_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    group.leader_id = leader_id
    session.add(group)
    
    # Ensure leader is also a member
    link = session.exec(select(UserGroupLink).where(UserGroupLink.user_id == leader_id, UserGroupLink.group_id == id)).first()
    if not link:
        link = UserGroupLink(user_id=leader_id, group_id=id, status=MembershipStatus.APPROVED, group_role=GroupRole.LEADER)
        session.add(link)
    else:
        link.status = MembershipStatus.APPROVED
        link.group_role = GroupRole.LEADER
        session.add(link)
        
    session.commit()
    return {"message": "Leader assigned successfully"}

@router.post("/{id}/apply")
def apply_to_group(id: int, current_user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    if current_user.role not in [UserRole.CITIZEN, UserRole.OFFICER, UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Only Citizens or higher can apply to groups")
    
    existing_link = session.exec(select(UserGroupLink).where(UserGroupLink.user_id == current_user.id, UserGroupLink.group_id == id)).first()
    if existing_link:
        raise HTTPException(status_code=400, detail="Already a member or application pending")
    
    link = UserGroupLink(user_id=current_user.id, group_id=id, status=MembershipStatus.PENDING, group_role=GroupRole.MEMBER)
    session.add(link)
    session.commit()
    return {"message": "Application submitted"}

@router.patch("/{id}/members/{user_id}/approve")
def approve_member(id: int, user_id: int, current_user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    # Check if current_user is leader or officer of the group
    auth_link = session.exec(select(UserGroupLink).where(
        UserGroupLink.user_id == current_user.id, 
        UserGroupLink.group_id == id,
        UserGroupLink.group_role.in_([GroupRole.LEADER, GroupRole.OFFICER]),
        UserGroupLink.status == MembershipStatus.APPROVED
    )).first()
    
    if not auth_link and current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to approve members")
    
    link = session.exec(select(UserGroupLink).where(UserGroupLink.user_id == user_id, UserGroupLink.group_id == id)).first()
    if not link:
        raise HTTPException(status_code=404, detail="Application not found")
    
    link.status = MembershipStatus.APPROVED
    session.add(link)
    session.commit()
    return {"message": "Member approved"}

@router.post("/{id}/officers/{user_id}")
def promote_to_officer(id: int, user_id: int, current_user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    group = session.get(Group, id)
    if group.leader_id != current_user.id and current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Only the leader can promote officers")
    
    link = session.exec(select(UserGroupLink).where(UserGroupLink.user_id == user_id, UserGroupLink.group_id == id)).first()
    if not link or link.status != MembershipStatus.APPROVED:
        raise HTTPException(status_code=400, detail="User must be an approved member first")
    
    link.group_role = GroupRole.OFFICER
    session.add(link)
    session.commit()
    return {"message": "Promoted to officer"}

@router.delete("/{id}/officers/{user_id}")
def demote_officer(id: int, user_id: int, current_user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    group = session.get(Group, id)
    if group.leader_id != current_user.id and current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Only the leader can demote officers")
    
    link = session.exec(select(UserGroupLink).where(UserGroupLink.user_id == user_id, UserGroupLink.group_id == id)).first()
    if not link:
        raise HTTPException(status_code=404, detail="Membership not found")
    
    link.group_role = GroupRole.MEMBER
    session.add(link)
    session.commit()
    return {"message": "Demoted to member"}

@router.delete("/{id}/members/{user_id}")
def remove_member(id: int, user_id: int, current_user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    # Self-leave or removal by leader/officer
    is_self = current_user.id == user_id
    
    auth_link = session.exec(select(UserGroupLink).where(
        UserGroupLink.user_id == current_user.id, 
        UserGroupLink.group_id == id,
        UserGroupLink.group_role.in_([GroupRole.LEADER, GroupRole.OFFICER]),
        UserGroupLink.status == MembershipStatus.APPROVED
    )).first()
    
    if not is_self and not auth_link and current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to remove members")
    
    link = session.exec(select(UserGroupLink).where(UserGroupLink.user_id == user_id, UserGroupLink.group_id == id)).first()
    if not link:
        raise HTTPException(status_code=404, detail="Membership not found")
    
    # If the leader is leaving, set group.leader_id to None
    group = session.get(Group, id)
    if group.leader_id == user_id:
        if is_self:
            group.leader_id = None
            session.add(group)
        else:
            raise HTTPException(status_code=400, detail="Cannot remove the leader. Assign a new leader first.")

    session.delete(link)
    session.commit()
    return {"message": "Member removed or left group"}
