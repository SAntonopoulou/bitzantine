from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from database import create_db_and_tables, get_session, engine
from models import User, UserCreate, UserRead, Token, UserRole, UserReadMe, Profile, HomeSection, SiteSetting
from auth import get_password_hash, verify_password, create_access_token, get_current_active_user, RoleChecker
from routers import events, groups, lore, announcements, admin_events, admin, admin_users, users, polls, home, admin_home, admin_site_settings, streamers
from typing import List, Dict
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    # Super Admin Initialization & Default Settings
    with Session(engine) as session:
        # Super Admin
        super_admin = session.exec(select(User).where(User.role == UserRole.SUPER_ADMIN)).first()
        if not super_admin:
            username = os.getenv("DEFAULT_SUPERADMIN_USERNAME", "admin")
            password = os.getenv("DEFAULT_SUPERADMIN_PASSWORD", "admin")
            hashed_password = get_password_hash(password)
            user = User(
                username=username,
                email="admin@example.com",
                hashed_password=hashed_password,
                role=UserRole.SUPER_ADMIN,
                is_active=True
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            profile = Profile(user_id=user.id)
            session.add(profile)
            session.commit()
        
        # Default Site Name
        site_name = session.get(SiteSetting, "site_name")
        if not site_name:
            session.add(SiteSetting(key="site_name", value="Bitzantium"))
            session.commit()

        # Default Home Sections
        home_sections_count = session.exec(select(HomeSection)).first()
        if not home_sections_count:
            default_sections = [
                HomeSection(section_key="hero", title="The Bitzantine Empire", subtitle="Democracy. Industry. War.", content="Join the most prestigious civilization in Bitcraft. Build, trade, and conquer with honor.", image_url="https://picsum.photos/seed/bitzantine/1920/1080", cta_text="Join the Empire", cta_link="/join", order_index=1, is_visible=True),
                HomeSection(section_key="democracy", title="Structured Government", content="A clear hierarchy ensuring order and prosperity for all citizens. We are a democratic guild where members vote on governance and shape the future.", order_index=2, is_visible=True),
                HomeSection(section_key="military", title="THE ENEMY AT THE GATES", subtitle="War Against the Ottoadman Empire", content="Defending our borders and expanding our influence across the realm. We are sworn enemies of the Ottoadman Empire.", order_index=3, is_visible=True),
                HomeSection(section_key="crafting", title="Organized Crafting", content="Highly organized crafting schedules allowing for massive output; resources always stocked.", order_index=4, is_visible=True),
                HomeSection(section_key="recruitment_military", title="Join the Military", content="Protect our lands, conquer new territories, and ensure the safety of our crafters.", cta_text="ENLIST NOW", cta_link="/join?track=military", order_index=5, is_visible=True),
                HomeSection(section_key="recruitment_industry", title="Join Industry", content="Fuel the war machine, build our cities, and master the arcane arts of crafting.", cta_text="START CRAFTING", cta_link="/join?track=industry", order_index=6, is_visible=True)
            ]
            session.add_all(default_sections)
            session.commit()
            
    yield

app = FastAPI(lifespan=lifespan)

# CORS Configuration
origins = [ "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://localhost:8000", "http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:8081" ]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# Mount static files
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include Routers
app.include_router(events.router)
app.include_router(groups.router)
app.include_router(lore.router)
app.include_router(announcements.router)
app.include_router(polls.router)
app.include_router(home.router)
app.include_router(users.router)
app.include_router(streamers.router)
app.include_router(admin.router)
app.include_router(admin_events.router)
app.include_router(admin_users.router)
app.include_router(admin_home.router)
app.include_router(admin_site_settings.router)

# --- Publicly Accessible Site Settings ---
@app.get("/site-settings", response_model=Dict[str, str], tags=["public"])
def get_public_site_settings(session: Session = Depends(get_session)):
    settings = session.exec(select(SiteSetting)).all()
    return {setting.key: setting.value for setting in settings}

# --- Authentication & User Creation ---
@app.post("/token", response_model=Token, tags=["auth"])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password", headers={"WWW-Authenticate": "Bearer"})
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user. Please wait for admin approval.")
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users", response_model=UserRead, tags=["users"])
async def create_user(user: UserCreate, session: Session = Depends(get_session)):
    db_user = session.exec(select(User).where(User.username == user.username)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    db_user = User(username=user.username, email=user.email, hashed_password=hashed_password, discord_username=user.discord_username, is_active=False)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    profile = Profile(user_id=db_user.id)
    session.add(profile)
    session.commit()
    return db_user

@app.get("/api")
def read_root():
    return {"Hello": "World"}
