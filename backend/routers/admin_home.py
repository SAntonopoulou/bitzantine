from fastapi import APIRouter, Depends, UploadFile, File
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import HomeSection, HomeSectionRead, HomeSectionUpdate, UserRole
from auth import RoleChecker
import shutil
import os
import uuid

router = APIRouter(
    prefix="/admin/home",
    tags=["admin-home"],
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN]))]
)

@router.get("/all", response_model=List[HomeSectionRead])
async def get_all_home_sections(session: Session = Depends(get_session)):
    sections = session.exec(select(HomeSection).order_by(HomeSection.order_index)).all()
    return sections

@router.put("/sections")
async def update_home_sections(sections: List[HomeSectionUpdate], session: Session = Depends(get_session)):
    for section_update in sections:
        if section_update.id:
            db_section = session.get(HomeSection, section_update.id)
            if db_section:
                section_data = section_update.dict(exclude_unset=True)
                for key, value in section_data.items():
                    setattr(db_section, key, value)
                session.add(db_section)
    session.commit()
    return {"message": "Sections updated successfully"}

@router.post("/image")
async def upload_home_image(file: UploadFile = File(...)):
    upload_dir = "static/uploads/home"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"http://localhost:8000/static/uploads/home/{unique_filename}"}
