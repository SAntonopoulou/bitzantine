from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlmodel import Session, select
from typing import List, Optional, Dict, Any
from datetime import datetime
import shutil
import os
import uuid
from sqlalchemy import or_, cast, String, desc, asc

from database import get_session
from models import Announcement, User, UserRole, AnnouncementUpdate
from auth import get_current_active_user, RoleChecker

router = APIRouter(
    prefix="/announcements",
    tags=["announcements"],
    responses={404: {"description": "Not found"}},
)

UPLOAD_DIR = "static/uploads/announcements"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("")
async def create_announcement(
    title: str = Form(...),
    content: str = Form(...),
    tags: str = Form("[]"),
    file: Optional[UploadFile] = File(None),
    user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    session: Session = Depends(get_session)
):
    image_url = None
    if file:
        file_extension = os.path.splitext(file.filename)[1]
        filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        image_url = f"/{UPLOAD_DIR}/{filename}"

    import json
    try:
        tags_list = json.loads(tags)
    except json.JSONDecodeError:
        tags_list = [t.strip() for t in tags.split(',') if t.strip()]

    announcement = Announcement(
        title=title,
        content=content,
        image_url=image_url,
        tags=tags_list,
        author_id=user.id,
        created_at=datetime.utcnow()
    )
    
    session.add(announcement)
    session.commit()
    session.refresh(announcement)
    return announcement

@router.get("", response_model=List[Announcement])
async def get_announcements(skip: int = 0, limit: int = 10, session: Session = Depends(get_session)):
    announcements = session.exec(select(Announcement).order_by(desc(Announcement.created_at)).offset(skip).limit(limit)).all()
    return announcements

@router.get("/{announcement_id}", response_model=Dict[str, Any])
async def get_announcement(announcement_id: int, session: Session = Depends(get_session)):
    announcement = session.get(Announcement, announcement_id)
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    # Get next and previous announcement IDs
    previous_announcement_id = session.exec(
        select(Announcement.id)
        .where(Announcement.created_at > announcement.created_at)
        .order_by(asc(Announcement.created_at))
        .limit(1)
    ).first()
    
    next_announcement_id = session.exec(
        select(Announcement.id)
        .where(Announcement.created_at < announcement.created_at)
        .order_by(desc(Announcement.created_at))
        .limit(1)
    ).first()

    return {
        "announcement": announcement,
        "previous_id": next_announcement_id,
        "next_id": previous_announcement_id,
    }

@router.put("/{announcement_id}", response_model=Announcement)
async def update_announcement(
    announcement_id: int, 
    announcement_update: AnnouncementUpdate,
    user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    session: Session = Depends(get_session)
):
    db_announcement = session.get(Announcement, announcement_id)
    if not db_announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    update_data = announcement_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_announcement, key, value)
    
    session.add(db_announcement)
    session.commit()
    session.refresh(db_announcement)
    return db_announcement

@router.delete("/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_announcement(
    announcement_id: int,
    user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN])),
    session: Session = Depends(get_session)
):
    announcement = session.get(Announcement, announcement_id)
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    session.delete(announcement)
    session.commit()
    return
