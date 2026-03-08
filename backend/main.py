from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from database import create_db_and_tables, get_session, engine
from models import User, UserCreate, UserRead, Token, UserRole, UserReadMe, Profile
from auth import get_password_hash, verify_password, create_access_token, get_current_active_user, RoleChecker
from routers import events, groups, lore, announcements, admin_events, admin, admin_users, users, polls
from typing import List
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    # Super Admin Initialization
    with Session(engine) as session:
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

            # Create a profile for the super admin
            profile = Profile(user_id=user.id)
            session.add(profile)
            session.commit()
    yield

app = FastAPI(lifespan=lifespan)

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:8081", # Add the new frontend port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(events.router)
app.include_router(groups.router)
app.include_router(lore.router)
app.include_router(announcements.router)
app.include_router(admin_events.router)
app.include_router(admin.router)
app.include_router(admin_users.router)
app.include_router(users.router)
app.include_router(polls.router)

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user. Please wait for admin approval.",
        )
    access_token = create_access_token(data={"sub": user.username})
    session.commit()
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users", response_model=UserRead)
async def create_user(user: UserCreate, session: Session = Depends(get_session)):
    db_user = session.exec(select(User).where(User.username == user.username)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username, 
        email=user.email, 
        hashed_password=hashed_password,
        discord_username=user.discord_username,
        is_active=False
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    # Create a profile for the new user
    profile = Profile(user_id=db_user.id)
    session.add(profile)
    session.commit()

    return db_user

@app.get("/users/me", response_model=UserReadMe)
async def read_users_me(current_user: User = Depends(get_current_active_user), session: Session = Depends(get_session)):
    # Re-fetch user with groups loaded
    user = session.exec(select(User).where(User.id == current_user.id).options(selectinload(User.groups))).first()
    return user

@app.get("/admin", dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN]))])
async def read_admin_data():
    return {"message": "Hello Admin"}

@app.get("/api")
def read_root():
    return {"Hello": "World"}
