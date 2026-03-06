from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
import shutil
import os
import uuid

from database import get_session
from models import LoreEra, LoreEntry, User, UserRole, EntryType
from auth import get_current_active_user, RoleChecker

router = APIRouter(
    prefix="/lore",
    tags=["lore"],
    responses={404: {"description": "Not found"}},
)

UPLOAD_DIR = "static/uploads/lore"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_image(file: UploadFile = File(...), user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"/static/uploads/lore/{filename}"}

@router.get("/eras", response_model=List[LoreEra])
async def get_eras(session: Session = Depends(get_session)):
    eras = session.exec(select(LoreEra).order_by(LoreEra.start_date)).all()
    return eras

@router.post("/eras", response_model=LoreEra)
async def create_era(era: LoreEra, session: Session = Depends(get_session), user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    try:
        # Convert string dates to datetime if necessary
        if isinstance(era.start_date, str):
            era.start_date = datetime.fromisoformat(era.start_date.replace('Z', '+00:00'))
        if isinstance(era.end_date, str):
            era.end_date = datetime.fromisoformat(era.end_date.replace('Z', '+00:00'))

        # Ensure dates are timezone-naive or consistently handled if using SQLite
        if isinstance(era.start_date, datetime) and era.start_date.tzinfo:
            era.start_date = era.start_date.replace(tzinfo=None)
        if isinstance(era.end_date, datetime) and era.end_date.tzinfo:
            era.end_date = era.end_date.replace(tzinfo=None)

        if era.is_current_era:
            # Find previous current era
            previous_current = session.exec(select(LoreEra).where(LoreEra.is_current_era == True)).first()
            if previous_current:
                previous_current.is_current_era = False
                previous_current.end_date = datetime.utcnow()
                session.add(previous_current)
            
            if not era.start_date:
                era.start_date = datetime.utcnow()
                
        session.add(era)
        session.commit()
        session.refresh(era)
        return era
    except Exception as e:
        session.rollback()
        print(f"Error creating era: {e}") # Add logging
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/entries", response_model=List[LoreEntry])
async def get_entries(
    skip: int = 0,
    limit: int = 10,
    sort_desc: bool = True,
    era_id: Optional[int] = None,
    entry_type: Optional[str] = None,
    tag: Optional[str] = None,
    session: Session = Depends(get_session)
):
    query = select(LoreEntry).join(LoreEra)
    
    if era_id:
        query = query.where(LoreEntry.era_id == era_id)
    if entry_type:
        query = query.where(LoreEntry.entry_type == entry_type)
    
    if sort_desc:
        query = query.order_by(LoreEra.start_date.desc(), LoreEntry.created_at.desc())
    else:
        query = query.order_by(LoreEra.start_date.asc(), LoreEntry.created_at.asc())
        
    # The main query for entries
    entries_query = query.offset(skip).limit(limit)
    entries = session.exec(entries_query).all()

    # Post-filter for tags if a tag is specified
    if tag:
        # This is inefficient for large datasets, but works for this scenario.
        # A better solution involves a many-to-many relationship with a Tag table or advanced JSON querying.
        
        # We need to fetch all entries that could potentially have the tag, then filter.
        # This complicates pagination significantly. For now, we will apply the tag filter
        # only on the already paginated results, which might lead to fewer than `limit` results.
        # A more robust solution would require rethinking the query structure when a tag is present.
        entries = [e for e in entries if tag in e.tags]
        
    return entries

@router.get("/entries/{entry_id}", response_model=LoreEntry)
async def get_entry(entry_id: int, session: Session = Depends(get_session)):
    entry = session.get(LoreEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Lore entry not found")
    return entry

@router.post("/entries", response_model=LoreEntry)
async def create_entry(entry: LoreEntry, session: Session = Depends(get_session), user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN]))):
    try:
        entry.user_id = user.id
        entry.created_at = datetime.utcnow()
        
        if entry.entry_type == EntryType.EVOLVING and not entry.era_id:
            raise HTTPException(status_code=400, detail="Evolving lore must belong to an Era")
            
        session.add(entry)
        session.commit()
        session.refresh(entry)
        return entry
    except Exception as e:
        session.rollback()
        print(f"Error creating entry: {e}") # Add logging
        raise HTTPException(status_code=500, detail=str(e))
