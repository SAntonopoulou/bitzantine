from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum
from datetime import datetime
from sqlalchemy import JSON, Column

class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MODERATOR = "moderator"
    OFFICER = "officer"
    CITIZEN = "citizen"
    USER = "user"

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)
    discord_username: Optional[str] = Field(default=None)
    hashed_password: str
    role: UserRole = Field(default=UserRole.USER)
    is_active: bool = Field(default=False)
    
    profile: Optional["Profile"] = Relationship(back_populates="user")
    announcements: List["Announcement"] = Relationship(back_populates="author")
    lore_entries: List["LoreEntry"] = Relationship(back_populates="author")

class Profile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    user_id: int = Field(foreign_key="user.id")
    user: Optional[User] = Relationship(back_populates="profile")

class Group(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: str
    type: str

class Event(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    date: datetime
    description: str

class Announcement(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    content: str
    image_url: Optional[str] = None
    tags: List[str] = Field(default=[], sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    author_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    author: Optional[User] = Relationship(back_populates="announcements")

class EntryType(str, Enum):
    CORE = "core"
    EVOLVING = "evolving"

class LoreEra(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None
    color_hex: str
    image_url: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    is_current_era: bool = Field(default=False)
    
    entries: List["LoreEntry"] = Relationship(back_populates="era", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

class LoreEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    content: str
    entry_type: EntryType
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    era_id: Optional[int] = Field(default=None, foreign_key="loreera.id")
    tags: List[str] = Field(default=[], sa_column=Column(JSON))
    user_id: int = Field(foreign_key="user.id")
    
    era: Optional[LoreEra] = Relationship(back_populates="entries")
    author: Optional[User] = Relationship(back_populates="lore_entries")

# Pydantic models for requests/responses
class UserCreate(SQLModel):
    username: str
    email: str
    password: str
    discord_username: Optional[str] = None

class UserRead(SQLModel):
    id: int
    username: str
    email: str
    discord_username: Optional[str] = None
    role: UserRole
    is_active: bool

class Token(SQLModel):
    access_token: str
    token_type: str

class TokenData(SQLModel):
    username: Optional[str] = None

# Update Models
class AnnouncementUpdate(SQLModel):
    title: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    tags: Optional[List[str]] = None

class LoreEraUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color_hex: Optional[str] = None
    image_url: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_current_era: Optional[bool] = None

class LoreEntryUpdate(SQLModel):
    title: Optional[str] = None
    content: Optional[str] = None
    entry_type: Optional[EntryType] = None
    image_url: Optional[str] = None
    era_id: Optional[int] = None
    tags: Optional[List[str]] = None
