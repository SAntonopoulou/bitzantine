from typing import Optional, List, Dict
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum as PyEnum
from datetime import datetime, date
from sqlalchemy import JSON, Column

# --- Enums ---
class UserRole(str, PyEnum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MODERATOR = "moderator"
    OFFICER = "officer"
    CITIZEN = "citizen"
    USER = "user"

class PrivacyLevel(str, PyEnum):
    PUBLIC = "public"
    PRIVATE = "private"
    MEMBERS_ONLY = "members_only" # Citizens and above

class StreamerStatus(str, PyEnum):
    NONE = "none"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class RSVPStatus(str, PyEnum):
    ATTENDING = "attending"
    INTERESTED = "interested"
    NOT_ATTENDING = "not_attending"

class EntryType(str, PyEnum):
    CORE = "core"
    EVOLVING = "evolving"

class GroupRole(str, PyEnum):
    LEADER = "leader"
    OFFICER = "officer"
    MEMBER = "member"

class MembershipStatus(str, PyEnum):
    PENDING = "pending"
    APPROVED = "approved"

# --- Link Models ---
class UserGroupLink(SQLModel, table=True):
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", primary_key=True)
    group_id: Optional[int] = Field(default=None, foreign_key="group.id", primary_key=True)
    status: MembershipStatus = Field(default=MembershipStatus.PENDING)
    group_role: GroupRole = Field(default=GroupRole.MEMBER)

# --- Base Models ---
class EventBase(SQLModel):
    title: str
    description: str
    date: datetime
    end_time: Optional[datetime] = None
    timezone: str = Field(default="UTC")
    featured_image_url: Optional[str] = None
    host_user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    host_group_id: Optional[int] = Field(default=None, foreign_key="group.id")
    min_participants: Optional[int] = None
    max_participants: Optional[int] = None
    tags: List[str] = Field(default=[], sa_column=Column(JSON))
    category: Optional[str] = None
    recurrence_rule: Optional[str] = None
    is_template: bool = Field(default=False)

class EventRSVPBase(SQLModel):
    user_id: int = Field(foreign_key="user.id")
    event_id: int = Field(foreign_key="event.id")
    status: RSVPStatus

# --- Table Models ---
class SiteSetting(SQLModel, table=True):
    key: str = Field(primary_key=True)
    value: str

class HomeSection(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    section_key: str = Field(unique=True)
    title: str
    subtitle: Optional[str] = None
    content: str
    image_url: Optional[str] = None
    cta_text: Optional[str] = None
    cta_link: Optional[str] = None
    order_index: int
    is_visible: bool = Field(default=True)

class Profile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    header_image_url: Optional[str] = None
    username_color: Optional[str] = None
    
    # Identity
    real_name: Optional[str] = None
    gender: Optional[str] = None
    birthdate: Optional[date] = None
    location: Optional[str] = None
    
    # Gaming Info
    in_game_username: Optional[str] = None
    in_game_activities: Optional[str] = None # Text
    typical_playtime: Optional[str] = None
    
    # Display Settings
    use_in_game_name: bool = Field(default=False)
    
    # Streamer Program
    streamer_status: StreamerStatus = Field(default=StreamerStatus.NONE)
    streamer_visibility: PrivacyLevel = Field(default=PrivacyLevel.PUBLIC)
    
    # JSON Fields
    social_links: Dict = Field(default={}, sa_column=Column(JSON))
    
    # Privacy Settings (JSON)
    privacy_settings: Dict = Field(default={
        "bio": PrivacyLevel.PUBLIC,
        "real_name": PrivacyLevel.PUBLIC,
        "location": PrivacyLevel.PUBLIC,
        "birthdate": PrivacyLevel.PUBLIC,
        "gender": PrivacyLevel.PUBLIC,
        "typical_playtime": PrivacyLevel.PUBLIC,
        "social_links": PrivacyLevel.PUBLIC
    }, sa_column=Column(JSON))
    
    user_id: int = Field(foreign_key="user.id")
    user: Optional["User"] = Relationship(back_populates="profile")

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)
    discord_username: Optional[str] = Field(default=None)
    hashed_password: str
    role: UserRole = Field(default=UserRole.USER)
    is_active: bool = Field(default=False)
    is_verified: bool = Field(default=False)
    verification_code: Optional[str] = Field(default=None, index=True)
    verification_code_expires_at: Optional[datetime] = None
    
    profile: Optional[Profile] = Relationship(back_populates="user", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    announcements: List["Announcement"] = Relationship(back_populates="author")
    lore_entries: List["LoreEntry"] = Relationship(back_populates="author")
    rsvps: List["EventRSVP"] = Relationship(back_populates="user")
    groups: List["Group"] = Relationship(back_populates="members", link_model=UserGroupLink)
    led_groups: List["Group"] = Relationship(back_populates="leader")
    
    polls: List["Poll"] = Relationship(back_populates="author")
    poll_votes: List["PollVote"] = Relationship(back_populates="user")

    @property
    def display_name(self) -> str:
        if self.profile and self.profile.use_in_game_name and self.profile.in_game_username:
            return self.profile.in_game_username
        return self.username

class Event(EventBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    host: Optional[User] = Relationship()
    host_group: Optional["Group"] = Relationship()
    rsvps: List["EventRSVP"] = Relationship(back_populates="event", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

class EventRSVP(EventRSVPBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user: "User" = Relationship(back_populates="rsvps")
    event: "Event" = Relationship(back_populates="rsvps")

class EventTemplate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    title: str
    description: str
    featured_image_url: Optional[str] = None
    min_participants: Optional[int] = None
    max_participants: Optional[int] = None
    tags: List[str] = Field(default=[], sa_column=Column(JSON))
    category: Optional[str] = None

class Group(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: str
    type: str
    image_url: Optional[str] = None
    
    parent_id: Optional[int] = Field(default=None, foreign_key="group.id")
    parent: Optional["Group"] = Relationship(
        back_populates="children", 
        sa_relationship_kwargs={"remote_side": "Group.id"}
    )
    children: List["Group"] = Relationship(back_populates="parent")
    
    leader_id: Optional[int] = Field(default=None, foreign_key="user.id")
    leader: Optional[User] = Relationship(back_populates="led_groups")

    members: List["User"] = Relationship(back_populates="groups", link_model=UserGroupLink)

class Announcement(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    content: str
    image_url: Optional[str] = None
    tags: List[str] = Field(default=[], sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    author_id: Optional[int] = Field(default=None, foreign_key="user.id")
    author: Optional[User] = Relationship(back_populates="announcements")

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

class Poll(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    end_date: Optional[datetime] = None
    is_active: bool = Field(default=True)
    allow_user_options: bool = Field(default=False)
    allow_multiple_votes: bool = Field(default=False)
    max_votes: Optional[int] = Field(default=1)
    
    author_id: Optional[int] = Field(default=None, foreign_key="user.id")
    author: Optional["User"] = Relationship(back_populates="polls")
    
    options: List["PollOption"] = Relationship(back_populates="poll", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    votes: List["PollVote"] = Relationship(back_populates="poll", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

class PollOption(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    text: str
    poll_id: int = Field(foreign_key="poll.id")
    created_by_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    poll: Optional[Poll] = Relationship(back_populates="options")
    votes: List["PollVote"] = Relationship(back_populates="option", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    created_by: Optional["User"] = Relationship()

class PollVote(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    poll_id: int = Field(foreign_key="poll.id")
    option_id: int = Field(foreign_key="polloption.id")
    voted_at: datetime = Field(default_factory=datetime.utcnow)
    
    user: "User" = Relationship(back_populates="poll_votes")
    poll: "Poll" = Relationship(back_populates="votes")
    option: "PollOption" = Relationship(back_populates="votes")

# --- API Models (Pydantic) ---
class UserCreate(SQLModel):
    username: str
    email: str
    password: str
    discord_username: Optional[str] = None

class UserRead(SQLModel):
    id: int
    username: str
    display_name: Optional[str] = None
    email: str
    discord_username: Optional[str] = None
    role: UserRole
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str] = None

class UserGroupRead(SQLModel):
    id: int
    name: str
    type: str

class UserReadMe(UserRead):
    groups: List[UserGroupRead] = []

class ProfileRead(SQLModel):
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    header_image_url: Optional[str] = None
    username_color: Optional[str] = None
    real_name: Optional[str] = None
    gender: Optional[str] = None
    birthdate: Optional[date] = None
    location: Optional[str] = None
    in_game_username: Optional[str] = None
    in_game_activities: Optional[str] = None
    typical_playtime: Optional[str] = None
    use_in_game_name: bool = False
    social_links: Dict = {}
    privacy_settings: Dict = {}
    streamer_status: StreamerStatus = StreamerStatus.NONE
    streamer_visibility: PrivacyLevel = PrivacyLevel.PUBLIC

class UserReadWithProfile(UserRead):
    profile: Optional[ProfileRead] = None

class UserPublicProfile(SQLModel):
    id: int
    username: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    header_image_url: Optional[str] = None
    username_color: Optional[str] = None
    in_game_activities: Optional[str] = None
    streamer_status: Optional[StreamerStatus] = None
    streamer_visibility: Optional[PrivacyLevel] = None
    
    # Optional fields based on privacy
    bio: Optional[str] = None
    real_name: Optional[str] = None
    gender: Optional[str] = None
    birthdate: Optional[date] = None
    location: Optional[str] = None
    discord_username: Optional[str] = None
    email: Optional[str] = None
    social_links: Optional[Dict] = None
    typical_playtime: Optional[str] = None
    
    # Fields for editing (only populated for owner/staff)
    in_game_username: Optional[str] = None
    use_in_game_name: Optional[bool] = None
    privacy_settings: Optional[Dict] = None
    
    groups: List[UserGroupRead] = []
    led_groups: List[UserGroupRead] = []

class EventRSVPRead(EventRSVPBase):
    id: int
    user: UserReadWithProfile

class EventRead(EventBase):
    id: int

class GroupRead(SQLModel):
    id: int
    name: str
    image_url: Optional[str] = None

class EventReadWithDetails(EventRead):
    rsvps: List[EventRSVPRead] = []
    host: Optional[UserReadWithProfile] = None
    host_group: Optional[GroupRead] = None

class EventTemplateRead(SQLModel):
    id: int
    name: str
    title: str
    description: str
    featured_image_url: Optional[str] = None
    min_participants: Optional[int] = None
    max_participants: Optional[int] = None
    tags: List[str] = []
    category: Optional[str] = None

class EventDetailResponse(SQLModel):
    event: EventReadWithDetails
    previous_event_id: Optional[int] = None
    next_event_id: Optional[int] = None

class Token(SQLModel):
    access_token: str
    token_type: str

class TokenData(SQLModel):
    username: Optional[str] = None

class HomeSectionRead(SQLModel):
    id: int
    section_key: str
    title: str
    subtitle: Optional[str] = None
    content: str
    image_url: Optional[str] = None
    cta_text: Optional[str] = None
    cta_link: Optional[str] = None
    order_index: int
    is_visible: bool

class HomeSectionUpdate(SQLModel):
    id: Optional[int] = None
    section_key: Optional[str] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    cta_text: Optional[str] = None
    cta_link: Optional[str] = None
    order_index: Optional[int] = None
    is_visible: Optional[bool] = None

# --- Update Models ---
class EventUpdate(EventBase):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None

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

class ProfileUpdate(SQLModel):
    bio: Optional[str] = None
    real_name: Optional[str] = None
    gender: Optional[str] = None
    birthdate: Optional[date] = None
    location: Optional[str] = None
    in_game_username: Optional[str] = None
    in_game_activities: Optional[str] = None
    typical_playtime: Optional[str] = None
    use_in_game_name: Optional[bool] = None
    social_links: Optional[Dict] = None
    privacy_settings: Optional[Dict] = None
    username_color: Optional[str] = None

class VerificationRequest(SQLModel):
    email: str
    code: str
    streamer_visibility: Optional[PrivacyLevel] = None
