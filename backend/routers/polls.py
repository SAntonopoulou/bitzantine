from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, SQLModel
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from database import get_session
from models import (
    Poll, PollOption, PollVote, User, UserRole,
    UserRead
)
from auth import get_current_user, RoleChecker

router = APIRouter(
    prefix="/polls",
    tags=["polls"]
)

# --- Pydantic Models for Requests/Responses ---

class PollOptionCreate(SQLModel):
    text: str

class PollCreate(SQLModel):
    title: str
    description: str
    end_date: Optional[datetime] = None
    allow_user_options: bool = False
    allow_multiple_votes: bool = False
    max_votes: Optional[int] = 1
    options: List[str]

class PollUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None

class PollOptionRead(SQLModel):
    id: int
    text: str
    vote_count: int = 0

class PollRead(SQLModel):
    id: int
    title: str
    description: str
    created_at: datetime
    end_date: Optional[datetime] = None
    is_active: bool
    allow_user_options: bool
    allow_multiple_votes: bool
    max_votes: Optional[int]
    author_id: Optional[int] = None
    total_votes: int = 0
    options: List[PollOptionRead] = []
    user_votes: List[int] = [] # List of option IDs the user voted for

class VoteRequest(SQLModel):
    option_ids: List[int]

# --- Endpoints ---

@router.get("/", response_model=List[PollRead])
def list_polls(
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user) # Optional for public viewing? Assuming logged in for now based on context
):
    # Fetch polls with options and votes
    statement = select(Poll).options(selectinload(Poll.options).selectinload(PollOption.votes))
    polls = session.exec(statement).all()
    
    results = []
    for poll in polls:
        total_votes = sum(len(opt.votes) for opt in poll.options)
        
        poll_options = []
        user_votes = []
        
        for opt in poll.options:
            vote_count = len(opt.votes)
            poll_options.append(PollOptionRead(id=opt.id, text=opt.text, vote_count=vote_count))
            
            if current_user:
                for vote in opt.votes:
                    if vote.user_id == current_user.id:
                        user_votes.append(opt.id)
        
        results.append(PollRead(
            id=poll.id,
            title=poll.title,
            description=poll.description,
            created_at=poll.created_at,
            end_date=poll.end_date,
            is_active=poll.is_active,
            allow_user_options=poll.allow_user_options,
            allow_multiple_votes=poll.allow_multiple_votes,
            max_votes=poll.max_votes,
            author_id=poll.author_id,
            total_votes=total_votes,
            options=poll_options,
            user_votes=user_votes
        ))
        
    return results

@router.get("/{id}", response_model=PollRead)
def get_poll(
    id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Poll).where(Poll.id == id).options(selectinload(Poll.options).selectinload(PollOption.votes))
    poll = session.exec(statement).first()
    
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
        
    total_votes = sum(len(opt.votes) for opt in poll.options)
    poll_options = []
    user_votes = []
    
    for opt in poll.options:
        vote_count = len(opt.votes)
        poll_options.append(PollOptionRead(id=opt.id, text=opt.text, vote_count=vote_count))
        
        if current_user:
            for vote in opt.votes:
                if vote.user_id == current_user.id:
                    user_votes.append(opt.id)

    return PollRead(
        id=poll.id,
        title=poll.title,
        description=poll.description,
        created_at=poll.created_at,
        end_date=poll.end_date,
        is_active=poll.is_active,
        allow_user_options=poll.allow_user_options,
        allow_multiple_votes=poll.allow_multiple_votes,
        max_votes=poll.max_votes,
        author_id=poll.author_id,
        total_votes=total_votes,
        options=poll_options,
        user_votes=user_votes
    )

