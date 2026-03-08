from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import HomeSection, HomeSectionRead

router = APIRouter(prefix="/home", tags=["home"])

@router.get("/", response_model=List[HomeSectionRead])
async def get_home_sections(session: Session = Depends(get_session)):
    sections = session.exec(select(HomeSection).where(HomeSection.is_visible == True).order_by(HomeSection.order_index)).all()
    return sections
