from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select
from typing import List, Dict
import shutil
import os
import uuid

from database import get_session
from models import SiteSetting, User, UserRole
from auth import RoleChecker

router = APIRouter(
    prefix="/admin/site-settings",
    tags=["admin-site-settings"],
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN]))],
)

UPLOAD_DIR = "static/uploads/branding"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/", response_model=Dict[str, str])
def get_all_site_settings(session: Session = Depends(get_session)):
    """
    Retrieve all site settings as a key-value dictionary.
    """
    settings = session.exec(select(SiteSetting)).all()
    return {setting.key: setting.value for setting in settings}

@router.post("/site_name")
def update_site_name(site_name: str, session: Session = Depends(get_session)):
    """
    Update the site name.
    """
    setting = session.get(SiteSetting, "site_name")
    if not setting:
        setting = SiteSetting(key="site_name", value=site_name)
    else:
        setting.value = site_name
    session.add(setting)
    session.commit()
    session.refresh(setting)
    return setting

@router.post("/logo")
async def upload_logo(file: UploadFile = File(...), session: Session = Depends(get_session)):
    """
    Upload or update the site logo.
    """
    # Sanitize filename and create a unique name
    file_extension = os.path.splitext(file.filename)[1]
    if file_extension not in [".png", ".jpg", ".jpeg", ".gif", ".svg"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")
        
    filename = f"logo_{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    image_url = f"/{file_path}"
    
    setting = session.get(SiteSetting, "site_logo")
    if not setting:
        setting = SiteSetting(key="site_logo", value=image_url)
    else:
        # Optional: Delete the old logo file from storage
        if setting.value and os.path.exists(setting.value.lstrip('/')):
            try:
                os.remove(setting.value.lstrip('/'))
            except OSError as e:
                print(f"Error deleting old logo file: {e}")
        setting.value = image_url
        
    session.add(setting)
    session.commit()
    session.refresh(setting)
    return setting