@router.post("/{id}/vote")
def vote_poll(
    id: int,
    vote_req: VoteRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    poll = session.get(Poll, id)
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
        
    if not poll.is_active:
        raise HTTPException(status_code=400, detail="Poll is closed")
        
    if poll.end_date and datetime.utcnow() > poll.end_date:
        poll.is_active = False
        session.add(poll)
        session.commit()
        raise HTTPException(status_code=400, detail="Poll has ended")

    # Validate number of votes
    if not poll.allow_multiple_votes and len(vote_req.option_ids) > 1:
        raise HTTPException(status_code=400, detail="Multiple votes are not allowed for this poll")
    
    if poll.allow_multiple_votes and poll.max_votes and len(vote_req.option_ids) > poll.max_votes:
        raise HTTPException(status_code=400, detail=f"You can only select up to {poll.max_votes} options")

    # Check if options belong to poll
    for option_id in vote_req.option_ids:
        option = session.get(PollOption, option_id)
        if not option or option.poll_id != id:
            raise HTTPException(status_code=400, detail=f"Invalid option ID {option_id} for this poll")

    # Check if user already voted (delete existing votes to allow re-voting/changing vote)
    existing_votes = session.exec(
        select(PollVote).where(PollVote.poll_id == id, PollVote.user_id == current_user.id)
    ).all()
    
    for vote in existing_votes:
        session.delete(vote)
        
    try:
        for option_id in vote_req.option_ids:
            new_vote = PollVote(
                user_id=current_user.id,
                poll_id=id,
                option_id=option_id
            )
            session.add(new_vote)
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(status_code=400, detail="Vote failed")
        
    return {"message": "Vote cast successfully"}

@router.post("/{id}/options")
def add_poll_option(
    id: int,
    option_req: PollOptionCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    poll = session.get(Poll, id)
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
        
    if not poll.allow_user_options:
        raise HTTPException(status_code=403, detail="User options are not allowed for this poll")
        
    if not poll.is_active:
         raise HTTPException(status_code=400, detail="Poll is closed")

    new_option = PollOption(
        text=option_req.text,
        poll_id=id,
        created_by_id=current_user.id
    )
    session.add(new_option)
    session.commit()
    session.refresh(new_option)
    
    return new_option

# --- Admin Endpoints ---

@router.post("/", response_model=PollRead)
def create_poll(
    poll_req: PollCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]))
):
    new_poll = Poll(
        title=poll_req.title,
        description=poll_req.description,
        end_date=poll_req.end_date,
        allow_user_options=poll_req.allow_user_options,
        allow_multiple_votes=poll_req.allow_multiple_votes,
        max_votes=poll_req.max_votes,
        author_id=current_user.id,
        is_active=True
    )
    session.add(new_poll)
    session.commit()
    session.refresh(new_poll)
    
    for opt_text in poll_req.options:
        opt = PollOption(text=opt_text, poll_id=new_poll.id, created_by_id=current_user.id)
        session.add(opt)
    
    session.commit()
    session.refresh(new_poll)
    
    # Construct response manually since relationships might not be fully loaded for Pydantic
    # Or just re-fetch
    return get_poll(new_poll.id, session, current_user)

@router.patch("/{id}", response_model=PollRead)
def update_poll(
    id: int,
    poll_update: PollUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]))
):
    poll = session.get(Poll, id)
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
        
    poll_data = poll_update.dict(exclude_unset=True)
    for key, value in poll_data.items():
        setattr(poll, key, value)
        
    session.add(poll)
    session.commit()
    session.refresh(poll)
    return get_poll(id, session, current_user)

@router.delete("/{id}")
def delete_poll(
    id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]))
):
    poll = session.get(Poll, id)
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
        
    session.delete(poll)
    session.commit()
    return {"message": "Poll deleted successfully"}

@router.delete("/{id}/options/{option_id}")
def delete_poll_option(
    id: int,
    option_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]))
):
    option = session.get(PollOption, option_id)
    if not option or option.poll_id != id:
        raise HTTPException(status_code=404, detail="Option not found")
        
    session.delete(option)
    session.commit()
    return {"message": "Option deleted successfully"}
